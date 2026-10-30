// Slugs are part of agent IDs and URLs (`<source>/<page>`), so nothing that needs escaping.
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// A slug is repeated in every ID of every answer, so every character costs tokens there.
export const MAX_SLUG_LENGTH = 40;
export const MAX_NAME_LENGTH = 80;

// German spells these out; dropping the dots instead would turn "Prüfung" into "prufung".
const SPELLED_OUT: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };

export function isSlug(value: string): boolean {
	return SLUG.test(value) && value.length <= MAX_SLUG_LENGTH;
}

/**
 * The slug for a name: lowercase letters, digits and single hyphens, at most `MAX_SLUG_LENGTH`
 * long and cut at a hyphen where possible. Empty when the name has no letters or digits.
 */
export function slugify(name: string): string {
	const slug = name
		.toLowerCase()
		.replace(/[äöüß]/g, (letter) => SPELLED_OUT[letter])
		.normalize('NFKD')
		.replace(/\p{M}/gu, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	if (slug.length <= MAX_SLUG_LENGTH) return slug;
	const cut = slug.slice(0, MAX_SLUG_LENGTH + 1);
	const lastHyphen = cut.lastIndexOf('-');
	return (lastHyphen > 0 ? cut.slice(0, lastHyphen) : cut.slice(0, MAX_SLUG_LENGTH)).replace(
		/-$/,
		''
	);
}
