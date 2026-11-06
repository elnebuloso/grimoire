/**
 * The `claude mcp add` command for this instance: with the key, a placeholder for it, or without
 * one (null) for a visitor, who reads the public sources. One option per line, so a narrow screen
 * wraps between them, not inside a flag.
 */
export function connectCommand(origin: string, mcpName: string, key: string | null): string {
	return [
		'claude mcp add \\',
		'  --transport http \\',
		'  --scope user \\',
		`  ${mcpName} \\`,
		...(key === null
			? [`  ${origin}/mcp`]
			: [`  ${origin}/mcp \\`, `  --header "Authorization: Bearer ${key}"`])
	].join('\n');
}
