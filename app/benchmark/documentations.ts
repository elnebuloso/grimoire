/** The fixture repository and its commit the benchmark reads, never a branch: the same input on every run. */
export const FIXTURE = {
	url: 'https://github.com/elnebuloso/grimoire-fixture-docs.git',
	commit: '858ac43f5d7d766ebd9e201b1761f3e989973d79'
};

/** The four documentations under `vendor/` of the fixture, each indexed as one source. */
export const DOCUMENTATIONS = [
	{ name: 'kubernetes', path: 'vendor/kubernetes/content/en' },
	{ name: 'mkdocs-material', path: 'vendor/mkdocs-material/docs' },
	{ name: 'fastapi', path: 'vendor/fastapi/docs/en/docs' },
	{ name: 'zensical', path: 'vendor/zensical/docs' }
] as const;

export type Documentation = (typeof DOCUMENTATIONS)[number];
