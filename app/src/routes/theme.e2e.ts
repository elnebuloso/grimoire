import { expect, test, type Page } from '@playwright/test';

// The canvas colour of each scheme, from `app.css`.
const LIGHT_CANVAS = 'rgb(227, 230, 234)';
const DARK_CANVAS = 'rgb(17, 20, 24)';

test.use({ colorScheme: 'dark' });

const canvas = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const theme = (page: Page) => page.getByRole('form', { name: 'Theme' });

test('follows the system scheme until one is picked, and again after System', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('html')).not.toHaveAttribute('data-theme');
	await expect(theme(page).getByRole('button', { name: 'System' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	expect(await canvas(page)).toBe(DARK_CANVAS);
	await page.emulateMedia({ colorScheme: 'light' });
	await expect.poll(() => canvas(page)).toBe(LIGHT_CANVAS);
	await page.emulateMedia({ colorScheme: 'dark' });

	await theme(page).getByRole('button', { name: 'Light' }).click();
	await expect(page).toHaveURL('/');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	await expect.poll(() => canvas(page)).toBe(LIGHT_CANVAS);

	// Kept on another page and on the next visit, over the dark system scheme.
	await page.goto('/login');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	await page.reload();
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	await expect(theme(page).getByRole('button', { name: 'Light' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);

	await theme(page).getByRole('button', { name: 'System' }).click();
	await expect(page).toHaveURL('/login');
	await expect(page.locator('html')).not.toHaveAttribute('data-theme');
	await expect.poll(() => canvas(page)).toBe(DARK_CANVAS);
});

test('paints the picked scheme from the first response, without JavaScript', async ({
	browser
}) => {
	const context = await browser.newContext({
		javaScriptEnabled: false,
		colorScheme: 'light',
		extraHTTPHeaders: { 'x-forwarded-proto': 'http' }
	});
	const page = await context.newPage();
	await page.goto('/');
	await theme(page).getByRole('button', { name: 'Dark' }).click();
	await expect(page).toHaveURL('/');

	const response = await page.request.get('/');
	expect(await response.text()).toContain('data-theme="dark"');
	expect(await canvas(page)).toBe(DARK_CANVAS);
	await context.close();
});
