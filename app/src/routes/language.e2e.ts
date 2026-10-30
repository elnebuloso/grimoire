import { expect, test, type Browser } from '@playwright/test';

// The browser's language reaches the server as `Accept-Language`, set by the context locale.
async function pageIn(browser: Browser, locale: string) {
	const context = await browser.newContext({
		locale,
		extraHTTPHeaders: { 'x-forwarded-proto': 'http' }
	});
	return context.newPage();
}

test('shows the UI in the language the browser asks for', async ({ browser }) => {
	const page = await pageIn(browser, 'de-DE');
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Quellen' })).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('falls back to English for a language it does not have', async ({ browser }) => {
	const page = await pageIn(browser, 'fr-FR');
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('keeps a language picked with the switch over the browser language', async ({ browser }) => {
	const page = await pageIn(browser, 'de-DE');
	await page.goto('/');
	await page.getByRole('button', { name: 'English' }).click();

	await expect(page).toHaveURL('/');
	await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'English' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	// Another page, wherever the management area sends a visitor at this point of the run.
	await page.goto('/manage');
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await page.goto('/');

	await page.getByRole('button', { name: 'Deutsch' }).click();
	await expect(page).toHaveURL('/');
	await expect(page.getByRole('heading', { name: 'Quellen' })).toBeVisible();
});

test('answers an unknown path with a not-found page in the language of the browser', async ({
	browser
}) => {
	const page = await pageIn(browser, 'de-DE');
	const response = await page.goto('/no/such/page');
	expect(response?.status()).toBe(404);
	await expect(page.getByRole('heading', { name: 'Diese Seite gibt es nicht.' })).toBeVisible();

	await page.getByRole('link', { name: 'Zur Startseite' }).click();
	await expect(page).toHaveURL('/');
});
