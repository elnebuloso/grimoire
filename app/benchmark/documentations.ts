/** The fixture repository and its commit the benchmark reads, never a branch: the same input on every run. */
export const FIXTURE = {
	url: 'https://github.com/elnebuloso/grimoire-fixture-docs.git',
	commit: '2ce2c00349c2ad0c33277c6c94763ce3e72dfcc0'
};

export interface Documentation {
	name: string;
	path: string;
	exclusions?: string[];
}

/**
 * The eight documentations under `vendor/` of the fixture, four in English and four in German,
 * each indexed as one source. `exclusions` as an admin sets them on a source.
 */
export const DOCUMENTATIONS: readonly Documentation[] = [
	{ name: 'kubernetes', path: 'vendor/kubernetes/content/en' },
	{ name: 'mkdocs-material', path: 'vendor/mkdocs-material/docs' },
	{ name: 'fastapi', path: 'vendor/fastapi/docs/en/docs' },
	{ name: 'zensical', path: 'vendor/zensical/docs' },
	{ name: 'kubernetes-de', path: 'vendor/kubernetes/content/de' },
	{ name: 'i-doit-de', path: 'vendor/i-doit/docs/de' },
	{ name: 'fastapi-de', path: 'vendor/fastapi/docs/de/docs' },
	// The fixture's own notes about the copy lie inside the source path.
	{ name: 'odoo-wiki-de', path: 'vendor/odoo-wiki', exclusions: ['vendor/odoo-wiki/VENDOR.md'] }
];
