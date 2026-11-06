import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, test, type Cookie, type Page, type Route } from '@playwright/test';
import { createUser } from '../../lib/server/admin/auth.ts';
import { readExport } from '../../lib/server/instance-export.ts';

const EMAIL = 'admin@example.com';
const PASSWORD = 'correct horse battery';
const TOKEN = 'glpat-e2e-secret';
// The local https Git server `playwright.config.ts` starts.
const GIT_HOST = 'localhost:4443';
const GIT_URL = `https://${GIT_HOST}/platform/auth.git`;

// Each test builds on the account and data the one before it created.
test.describe.configure({ mode: 'serial' });

function setupToken(logFile = 'server.log'): string {
	const log = readFileSync(join(process.env.E2E_DIR!, logFile), 'utf8');
	// The token is base64url; this also ends it before the quote of a JSON log line.
	return log.match(/setup token ([\w-]+)/)![1];
}

// The working copy behind the local Git server, see `playwright.config.ts`.
const WORK = join(process.env.E2E_DIR!, 'auth');
const REPOSITORY = join(process.env.E2E_DIR!, 'repositories', 'platform', 'auth.git');

/** Changes the working copy, commits and pushes it to the repository the sources read. */
function pushCommit(message: string, change: () => void) {
	change();
	const git = (...args: string[]) => execFileSync('git', ['-C', WORK, ...args]);
	git('add', '--all');
	git(
		'-c',
		'user.name=e2e',
		'-c',
		'user.email=e2e@example.com',
		'commit',
		'--quiet',
		'-m',
		message
	);
	git('push', '--quiet', REPOSITORY, 'main');
}

// A status in the page itself, and the toasts that report what an action did.
const notice = (page: Page) => page.getByRole('main').getByRole('status');
const toasts = (page: Page) => page.getByRole('status', { name: 'Notifications' });

async function logIn(page: Page, password = PASSWORD, email = EMAIL) {
	await page.goto('/login');
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Log in', exact: true }).click();
}

// The session of the login flow, reused where a test needs an admin but not a login: every login
// hashes the password, which takes the bulk of a test's time.
let adminSession: Cookie[] = [];

/** Logs out through the user menu, whoever is logged in. */
async function logOut(page: Page) {
	// Until the menu opens, its button is the only one in the header.
	await page.getByRole('banner').getByRole('button').click();
	await page.getByRole('button', { name: 'Log out' }).click();
}

const sidebar = (page: Page) => page.getByRole('navigation', { name: 'Management' });

/** Opens the source list through the sidebar, as an admin does to reach a source. */
async function openSources(page: Page) {
	await sidebar(page)
		.getByRole('link', { name: /^Sources/ })
		.click();
	await expect(page).toHaveURL('/manage/sources');
}

/** The sync state in the head of a source page while a sync runs. */
const syncing = (page: Page) => page.getByRole('main').getByText('syncing…', { exact: true });

async function sourceTab(page: Page, name: string) {
	await page.getByRole('navigation', { name: 'Source' }).getByRole('link', { name }).click();
	await expect(
		page.getByRole('navigation', { name: 'Source' }).getByRole('link', { name })
	).toHaveAttribute('aria-current', 'page');
}

const area = (page: Page, name: string) =>
	page.getByRole('navigation', { name: 'Areas' }).getByRole('link', { name });

async function asAdmin(page: Page) {
	await page.context().addCookies(adminSession);
	await page.goto('/manage');
}

// Holds the page's scripts until the field is filled, as on a slow connection, then waits until
// Svelte has applied the field's attributes: it keeps them in a symbol property on the element.
async function fillBeforeHydration(page: Page, path: string, label: string, value: string) {
	const held: Route[] = [];
	let released = false;
	await page.route('**/_app/immutable/**', (route) =>
		released ? route.continue() : held.push(route)
	);
	await page.goto(path, { waitUntil: 'commit' });
	const field = page.getByLabel(label);
	await field.fill(value);
	released = true;
	for (const route of held) await route.continue();
	await page.waitForFunction(
		(element) => Object.getOwnPropertySymbols(element).length > 0,
		await field.elementHandle()
	);
}

test('leads from the empty start page through the login action to the setup', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('No sources yet.')).toBeVisible();
	await page.getByRole('link', { name: 'Log in' }).click();
	await expect(page).toHaveURL('/setup');
});

test('sets up the admin account with the token from the server log', async ({ page }) => {
	await page.goto('/manage');
	await expect(page).toHaveURL('/setup');
	const create = page.locator('form', {
		has: page.getByRole('button', { name: 'Create admin account' })
	});
	// Without these tokens a password manager offers to save nothing, or files it under no user.
	await expect(create.getByLabel('Email address')).toHaveAttribute('autocomplete', 'username');
	await expect(create.getByLabel('Password')).toHaveAttribute('autocomplete', 'new-password');

	await create.getByLabel('Setup token').fill('not-the-token');
	await create.getByLabel('Email address').fill(EMAIL);
	await create.getByLabel('Password').fill(PASSWORD);
	await create.getByRole('button', { name: 'Create admin account' }).click();
	await expect(create.getByLabel('Setup token')).toHaveAttribute('aria-invalid', 'true');
	await expect(create.getByLabel('Email address')).not.toHaveAttribute('aria-invalid');

	await create.getByLabel('Setup token').fill(setupToken());
	await create.getByLabel('Email address').fill(EMAIL);
	await create.getByLabel('Password').fill(PASSWORD);
	await create.getByRole('button', { name: 'Create admin account' }).click();

	await expect(page).toHaveURL('/manage');
	await expect(page.getByRole('heading', { name: 'Manage grimoire' })).toBeVisible();
});

test('logs out and back in, and rejects a wrong password', async ({ page }) => {
	await logIn(page);
	await expect(page).toHaveURL('/manage');

	await logOut(page);
	await expect(page).toHaveURL('/login');
	await page.goto('/manage');
	await expect(page).toHaveURL('/login?next=%2Fmanage');

	await expect(page.getByLabel('Email address')).toHaveAttribute('autocomplete', 'username');
	await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'current-password');

	await logIn(page, 'wrong password');
	await expect(page.getByRole('alert')).toHaveText('Wrong email address or password.');
	await expect(page.getByLabel('Email address')).toHaveValue(EMAIL);
	await expect(page.getByLabel('Password')).toHaveAttribute('aria-invalid', 'true');
	await expect(page.getByLabel('Password')).toHaveAccessibleDescription(
		'Wrong email address or password.'
	);

	await logIn(page);
	await expect(page).toHaveURL('/manage');
	adminSession = await page.context().cookies();
});

test('offers the login action while logged out, and the account and management once logged in', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Log in' }).click();
	await expect(page).toHaveURL('/login');

	await logIn(page);
	await page.goto('/');
	await expect(page.getByRole('button', { name: EMAIL })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Log in' })).toHaveCount(0);
	await page.getByRole('button', { name: EMAIL }).click();
	await page.getByRole('link', { name: 'Login and password' }).click();
	await expect(page).toHaveURL('/account');
	await area(page, 'Account').click();
	await expect(page).toHaveURL('/account/api-keys');
	await area(page, 'Management').click();
	await expect(page).toHaveURL('/manage');

	await page.goto('/');
	await logOut(page);
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});

/** Logs in at the mock identity provider, which takes any user and claims. */
async function logInThrough(page: Page, provider: string, user: string, claims: object) {
	await page.getByRole('button', { name: `Log in with ${provider}` }).click();
	await page.locator('input[name="username"]').fill(user);
	await page.locator('textarea[name="claims"]').fill(JSON.stringify(claims));
	await page.getByRole('button', { name: 'Sign-in' }).click();
}

test('logs in through an identity provider, creating an account only where it may', async ({
	page
}) => {
	await page.goto('/account');
	await expect(page).toHaveURL('/login?next=%2Faccount');
	await logInThrough(page, 'GitLab', 'ada', { email: 'ada@e2e.example', email_verified: true });
	await expect(page).toHaveURL('/account');
	await expect(page.getByRole('button', { name: 'ada@e2e.example' })).toBeVisible();
	await logOut(page);

	// The same identity is the same account, whatever address the provider reports by now. It has
	// no role: it lands on the start page, like every user without one.
	await logInThrough(page, 'GitLab', 'ada', {
		email: 'lovelace@e2e.example',
		email_verified: true
	});
	await expect(page).toHaveURL('/');
	await expect(page.getByRole('button', { name: 'ada@e2e.example' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Management' })).toHaveCount(0);
	await logOut(page);

	// Only a verified address in an allowed domain learns that it has an account here.
	await logInThrough(page, 'GitLab', 'mallory', { email: EMAIL, email_verified: true });
	await expect(page.getByRole('alert')).toHaveText(
		'No account can be created for this address. If you have an account here already, log in and link the provider under Account; otherwise ask an admin for an invitation.'
	);
	await logInThrough(page, 'GitLab', 'mallory', { email: 'ada@e2e.example', email_verified: true });
	await expect(page.getByRole('alert')).toHaveText(
		'An account with this email address exists already. Log in with your password, then link the provider under Account. An account without a password gets one through “Forgot your password?”.'
	);
	await logInThrough(page, 'GitLab', 'eve', { email: 'eve@e2e.example', email_verified: false });
	await expect(page.getByRole('alert')).toHaveText(
		'No account can be created for this address. If you have an account here already, log in and link the provider under Account; otherwise ask an admin for an invitation.'
	);
	await logInThrough(page, 'Microsoft', 'grace', {
		email: 'grace@e2e.example',
		email_verified: true
	});
	await expect(page.getByRole('alert')).toHaveText(
		'Your account at the identity provider may not log in here. Ask an admin which accounts may.'
	);
	// Still logged out: no user menu in the header.
	await expect(page.getByRole('banner').getByRole('button')).toHaveCount(0);
});

test('creates a source and never shows its token', async ({ page }) => {
	await asAdmin(page);
	await openSources(page);
	await page.getByRole('link', { name: 'New source' }).click();
	// Typed key by key: the slug next to the field follows every keystroke.
	await page.getByLabel('Name', { exact: true }).pressSequentially('Auth Service');
	await expect(notice(page)).toHaveText('Slug: auth-service');
	await page.getByLabel('Short description').fill('Login and billing');
	await page.getByLabel('Git URL').fill(GIT_URL);
	await page.getByLabel('Username').fill('deploy');
	await page.getByLabel('Access token').fill(TOKEN);
	// The test answers in place: a reload would drop this mark.
	await page.evaluate(() => Object.assign(window, { notReloaded: true }));
	await page.getByRole('button', { name: 'Test connection' }).click();
	const reachable = page
		.getByRole('main')
		.getByRole('status')
		.filter({ hasText: 'Reachable: branch main is at commit' });
	await expect(reachable).toBeVisible();
	await expect(reachable.locator('svg')).toBeVisible();
	expect(await page.evaluate(() => 'notReloaded' in window)).toBe(true);
	// The repository has no `docs/` yet: nothing is saved, and the path field says why.
	await page.getByLabel('Path in the repository').fill('docs');
	await page.getByRole('button', { name: 'Create source' }).click();
	await expect(page.locator('#path-error')).toHaveText(
		'The path docs does not exist on branch main.'
	);
	await expect(page.getByLabel('Path in the repository')).toHaveAttribute('aria-invalid', 'true');
	pushCommit('docs', () => {
		mkdirSync(join(WORK, 'docs'));
		writeFileSync(join(WORK, 'docs', 'index.md'), '# Auth\n');
	});
	await page.getByRole('button', { name: 'Create source' }).click();

	await expect(page.getByRole('heading', { name: 'Source Auth Service' })).toBeVisible();
	await sourceTab(page, 'Settings');
	await expect(page.getByLabel('Short description')).toHaveValue('Login and billing');
	await expect(page.getByLabel('Git URL')).toHaveValue(GIT_URL);
	await expect(page.getByLabel('Access token')).toHaveValue('');
	await expect(page.getByText('stored; leave empty to keep it')).toBeVisible();
	expect(await page.content()).not.toContain(TOKEN);

	await openSources(page);
	await expect(page.getByRole('link', { name: 'Auth Service', exact: true })).toBeVisible();
});

test('syncs a source now and shows why it failed', async ({ page }) => {
	// The repository loses the directory after the source was saved.
	pushCommit('remove docs', () => rmSync(join(WORK, 'docs'), { recursive: true }));
	await asAdmin(page);
	await openSources(page);
	await page.getByRole('link', { name: 'Auth Service', exact: true }).click();
	// The sync saving started may still run: "Sync now" would join it, and it read the old commit.
	await expect(page.getByRole('heading', { name: 'Source Auth Service' })).toBeVisible();
	await expect(syncing(page)).toHaveCount(0, { timeout: 15_000 });

	await page.getByRole('button', { name: 'Sync now' }).click();

	// The sync runs after the answer; the page refreshes by itself until its outcome shows, also
	// on another sub page.
	await expect(syncing(page)).toBeVisible();
	await sourceTab(page, 'History');
	await expect(toasts(page)).toContainText('Sync of Auth Service failed.', { timeout: 15_000 });
	await expect(syncing(page)).toHaveCount(0);
	await sourceTab(page, 'Status');
	await expect(page.getByRole('alert')).toContainText('source path "docs" does not exist');
	expect(await page.content()).not.toContain(TOKEN);

	await page.goto('/manage');
	const attention = page.getByRole('listitem').filter({ hasText: 'auth-service' });
	await expect(attention).toContainText('sync error: source path "docs" does not exist');
	await attention.getByRole('link').click();
	await expect(page.getByRole('heading', { name: 'Source Auth Service' })).toBeVisible();
});

test('keeps a tested token that is not saved yet when syncing now', async ({ page }) => {
	const rotated = 'glpat-rotated-e2e-token';
	await asAdmin(page);
	await openSources(page);
	await page.getByRole('link', { name: 'Auth Service', exact: true }).click();
	await sourceTab(page, 'Settings');
	await page.getByLabel('Access token').fill(rotated);
	await page.getByRole('button', { name: 'Test connection' }).click();
	// The token is accepted: only the path the repository lost is refused.
	await expect(
		page.getByRole('alert').filter({ hasText: 'The path docs does not exist on branch main.' })
	).toBeVisible();

	await page.getByRole('button', { name: 'Sync now' }).click();

	await expect(syncing(page)).toBeVisible();
	await expect(syncing(page)).toHaveCount(0, { timeout: 15_000 });
	await expect(page.getByLabel('Access token (entered; leave empty to keep it)')).toBeVisible();
	expect(await page.content()).not.toContain(rotated);
});

// The export of the next test, imported on the second instance after it.
let exportPath = '';
const EXPORT_PASSPHRASE = 'harbour lantern seventeen';

test('exports the instance, the stored token readable only with the passphrase', async ({
	page
}) => {
	const passphrase = EXPORT_PASSPHRASE;
	await asAdmin(page);
	await page.goto('/manage/settings');
	await page.getByLabel('Passphrase (at least 12 characters)').fill(passphrase);
	await page.getByLabel('Passphrase again').fill(`${passphrase}!`);
	await page.getByRole('button', { name: 'Download export' }).click();
	await expect(page.getByRole('alert')).toHaveText('The two passphrases differ.');

	await page.getByLabel('Passphrase (at least 12 characters)').fill(passphrase);
	await page.getByLabel('Passphrase again').fill(passphrase);
	const downloading = page.waitForEvent('download');
	await page.getByRole('button', { name: 'Download export' }).click();
	const download = await downloading;

	expect(download.suggestedFilename()).toMatch(/^grimoire-\d{4}-\d{2}-\d{2}\.grimoire-export$/);
	// Saved apart: Playwright deletes a download with the test that made it.
	exportPath = join(process.env.E2E_DIR!, download.suggestedFilename());
	await download.saveAs(exportPath);
	const file = readFileSync(exportPath);
	expect(file.toString('latin1')).not.toContain(TOKEN);
	const result = await readExport(file, passphrase);
	if (!('db' in result)) throw new Error(result.error);
	expect(result.db.prepare('SELECT slug, encrypted_token FROM sources').all()).toEqual([
		{ slug: 'auth-service', encrypted_token: TOKEN }
	]);
});

// The second instance runs with another encryption key: the token must arrive readable there.
test('imports the export on the setup page of an empty instance with another key', async ({
	page
}) => {
	const other = 'http://localhost:4174';
	await page.goto(`${other}/manage`);
	await expect(page).toHaveURL(`${other}/setup`);
	const importing = page.locator('form', { has: page.getByRole('button', { name: 'Import' }) });
	await importing.getByLabel('Setup token').fill(setupToken('import-server.log'));
	await importing.getByLabel('Export file').setInputFiles(exportPath);
	await importing.getByLabel('Passphrase of the export').fill('harbour lantern eighteen');
	await importing.getByRole('button', { name: 'Import' }).click();
	await expect(page.getByRole('alert')).toHaveText(
		'The passphrase is wrong, or the file was changed or cut short since it was exported.'
	);
	await expect(importing.getByLabel('Passphrase of the export')).toHaveAttribute(
		'aria-invalid',
		'true'
	);

	await importing.getByLabel('Setup token').fill(setupToken('import-server.log'));
	await importing.getByLabel('Export file').setInputFiles(exportPath);
	await importing.getByLabel('Passphrase of the export').fill(EXPORT_PASSPHRASE);
	await importing.getByRole('button', { name: 'Import' }).click();
	await expect(page).toHaveURL(`${other}/login?imported`);
	await expect(notice(page)).toContainText('The export is imported.');

	await page.getByLabel('Email address').fill(EMAIL);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Log in', exact: true }).click();
	await expect(page).toHaveURL(`${other}/manage`);
	await sidebar(page)
		.getByRole('link', { name: /^Sources/ })
		.click();
	await page.getByRole('link', { name: 'Auth Service', exact: true }).click();
	await sourceTab(page, 'Settings');
	await expect(page.getByText('stored; leave empty to keep it')).toBeVisible();
	// The stored token decrypts under this instance's key: the connection test sends it, and only
	// the path the repository lost is refused.
	await page.getByRole('button', { name: 'Test connection' }).click();
	await expect(
		page.getByRole('alert').filter({ hasText: 'The path docs does not exist on branch main.' })
	).toBeVisible();
	expect((await page.request.get(`${other}/setup`)).status()).toBe(404);
});

test('lists an internal source on the start page only once logged in, without its settings', async ({
	page
}) => {
	await page.goto('/');
	await expect(page.getByRole('row', { name: /auth-service/ })).toHaveCount(0);
	await asAdmin(page);
	await page.goto('/');
	await expect(page.getByRole('row', { name: /auth-service/ })).toContainText('Login and billing');
	// Synced once without success: its error message stays hidden, like the settings.
	const html = await page.content();
	for (const detail of [GIT_HOST, 'does not exist', TOKEN]) {
		expect(html).not.toContain(detail);
	}
	// The Git username; as a whole word, since the search placeholder says "deployment".
	expect(html).not.toMatch(/\bdeploy\b/);
});

test('links the documentation of a source only once its URL is set', async ({ page }) => {
	const docsUrl = 'https://docs.e2e.example/auth/';
	await asAdmin(page);
	await openSources(page);
	await page.getByRole('link', { name: 'Auth Service', exact: true }).click();
	await expect(page.getByRole('link', { name: 'Documentation', exact: true })).toHaveCount(0);

	await sourceTab(page, 'Settings');
	await page.getByLabel('Documentation site').fill(docsUrl);
	await page.getByRole('button', { name: 'Save' }).click();

	await expect(page.getByRole('link', { name: 'Documentation', exact: true })).toHaveAttribute(
		'href',
		docsUrl
	);

	await page.goto('/');
	expect(await page.content()).not.toContain('docs.e2e.example');
});

test('shows how to connect Claude Code to this instance', async ({ page }) => {
	await page.goto('/');
	// The server derives the origin from `x-forwarded-proto`, as it would behind a proxy. A visitor
	// has no key: the command connects without one.
	await expect(page.locator('pre')).toHaveText(
		'claude mcp add \\\n' +
			'  --transport http \\\n' +
			'  --scope user \\\n' +
			'  grimoire \\\n' +
			'  http://localhost:4173/mcp'
	);
	await asAdmin(page);
	await page.goto('/');
	await expect(page.locator('pre')).toHaveText(
		'claude mcp add \\\n' +
			'  --transport http \\\n' +
			'  --scope user \\\n' +
			'  grimoire \\\n' +
			'  http://localhost:4173/mcp \\\n' +
			'  --header "Authorization: Bearer <key>"'
	);
	await expect(page.getByRole('link', { name: 'Connecting agents' })).toHaveAttribute(
		'href',
		'https://elnebuloso.github.io/grimoire/agents/'
	);
	await expect(page.getByRole('link', { name: 'grimoire on GitHub' })).toHaveAttribute(
		'href',
		'https://github.com/elnebuloso/grimoire'
	);
	// `playwright.config.ts` runs the server as release 1.2.3.
	await expect(page.locator('footer')).toContainText('grimoire 1.2.3');
	await expect(page.getByRole('link', { name: '1.2.3' })).toHaveAttribute(
		'href',
		'https://github.com/elnebuloso/grimoire/releases/tag/v1.2.3'
	);
});

test('leads through the management area with one navigation that marks the current page', async ({
	page
}) => {
	await asAdmin(page);
	const navigation = page.getByRole('navigation', { name: 'Management' });
	await expect(navigation.getByRole('link', { name: 'Overview' })).toHaveAttribute(
		'aria-current',
		'page'
	);

	await navigation.getByRole('link', { name: 'Settings' }).click();
	await expect(page).toHaveURL('/manage/settings');
	await expect(navigation.getByRole('link', { name: 'Settings' })).toHaveAttribute(
		'aria-current',
		'page'
	);
	await expect(navigation.getByRole('link', { name: 'Overview' })).not.toHaveAttribute(
		'aria-current'
	);
	await navigation.getByRole('link', { name: 'All API keys' }).click();
	await expect(page).toHaveURL('/manage/api-keys');
	await navigation.getByRole('link', { name: 'Dead links' }).click();
	await expect(page).toHaveURL('/manage/dead-links');
	await expect(navigation.getByRole('link', { name: 'Dead links' })).toHaveAttribute(
		'aria-current',
		'page'
	);
	// A source belongs to the list it is reached from.
	await openSources(page);
	await page.getByRole('link', { name: 'Auth Service', exact: true }).click();
	await expect(navigation.getByRole('link', { name: /^Sources/ })).toHaveAttribute(
		'aria-current',
		'true'
	);
	await expect(navigation.getByRole('link', { name: 'My API keys' })).toHaveCount(0);

	// The server already marks it: before hydration, and for a reader without JavaScript.
	const html = await (await page.request.get('/manage/settings')).text();
	expect(html).toMatch(/<a href="[^"]*settings"[^>]*aria-current="page"/);
});

/** Opens a page and checks that the server already names it and keeps it out of search indexes. */
async function expectTitle(page: Page, path: string, title: string) {
	const response = await page.goto(path);
	expect(await response!.text()).toContain(`<title>${title}</title>`);
	await expect(page).toHaveTitle(title);
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
}

// One page of each kind of title; the PageHead stories cover how titles are put together.
test('names pages in the browser tab from the first response and keeps them out of search indexes', async ({
	page
}) => {
	await expectTitle(page, '/', 'grimoire');
	await expectTitle(page, '/login', 'Log in to grimoire');
	await expectTitle(page, '/no/such/page', 'Page not found – grimoire');

	await asAdmin(page);
	await expectTitle(page, '/manage/settings', 'Settings – grimoire');

	await page.goto('/manage');
	await openSources(page);
	await page.getByRole('link', { name: 'Auth Service', exact: true }).click();
	await expect(page).toHaveTitle('Source Auth Service – grimoire');
});

test('shows the error page in the layout to a user without the role and on a finished setup', async ({
	page
}) => {
	const editor = 'editor@example.com';
	const db = new DatabaseSync(join(process.env.E2E_DIR!, 'grimoire.db'));
	await createUser(db, { email: editor, password: PASSWORD, roles: [] });
	db.close();

	const setup = await page.goto('/setup');
	expect(setup?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: 'This page does not exist.' })).toBeVisible();
	await expect(page).toHaveTitle('Page not found – grimoire');

	await logIn(page, PASSWORD, editor);
	await expect(page).toHaveURL('/');
	const forbidden = await page.goto('/manage/settings');
	expect(forbidden?.status()).toBe(403);
	expect(forbidden?.headers()['x-robots-tag']).toBe('noindex, nofollow');
	await expect(page.getByRole('heading', { name: 'You may not open this page.' })).toBeVisible();
	await expect(page).toHaveTitle('Access denied – grimoire');
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
	await expect(page.getByRole('button', { name: editor })).toBeVisible();
});

test('creates an API key that works for its source until it is revoked', async ({
	page,
	request
}) => {
	await asAdmin(page);
	await area(page, 'Account').click();
	await expect(page).toHaveURL('/account/api-keys');
	await page.getByRole('button', { name: 'New key' }).click();
	const dialog = page.getByRole('dialog');
	await dialog.getByRole('textbox', { name: 'Name' }).fill('ci');
	await dialog.getByLabel('Only these:').check();
	await dialog.getByRole('button', { name: 'Create key' }).click();
	await expect(dialog.getByRole('alert')).toHaveText('Choose all sources or at least one.');
	await expect(dialog.getByLabel('Only these:')).toBeFocused();

	await dialog.getByRole('searchbox').fill('auth');
	await dialog.getByRole('checkbox', { name: /auth-service/ }).check();
	await dialog.getByRole('button', { name: 'Create key' }).click();

	// The result replaces the form: nothing is left to create the key a second time.
	const key = await dialog.locator('output').textContent();
	expect(key).toMatch(/^grimoire_/);
	await expect(dialog.locator('pre')).toContainText(`--header "Authorization: Bearer ${key}"`);
	await expect(dialog.getByRole('button', { name: 'Create key' })).toHaveCount(0);
	await dialog.getByRole('button', { name: 'Done' }).click();
	const sources = () => request.get('/sources', { headers: { Authorization: `Bearer ${key}` } });
	expect(await (await sources()).text()).toBe('- auth-service: Login and billing');

	await page.goto('/manage/api-keys');
	await expect(page.getByRole('row', { name: /ci/ })).toContainText('no end');
	await page.getByRole('link', { name: EMAIL }).click();
	await expect(page).toHaveURL(`/manage/users?search=${encodeURIComponent(EMAIL)}`);
	await page.getByRole('link', { name: `Keys of ${EMAIL}` }).click();
	await expect(page.getByRole('status').filter({ hasText: `Keys of ${EMAIL}.` })).toBeVisible();
	await expect(page.getByRole('row', { name: /ci/ })).toBeVisible();

	await page.goto('/account/api-keys');
	expect(await page.content()).not.toContain(key!);
	const keyEntry = page
		.getByRole('listitem')
		.filter({ has: page.getByText('ci', { exact: true }) });
	await expect(keyEntry).toContainText('auth-service');

	await page.getByRole('button', { name: 'Edit ci' }).click();
	await dialog.getByLabel('All sources, including future ones').check();
	await dialog.getByRole('button', { name: 'Save changes' }).click();
	await expect(toasts(page)).toContainText('ci changed.');
	await expect(dialog).toBeHidden();
	await expect(keyEntry).toContainText('all sources');

	await page.getByRole('button', { name: 'Revoke ci' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Revoke' }).click();
	await expect(page.getByText('No API keys yet.')).toBeVisible();
	expect((await sources()).status()).toBe(401);
});

test('invites a user who reads internal sources with their own key, but manages no source', async ({
	page
}) => {
	const writer = 'writer@example.com';
	await fetch(`${MAIL_API}/messages`, { method: 'DELETE' });
	await asAdmin(page);
	// Typed before the page hydrates, as on a slow connection: the address must stay.
	await fillBeforeHydration(page, '/manage/users', 'Email address', writer);
	await expect(page.getByLabel('Email address')).toHaveValue(writer);
	await page.getByRole('button', { name: 'Send invitation' }).click();
	await expect(toasts(page)).toContainText(`Invitation sent to ${writer}.`);
	await expect(page.getByRole('row', { name: new RegExp(writer) })).toContainText('Send again');

	const link = await linkFromMail(writer, '/invite/');
	await page.context().clearCookies();
	await page.goto(link);
	await expect(page.getByLabel('Email address')).toHaveValue(writer);
	await page.getByLabel('Password').fill('writer battery horse');
	await page.getByRole('button', { name: 'Create account' }).click();
	await expect(page).toHaveURL('/account/api-keys?welcome');
	await expect(notice(page)).toContainText('Welcome to grimoire.');

	// The admin's source is internal: listed on the start page, but not open to manage.
	await page.goto('/');
	await expect(page.getByRole('row', { name: /auth-service/ })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Management' })).toHaveCount(0);
	expect((await page.goto('/manage'))?.status()).toBe(403);
	expect((await page.goto('/manage/sources/new'))?.status()).toBe(403);

	await page.goto('/');
	await area(page, 'Account').click();
	await expect(page).toHaveURL('/account/api-keys');
	await page.getByRole('button', { name: 'New key' }).click();
	await page.getByRole('dialog').getByRole('textbox', { name: 'Name' }).fill('writer-laptop');
	await page.getByRole('dialog').getByRole('button', { name: 'Create key' }).click();
	const key = await page.getByRole('dialog').locator('output').textContent();
	const sources = await page.request.get('/sources', {
		headers: { Authorization: `Bearer ${key}` }
	});
	expect(await sources.text()).toBe('- auth-service: Login and billing');

	await page.context().clearCookies();
	await page.context().addCookies(adminSession);
	await page.goto('/manage/users');
	await page.getByRole('button', { name: `Delete ${writer}` }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
	await expect(page.getByRole('row', { name: new RegExp(writer) })).toHaveCount(0);
	expect(
		(await page.request.get('/sources', { headers: { Authorization: `Bearer ${key}` } })).status()
	).toBe(401);
});

test('accepts an invitation through an identity provider for the invited address', async ({
	page
}) => {
	// Outside the domains the provider may sign up: the invitation alone lets the account in.
	const partner = 'partner@partner.example';
	await fetch(`${MAIL_API}/messages`, { method: 'DELETE' });
	await asAdmin(page);
	await fillBeforeHydration(page, '/manage/users', 'Email address', partner);
	await expect(page.getByLabel('Email address')).toHaveValue(partner);
	await page.getByRole('button', { name: 'Send invitation' }).click();
	await expect(toasts(page)).toContainText(`Invitation sent to ${partner}.`);

	const link = await linkFromMail(partner, '/invite/');
	await page.context().clearCookies();
	await page.goto(link);
	await logInThrough(page, 'GitLab', 'partner', { email: 'p@elsewhere.example' });
	await expect(page).toHaveURL('/account/api-keys?welcome');
	await expect(page.getByRole('button', { name: partner })).toBeVisible();

	await page.context().clearCookies();
	await page.goto(link);
	await expect(page.getByRole('alert')).toContainText('This invitation link is not valid');

	// The admin sees how the account logs in, and can take the link away.
	await asAdmin(page);
	await page.goto('/manage/users');
	const row = page.getByRole('row', { name: new RegExp(partner) });
	// The column "Logs in with": the provider, no password.
	const signIn = row.getByRole('cell').nth(1);
	await expect(signIn).toContainText('GitLab');
	await expect(signIn).not.toContainText('Password');
	await page.getByRole('button', { name: `Remove GitLab from ${partner}` }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Remove' }).click();
	await expect(signIn).not.toContainText('GitLab');

	// Without any way to log in left, the admin sends a link to set a password.
	await page
		.getByRole('button', { name: `Create a link to set the password of ${partner}` })
		.click();
	await page.getByRole('dialog').getByRole('button', { name: 'Create link' }).click();
	await expect(toasts(page)).toContainText(`Link to set the password sent to ${partner}.`);
	const passwordLink = await linkFromMail(partner, '/login/reset/');
	// Opened in the admin's browser: the link works whoever is logged in.
	await page.goto(passwordLink);
	await page.getByLabel('Password').fill('partner password 2026');
	await page.getByRole('button', { name: 'Set password' }).click();
	await expect(notice(page)).toContainText('Password set.');
	await page.context().clearCookies();
	await logIn(page, 'partner password 2026', partner);
	await expect(page).toHaveURL('/');
});

test('links a provider to an existing account with its password, and removes it again', async ({
	page,
	browser
}) => {
	await asAdmin(page);
	await page.goto('/account');
	await page.getByLabel('Your password, to confirm').fill('wrong password');
	await page.getByRole('button', { name: 'Link GitLab' }).click();
	await expect(page.getByRole('alert')).toHaveText('Wrong current password.');

	await page.getByLabel('Your password, to confirm').fill(PASSWORD);
	await page.getByRole('button', { name: 'Link GitLab' }).click();
	await page.locator('input[name="username"]').fill('admin-at-gitlab');
	await page.locator('textarea[name="claims"]').fill('{}');
	await page.getByRole('button', { name: 'Sign-in' }).click();
	await expect(toasts(page)).toContainText('GitLab is linked to your account.');
	await expect(page.getByRole('button', { name: 'Remove GitLab' })).toBeVisible();

	// Elsewhere, the provider now logs in to this account; no address had to match.
	const elsewhere = await (await browser.newContext()).newPage();
	await elsewhere.goto('/login');
	await logInThrough(elsewhere, 'GitLab', 'admin-at-gitlab', {});
	await expect(elsewhere.getByRole('button', { name: EMAIL })).toBeVisible();

	await page.getByRole('button', { name: 'Remove GitLab' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Remove GitLab' }).click();
	await expect(toasts(page)).toContainText(
		'The link was removed. Your sessions in other browsers have ended; this one stays logged in.'
	);
	await elsewhere.reload();
	await expect(elsewhere).toHaveURL(/^[^?]*\/login\?/);
	await expect(elsewhere.getByRole('banner').getByRole('button')).toHaveCount(0);
	await elsewhere.context().close();
});

// Near the end, because every test before it logs in with the old password.
test('changes the password and logs in with the new one', async ({ page }) => {
	const newPassword = 'staple battery horse';
	await asAdmin(page);
	await page.getByRole('button', { name: EMAIL }).click();
	await page.getByRole('link', { name: 'Login and password' }).click();
	await expect(page.getByLabel('Email address')).toHaveValue(EMAIL);
	await expect(page.getByLabel('Email address')).toHaveAttribute('autocomplete', 'username');

	await page.getByLabel('Current password').fill('not the password');
	await page.getByLabel('New password').fill(newPassword);
	await page.getByRole('button', { name: 'Change password' }).click();
	await expect(page.getByLabel('Current password')).toHaveAttribute('aria-invalid', 'true');
	await expect(page.getByLabel('Current password')).toBeFocused();
	await expect(page.getByLabel('New password')).not.toHaveAttribute('aria-invalid');

	await page.getByLabel('Current password').fill(PASSWORD);
	await page.getByLabel('New password').fill(newPassword);
	await page.getByRole('button', { name: 'Change password' }).click();
	await expect(toasts(page)).toContainText('Password changed.');

	await page.goto('/manage');
	await logOut(page);
	await logIn(page);
	await expect(page.getByRole('alert')).toHaveText('Wrong email address or password.');
	await logIn(page, newPassword);
	await expect(page).toHaveURL('/manage');
});

// The mail catcher started in `playwright.config.ts`.
const MAIL_API = 'http://localhost:4825/api/v1';

async function linkFromMail(to: string, path: string): Promise<string> {
	let text = '';
	// Sending is not awaited by the server, so the mail arrives some time after the answer.
	await expect
		.poll(
			async () => {
				const { messages } = await (await fetch(`${MAIL_API}/messages`)).json();
				const mail = messages.find((message: { To: { Address: string }[] }) =>
					message.To.some((recipient) => recipient.Address === to)
				);
				if (mail) text = (await (await fetch(`${MAIL_API}/message/${mail.ID}`)).json()).Text;
				return text;
			},
			{ timeout: 15_000 }
		)
		.toContain(path);
	return text.match(new RegExp(`http://localhost:4173${path}[\\w-]+`))![0];
}

test('sets a forgotten password through the link in the mail', async ({ page }) => {
	const newPassword = 'horse staple battery';
	await fetch(`${MAIL_API}/messages`, { method: 'DELETE' });
	await page.goto('/login');
	await page.getByRole('link', { name: 'Forgot your password?' }).click();
	await page.getByLabel('Email address').fill(EMAIL);
	await page.getByRole('button', { name: 'Send link' }).click();
	await expect(notice(page)).toContainText('a link to set a new password is on its way');

	const link = await linkFromMail(EMAIL, '/login/reset/');
	await page.goto(link);
	await page.getByLabel('Password').fill(newPassword);
	await page.getByRole('button', { name: 'Set password' }).click();
	await expect(notice(page)).toContainText('Password set.');

	await logIn(page, newPassword);
	await expect(page).toHaveURL('/manage');
});
