import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const EMAIL = 'admin@example.com';
const PASSWORD = 'correct horse battery';
const TOKEN = 'glpat-e2e-secret';
// `playwright.config.ts` has the server's git map these to local repositories.
const GIT_URL = 'https://git.e2e.example/platform/auth.git';
const MISSING_GIT_URL = 'https://git.e2e.example/platform/missing.git';

// Each test builds on the account and data the one before it created.
test.describe.configure({ mode: 'serial' });

function setupToken(): string {
	const log = readFileSync(join(process.env.E2E_DIR!, 'server.log'), 'utf8');
	// The token is base64url; this also ends it before the quote of a JSON log line.
	return log.match(/setup token ([\w-]+)/)![1];
}

async function logIn(page: Page, password = PASSWORD) {
	await page.goto('/login');
	await page.getByLabel('Email address').fill(EMAIL);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Log in' }).click();
}

test('shows the public start page before any source exists', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('No sources yet.')).toBeVisible();
});

test('leads from the login action to the setup while there is no admin account', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Log in' }).click();
	await expect(page).toHaveURL('/setup');
});

test('sets up the admin account with the token from the server log', async ({ page }) => {
	await page.goto('/manage');
	await expect(page).toHaveURL('/setup');
	// Without these tokens a password manager offers to save nothing, or files it under no user.
	await expect(page.getByLabel('Email address')).toHaveAttribute('autocomplete', 'username');
	await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'new-password');

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

	await logIn(page);
	await expect(page).toHaveURL('/manage');
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
	await logIn(page);
	await page.getByRole('link', { name: 'New source' }).click();
	// Typed key by key: the slug next to the field follows every keystroke.
	await page.getByLabel('Name', { exact: true }).pressSequentially('Auth Service');
	await expect(page.getByRole('status')).toHaveText('Slug: auth-service');
	await page.getByLabel('Short description').fill('Login and billing');
	await page.getByLabel('Git URL').fill(MISSING_GIT_URL);
	await page.getByLabel('Username').fill('deploy');
	await page.getByLabel('Access token').fill(TOKEN);
	await page.getByRole('button', { name: 'Test connection' }).click();
	await expect(page.getByRole('alert')).toContainText('Access refused, or there is no repository');
	await page.getByRole('button', { name: 'Create source' }).click();
	await expect(page.getByRole('alert')).toContainText('Access refused, or there is no repository');
	await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Auth Service');
	await expect(page.getByLabel('Access token')).toHaveValue('');
	await expect(page.getByText('entered; leave empty to keep it')).toBeVisible();
	expect(await page.content()).not.toContain(TOKEN);

	// The repository has no `docs/`: the sync that creating starts fails, for the next test.
	await page.getByLabel('Git URL').fill(GIT_URL);
	await page.getByRole('button', { name: 'Test connection' }).click();
	await expect(
		page.getByRole('status').filter({ hasText: 'Reachable: branch main is at commit' })
	).toBeVisible();
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
	await logIn(page);
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

test('lists the sources on the public start page without their settings', async ({ page }) => {
	await page.goto('/');
	const row = page.getByRole('row', { name: /auth-service/ });
	await expect(row).toContainText('Login and billing');
	// Synced once without success: marked as an error, its message stays hidden.
	await expect(row.getByRole('cell').nth(0)).toHaveText('private');
	await expect(row.getByRole('cell').nth(5)).toHaveText('yes');
	const html = await page.content();
	for (const detail of ['git.e2e.example', 'deploy', 'does not exist', TOKEN]) {
		expect(html).not.toContain(detail);
	}
});

test('links the documentation of a source only once its URL is set', async ({ page }) => {
	const docsUrl = 'https://docs.e2e.example/auth/';
	await logIn(page);
	await page.getByRole('link', { name: 'Auth Service', exact: true }).click();
	await expect(page.getByRole('link', { name: 'Documentation' })).toHaveCount(0);

	await page.getByLabel('Documentation URL').fill(docsUrl);
	await page.getByRole('button', { name: 'Save' }).click();

	await expect(page.getByRole('link', { name: 'Documentation' })).toHaveAttribute('href', docsUrl);

	await page.goto('/');
	expect(await page.content()).not.toContain('docs.e2e.example');
});

test('shows how to connect Claude Code to this instance', async ({ page }) => {
	await page.goto('/');
	// The server derives the origin from `x-forwarded-proto`, as it would behind a proxy.
	await expect(page.locator('pre')).toHaveText(
		'claude mcp add --transport http grimoire http://localhost:4173/mcp \\\n' +
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
});

test('leads through the management area with one navigation that marks the current page', async ({
	page
}) => {
	await logIn(page);
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
});

test('creates an API key that works for its source until it is revoked', async ({
	page,
	request
}) => {
	await logIn(page);
	await page.getByRole('link', { name: 'API keys' }).click();
	await page.getByLabel('Name').fill('ci');
	await page.getByLabel('Only these:').check();
	await page.getByLabel('auth-service').check();
	await page.getByRole('button', { name: 'Create key' }).click();

	const key = await page.locator('output').textContent();
	expect(key).toMatch(/^grimoire_/);
	const sources = () => request.get('/sources', { headers: { Authorization: `Bearer ${key}` } });
	expect(await (await sources()).text()).toBe('- auth-service: Login and billing');

	await page.goto('/manage/api-keys');
	expect(await page.content()).not.toContain(key!);
	await expect(page.getByText('ci – auth-service')).toBeVisible();

	page.once('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: 'Revoke ci' }).click();
	await expect(page.getByText('No API keys yet.')).toBeVisible();
	expect((await sources()).status()).toBe(401);
});

// Near the end, because every test before it logs in with the old password.
test('changes the password and logs in with the new one', async ({ page }) => {
	const newPassword = 'staple battery horse';
	await logIn(page);
	await page.getByRole('link', { name: 'Change the password' }).click();
	await expect(page.getByLabel('Email address')).toHaveValue(EMAIL);
	await expect(page.getByLabel('Email address')).toHaveAttribute('autocomplete', 'username');

	await page.getByLabel('Current password').fill('wrong password');
	await page.getByLabel('New password').fill(newPassword);
	await page.getByRole('button', { name: 'Change password' }).click();
	await expect(page.getByRole('alert')).toHaveText('Wrong current password.');

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
	const forgottenPassword = 'staple battery horse';
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

	await page.goto(link);
	await expect(page.getByRole('alert')).toContainText('This link is invalid, used or expired.');
	await logIn(page, forgottenPassword);
	await expect(page.getByRole('alert')).toHaveText('Wrong email address or password.');
	await logIn(page, newPassword);
	await expect(page).toHaveURL('/manage');
});
