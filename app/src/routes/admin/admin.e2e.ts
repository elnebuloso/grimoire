import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const USERNAME = 'admin';
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
	await page.goto('/admin/login');
	await page.getByLabel('Username').fill(USERNAME);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Log in' }).click();
}

test('shows the public start page before any project exists', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('No projects yet.')).toBeVisible();
});

test('leads from the login action to the setup while there is no admin account', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Log in' }).click();
	await expect(page).toHaveURL('/admin/setup');
});

test('sets up the admin account with the token from the server log', async ({ page }) => {
	await page.goto('/admin');
	await expect(page).toHaveURL('/admin/setup');
	// Without these tokens a password manager offers to save nothing, or files it under no user.
	await expect(page.getByLabel('Username')).toHaveAttribute('autocomplete', 'username');
	await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'new-password');

	await page.getByLabel('Setup token').fill(setupToken());
	await page.getByLabel('Username').fill(USERNAME);
	await page.getByLabel('Password').fill(PASSWORD);
	await page.getByRole('button', { name: 'Create admin account' }).click();

	await expect(page).toHaveURL('/admin');
	await expect(page.getByRole('heading', { name: 'grimoire admin' })).toBeVisible();
});

test('logs out and back in, and rejects a wrong password', async ({ page }) => {
	await logIn(page);
	await expect(page).toHaveURL('/admin');

	await page.getByRole('button', { name: 'Log out' }).click();
	await expect(page).toHaveURL('/admin/login');
	await page.goto('/admin');
	await expect(page).toHaveURL('/admin/login');

	await expect(page.getByLabel('Username')).toHaveAttribute('autocomplete', 'username');
	await expect(page.getByLabel('Password')).toHaveAttribute('autocomplete', 'current-password');

	await logIn(page, 'wrong password');
	await expect(page.getByRole('alert')).toHaveText('Wrong username or password.');
	await expect(page.getByLabel('Username')).toHaveValue(USERNAME);

	await logIn(page);
	await expect(page).toHaveURL('/admin');
});

test('offers the login action while logged out and shows the admin once logged in', async ({
	page
}) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Log in' }).click();
	await expect(page).toHaveURL('/admin/login');

	await logIn(page);
	await page.goto('/');
	await expect(page.getByText(`Logged in as ${USERNAME}`)).toBeVisible();
	await expect(page.getByRole('link', { name: 'Log in' })).toHaveCount(0);
	await page.getByRole('link', { name: USERNAME, exact: true }).click();
	await expect(page).toHaveURL('/admin');

	await page.goto('/');
	await page.getByRole('button', { name: 'Log out' }).click();
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
});

test('creates a project with a source in the wizard and never shows its token', async ({
	page
}) => {
	await logIn(page);
	await page.getByRole('link', { name: 'New project' }).click();
	// Typed key by key: the slug next to the field follows every keystroke.
	await page.getByLabel('Name', { exact: true }).pressSequentially('Platform');
	await expect(page.getByRole('status')).toHaveText('Slug: platform');
	await page.getByLabel('Short description').fill('Login and billing');
	await page.getByRole('button', { name: 'Next' }).click();

	await expect(page.getByRole('heading', { name: 'First source' })).toBeVisible();
	await page.getByLabel('Name', { exact: true }).pressSequentially('Auth Service');
	await expect(page.getByRole('status')).toHaveText('Slug: auth-service');
	await page.getByLabel('Git URL').fill(MISSING_GIT_URL);
	await page.getByLabel('Username').fill('deploy');
	await page.getByLabel('Access token').fill(TOKEN);
	await page.getByRole('button', { name: 'Test connection' }).click();
	await expect(page.getByRole('alert')).toContainText('Access refused, or there is no repository');
	await page.getByRole('button', { name: 'Next' }).click();
	await expect(page.getByRole('heading', { name: 'First source' })).toBeVisible();
	await expect(page.getByRole('alert')).toContainText('Access refused, or there is no repository');

	// The repository has no `docs/`: the sync that creating starts fails, for the next test.
	await page.getByLabel('Git URL').fill(GIT_URL);
	await page.getByRole('button', { name: 'Test connection' }).click();
	await expect(
		page.getByRole('status').filter({ hasText: 'Reachable: branch main is at commit' })
	).toBeVisible();
	await expect(page.getByText('entered; leave empty to keep it')).toBeVisible();
	await page.getByRole('button', { name: 'Next' }).click();

	await expect(page.getByRole('heading', { name: 'Summary' })).toBeVisible();
	await expect(page.getByText('Nothing is saved until you create the project.')).toBeVisible();
	expect(await page.content()).not.toContain(TOKEN);

	await page.getByRole('button', { name: 'Back' }).click();
	await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Auth Service');
	await expect(page.getByLabel('Access token')).toHaveValue('');
	await expect(page.getByText('entered; leave empty to keep it')).toBeVisible();
	await page.getByRole('button', { name: 'Back' }).click();
	await expect(page.getByLabel('Name', { exact: true })).toHaveValue('Platform');

	await page.getByRole('button', { name: 'Next' }).click();
	await expect(page.getByRole('heading', { name: 'First source' })).toBeVisible();
	await page.getByRole('button', { name: 'Next' }).click();
	await expect(page.getByRole('heading', { name: 'Summary' })).toBeVisible();
	await page.getByRole('button', { name: 'Create project' }).click();

	await expect(page.getByRole('heading', { name: 'Project Platform' })).toBeVisible();
	await page.getByRole('link', { name: 'Auth Service' }).click();
	await expect(page.getByLabel('Git URL')).toHaveValue(GIT_URL);
	await expect(page.getByLabel('Access token')).toHaveValue('');
	await expect(page.getByText('stored; leave empty to keep it')).toBeVisible();
	expect(await page.content()).not.toContain(TOKEN);

	await page.goto('/admin');
	await expect(page.getByRole('link', { name: 'Platform', exact: true })).toBeVisible();
});

test('syncs a source now and shows why it failed', async ({ page }) => {
	await logIn(page);
	await page.getByRole('link', { name: 'Platform', exact: true }).click();
	await page.getByRole('link', { name: 'Auth Service' }).click();

	await page.getByRole('button', { name: 'Sync now' }).click();

	await expect(page.getByRole('status')).toContainText(
		'Sync failed: source path "docs" does not exist'
	);
	await expect(page.getByRole('alert')).toContainText('source path "docs" does not exist');
	expect(await page.content()).not.toContain(TOKEN);

	await page.goto('/admin');
	const attention = page.getByRole('listitem').filter({ hasText: 'platform/auth-service' });
	await expect(attention).toContainText('sync error: source path "docs" does not exist');
	await attention.getByRole('link').click();
	await expect(page.getByRole('heading', { name: 'Source Auth Service' })).toBeVisible();
});

test('lists the projects on the public start page without any source detail', async ({ page }) => {
	await page.goto('/');
	const row = page.getByRole('row', { name: /platform/ });
	await expect(row).toContainText('Login and billing');
	// One source, synced once without success: counted as an error, its message stays hidden.
	await expect(row.getByRole('cell').nth(0)).toHaveText('1');
	await expect(row.getByRole('cell').nth(5)).toHaveText('1');
	const html = await page.content();
	for (const detail of ['git.e2e.example', 'auth-service', 'deploy', 'does not exist', TOKEN]) {
		expect(html).not.toContain(detail);
	}
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

test('creates an API key that works for its project until it is revoked', async ({
	page,
	request
}) => {
	await logIn(page);
	await page.getByRole('link', { name: 'API keys' }).click();
	await page.getByLabel('Name').fill('ci');
	await page.getByLabel('Only these:').check();
	await page.getByLabel('platform').check();
	await page.getByRole('button', { name: 'Create key' }).click();

	const key = await page.locator('output').textContent();
	expect(key).toMatch(/^grimoire_/);
	const projects = () => request.get('/projects', { headers: { Authorization: `Bearer ${key}` } });
	expect(await (await projects()).text()).toBe('- platform: Login and billing');

	await page.goto('/admin/api-keys');
	expect(await page.content()).not.toContain(key!);
	await expect(page.getByText('ci – platform')).toBeVisible();

	page.once('dialog', (dialog) => dialog.accept());
	await page.getByRole('button', { name: 'Revoke ci' }).click();
	await expect(page.getByText('No API keys yet.')).toBeVisible();
	expect((await projects()).status()).toBe(401);
});

// Last, because every test before it logs in with the old password.
test('changes the password and logs in with the new one', async ({ page }) => {
	const newPassword = 'staple battery horse';
	await logIn(page);
	await page.getByRole('link', { name: 'Change the password' }).click();
	await expect(page.getByLabel('Username')).toHaveValue(USERNAME);
	await expect(page.getByLabel('Username')).toHaveAttribute('autocomplete', 'username');

	await page.getByLabel('Current password').fill('wrong password');
	await page.getByLabel('New password').fill(newPassword);
	await page.getByRole('button', { name: 'Change password' }).click();
	await expect(page.getByRole('alert')).toHaveText('Wrong current password.');

	await page.getByLabel('Current password').fill(PASSWORD);
	await page.getByLabel('New password').fill(newPassword);
	await page.getByRole('button', { name: 'Change password' }).click();
	await expect(page.getByRole('status')).toContainText('Password changed.');

	await page.goto('/admin');
	await page.getByRole('button', { name: 'Log out' }).click();
	await logIn(page);
	await expect(page.getByRole('alert')).toHaveText('Wrong username or password.');
	await logIn(page, newPassword);
	await expect(page).toHaveURL('/admin');
});
