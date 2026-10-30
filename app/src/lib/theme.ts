/** Holds the colour scheme picked with the switch; without it the page follows the system. */
export const THEME_COOKIE = 'grimoire-theme';

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export function isTheme(value: unknown): value is Theme {
	return THEMES.includes(value as Theme);
}

/** The attribute for `<html>`: the picked scheme, or nothing to follow the system. */
export function themeAttribute(cookie: string | undefined): string {
	return isTheme(cookie) ? `data-theme="${cookie}"` : '';
}
