/** The release notes of a version on GitHub; none for the development version 0.0.0. */
export function releaseNotesUrl(version: string): string | undefined {
	if (version === '0.0.0') return undefined;
	return `https://github.com/elnebuloso/grimoire/releases/tag/v${version}`;
}
