import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, test, type Cookie, type Page } from '@playwright/test';
import { createUser } from '../../lib/server/admin/auth.ts';

const EMAIL = 'admin@example.com';
const PASSWORD = 'correct horse battery';
const TOKEN = 'glpat-e2e-secret';
// `playwright.config.ts` has the server's git map these to local repositories.
const GIT_URL = 'https://git.e2e.example/platform/auth.git';

// Each test builds on the account and data the one before it created.
test.describe.configure({ mode: 'serial' });

function setupToken(): string {
	const log = readFileSync(join(process.env.E2E_DIR!, 'server.log'), 'utf8');
	// The token is base64url; this also ends it before the quote of a JSON log line.
	return log.match(/setup token ([\w-]+)/)![1];
}

async function logIn(page: Page, password = PASSWORD, email = EMAIL) {
	await page.goto('/login');
	await page.getByLabel('Email address').fill(email);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Log in' }).click();
}

// The session of the login flow, reused where a test needs an admin but not a login: every login
// hashes the password, which takes the bulk of a test's time.
let adminSession: Cookie[] = [];

async function asAdmin(page: Page) {
	await page.context().addCookies(adminSession);
	await page.goto('/manage');
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
	// Without these tokens a password manager offers to save nothing, or files it under no user.
	await expect(page.getByLabel('Email address')).toHaveAttribute('autocomplete', 'username');
	await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'new-password');

	await page.getByLabel('Setup token').fill('not-the-token');
	await page.getByLabel('Email address').fill(EMAIL);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Create admin account' }).click();
	await expect(page.getByLabel('Setup token')).toHaveAttribute('aria-invalid', 'true');
	await expect(page.getByLabel('Email address')).not.toHaveAttribute('aria-invalid');

	await page.getByLabel('Setup token').fill(setupToken());
	await page.getByLabel('Email address').fill(EMAIL);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Create admin account' }).click();

	await expect(page).toHaveURL('/manage');
	await expect(page.getByRole('heading', { name: 'Manage grimoire' })).toBeVisible();
});

test('logs out and back in, and rejects a wrong password', async ({ page }) => {
	await logIn(page);
	await expect(page).toHaveURL('/manage');

	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page).toHaveURL('/login');
	await page.goto('/manage');
	await expect(page).toHaveURL('/login');

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
	await expect(page.getByText(`Logged in as ${EMAIL}`)).toBeVisible();
	await expect(page.getByRole('link', { name: 'Log in' })).toHaveCount(0);
	await page.getByRole('link', { name: EMAIL, exact: true }).click();
	await expect(page).toHaveURL('/account');
	await page.getByRole('link', { name: 'Manage', exact: true }).click();
	await expect(page).toHaveURL('/manage');

	await page.goto('/');
	await page.getByRole('button', { name: 'Log out' }).click();
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});

test('creates a source and never shows its token', async ({ page }) => {
	await asAdmin(page);
	await page.getByRole('link', { name: 'New source' }).click();
	// Typed key by key: the slug next to the field follows every keystroke.
	await page.getByLabel('Name', { exact: true }).pressSequentially('Auth Service');
	await expect(page.getByRole('status')).toHaveText('Slug: auth-service');
	await page.getByLabel('Short description').fill('Login and billing');
	// The repository has no `docs/`: the sync that creating starts fails, for the next test.
	await page.getByLabel('Git URL').fill(GIT_URL);
	await page.getByLabel('Username').fill('deploy');
	await page.getByLabel('Access token').fill(TOKEN);
	// The test answers in place: a reload would drop this mark.
	await page.evaluate(() => Object.assign(window, { notReloaded: true }));
	await page.getByRole('button', { name: 'Test connection' }).click();
	const reachable = page
		.getByRole('status')
		.filter({ hasText: 'Reachable: branch main is at commit' });
	await expect(reachable).toBeVisible();
	await expect(reachable.locator('svg')).toBeVisible();
	expect(await page.evaluate(() => 'notReloaded' in window)).toBe(true);
	await expect(page.getByLabel('Path in the repository')).toHaveValue('docs');
	await page.getByRole('button', { name: 'Create source' }).click();

	await expect(page.getByRole('heading', { name: 'Source Auth Service' })).toBeVisible();
	await expect(page.getByLabel('Short description')).toHaveValue('Login and billing');
	await expect(page.getByLabel('Git URL')).toHaveValue(GIT_URL);
	await expect(page.getByLabel('Access token')).toHaveValue('');
	await expect(page.getByText('stored; leave empty to keep it')).toBeVisible();
	expect(await page.content()).not.toContain(TOKEN);

	await page.goto('/manage');
	await expect(page.getByRole('link', { name: 'Auth Service', exact: true })).toBeVisible();
});

test('syncs a source now and shows why it failed', async ({ page }) => {
	await asAdmin(page);
	await page.getByRole('link', { name: 'Auth Service', exact: true }).click();

	await page.getByRole('button', { name: 'Sync now' }).click();

	// The sync runs after the answer; the page refreshes by itself until its outcome shows.
	await expect(page.getByRole('status')).toContainText('A sync is queued or running.');
	await expect(page.getByRole('alert')).toContainText('source path "docs" does not exist', {
		timeout: 15_000
	});
	await expect(page.getByRole('status')).toHaveCount(0);
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
	await page.getByRole('link', { name: 'Auth Service', exact: true }).click();
	await page.getByLabel('Access token').fill(rotated);
	await page.getByRole('button', { name: 'Test connection' }).click();
	await expect(page.getByRole('status').filter({ hasText: 'Reachable' })).toBeVisible();

	await page.getByRole('button', { name: 'Sync now' }).click();

	const pending = page.getByRole('status').filter({ hasText: 'A sync is queued or running.' });
	await expect(pending).toBeVisible();
	await expect(pending).toHaveCount(0, { timeout: 15_000 });
	await expect(page.getByLabel('Access token (entered; leave empty to keep it)')).toBeVisible();
	expect(await page.content()).not.toContain(rotated);
});

test('lists the sources on the public start page without their settings', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('row', { name: /auth-service/ })).toContainText('Login and billing');
	// Synced once without success: its error message stays hidden, like the settings.
	const html = await page.content();
	for (const detail of ['git.e2e.example', 'deploy', 'does not exist', TOKEN]) {
		expect(html).not.toContain(detail);
	}
});

test('links the documentation of a source only once its URL is set', async ({ page }) => {
	const docsUrl = 'https://docs.e2e.example/auth/';
	await asAdmin(page);
	await page.getByRole('link', { name: 'Auth Service', exact: true }).click();
	await expect(page.getByRole('link', { name: 'Documentation', exact: true })).toHaveCount(0);

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
	// The server derives the origin from `x-forwarded-proto`, as it would behind a proxy.
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
	await navigation.getByRole('link', { name: 'API keys' }).click();
	await expect(page).toHaveURL('/manage/api-keys');

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
	await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
});

test('creates an API key that works for its source until it is revoked', async ({
	page,
	request
}) => {
	await asAdmin(page);
	await page.getByRole('link', { name: 'API keys' }).click();
	await page.getByLabel('Name').fill('ci');
	await page.getByLabel('Only these:').check();
	await page.getByRole('button', { name: 'Create key' }).click();
	await expect(page.getByRole('alert')).toHaveText('Choose all sources or at least one.');
	await expect(page.getByLabel('Only these:').last()).toBeFocused();

	await page.getByLabel('auth-service').last().check();
	await page.getByRole('button', { name: 'Create key' }).click();

	const key = await page.locator('output').textContent();
	expect(key).toMatch(/^grimoire_/);
	const sources = () => request.get('/sources', { headers: { Authorization: `Bearer ${key}` } });
	expect(await (await sources()).text()).toBe('- auth-service: Login and billing');

	await page.goto('/manage/api-keys');
	expect(await page.content()).not.toContain(key!);
	const keyEntry = page
		.getByRole('listitem')
		.filter({ has: page.getByText('ci', { exact: true }) });
	await expect(keyEntry).toContainText('auth-service');

	page.once('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: 'Revoke ci' }).click();
	await expect(page.getByText('No API keys yet.')).toBeVisible();
	expect((await sources()).status()).toBe(401);
});

// Near the end, because every test before it logs in with the old password.
test('changes the password and logs in with the new one', async ({ page }) => {
	const newPassword = 'staple battery horse';
	await asAdmin(page);
	await page.getByRole('link', { name: 'Change the password' }).click();
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
	await expect(page.getByRole('status')).toContainText('Password changed.');

	await page.goto('/manage');
	await page.getByRole('button', { name: 'Log out' }).click();
	await logIn(page);
	await expect(page.getByRole('alert')).toHaveText('Wrong email address or password.');
	await logIn(page, newPassword);
	await expect(page).toHaveURL('/manage');
});

// The mail catcher started in `playwright.config.ts`.
const MAIL_API = 'http://localhost:4825/api/v1';

async function resetLinkFromMail(): Promise<string> {
	let text = '';
	// Sending is not awaited by the server, so the mail arrives some time after the answer.
	await expect
		.poll(
			async () => {
				const { messages } = await (await fetch(`${MAIL_API}/messages`)).json();
				const mail = messages.find((message: { To: { Address: string }[] }) =>
					message.To.some((to) => to.Address === EMAIL)
				);
				if (mail) text = (await (await fetch(`${MAIL_API}/message/${mail.ID}`)).json()).Text;
				return text;
			},
			{ timeout: 15_000 }
		)
		.toContain('/login/reset/');
	return text.match(/http:\/\/localhost:4173\/login\/reset\/[\w-]+/)![0];
}

test('sets a forgotten password through the link in the mail', async ({ page }) => {
	const newPassword = 'horse staple battery';
	await fetch(`${MAIL_API}/messages`, { method: 'DELETE' });
	await page.goto('/login');
	await page.getByRole('link', { name: 'Forgot your password?' }).click();
	await page.getByLabel('Email address').fill(EMAIL);
	await page.getByRole('button', { name: 'Send link' }).click();
	await expect(page.getByRole('status')).toContainText(
		'a link to set a new password is on its way'
	);

	const link = await resetLinkFromMail();
	await page.goto(link);
	await page.getByLabel('Password').fill(newPassword);
	await page.getByRole('button', { name: 'Set password' }).click();
	await expect(page.getByRole('status')).toContainText('Password set.');

	await logIn(page, newPassword);
	await expect(page).toHaveURL('/manage');
});
