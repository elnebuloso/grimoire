/** Drops `user:password@` from every URL in a text. */
export function redactUrl(text: string): string {
	return text.replace(/(\w+:\/\/)[^/\s@]+@/g, '$1');
}
