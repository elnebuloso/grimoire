import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const USERNAME = 'admin';
const PASSWORD = 'correct horse battery';
const TOKEN = 'glpat-e2e-secret';

// Each test builds on the account and data the one before it created.
test.describe.configure({ mode: 'serial' });

function setupToken(): string {
	const log = readFileSync(join(process.env.E2E_DIR!, 'server.log'), 'utf8');
	return log.match(/setup token (\S+)/)![1];
}

async function logIn(page: Page, password = PASSWORD) {
	await page.goto('/admin/login');
	await page.getByLabel('Username').fill(USERNAME);
	await page.getByLabel('Password').fill(password);
	await page.getByRole('button', { name: 'Log in' }).click();
}

test('sets up the admin account with the token from the server log', async ({ page }) => {
	await page.goto('/admin');
	await expect(page).toHaveURL('/admin/setup');

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

	await logIn(page, 'wrong password');
	await expect(page.getByRole('alert')).toHaveText('Wrong username or password.');
	await expect(page.getByLabel('Username')).toHaveValue(USERNAME);

	await logIn(page);
	await expect(page).toHaveURL('/admin');
});

test('creates a project with a source and never shows its token', async ({ page }) => {
	await logIn(page);
	await page.getByRole('link', { name: 'New project' }).click();
	await page.getByLabel('Slug').fill('platform');
	await page.getByLabel('Short description').fill('Login and billing');
	await page.getByRole('button', { name: 'Create project' }).click();
	await expect(page.getByRole('heading', { name: 'Project platform' })).toBeVisible();

	await page.getByRole('link', { name: 'New source' }).click();
	await page.getByLabel('Slug').fill('auth-service');
	// `.invalid` never resolves; the sync that saving starts fails without the test waiting for it.
	await page.getByLabel('Git URL').fill('https://git.invalid/platform/auth.git');
	await page.getByLabel('Username').fill('deploy');
	await page.getByLabel('Access token').fill(TOKEN);
	await page.getByRole('button', { name: 'Create source' }).click();

	await expect(page.getByRole('heading', { name: 'Source auth-service' })).toBeVisible();
	await expect(page.getByLabel('Git URL')).toHaveValue('https://git.invalid/platform/auth.git');
	await expect(page.getByLabel('Access token')).toHaveValue('');
	await expect(page.getByText('stored; leave empty to keep it')).toBeVisible();
	expect(await page.content()).not.toContain(TOKEN);

	await page.goto('/admin');
	await expect(page.getByRole('link', { name: 'platform' })).toBeVisible();
});

test('syncs a source now and shows why it failed', async ({ page }) => {
	await logIn(page);
	await page.getByRole('link', { name: 'platform' }).click();
	await page.getByRole('link', { name: 'auth-service' }).click();

	await page.getByRole('button', { name: 'Sync now' }).click();

	await expect(page.getByRole('status')).toContainText('Sync failed: git ls-remote failed');
	await expect(page.getByRole('alert')).toContainText('git ls-remote failed');
	expect(await page.content()).not.toContain(TOKEN);
});
