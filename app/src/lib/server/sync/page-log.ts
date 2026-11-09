// The indexing process notes each page here before parsing it, so the server can name the page
// when that process dies or outlasts the deadline. A file rather than a message over the IPC
// channel: messages still queued in a process that dies are lost, a written line is not.
// Plain Node loads this module in the indexing process; it imports nothing Vite resolves.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

// As JSON, so a newline Git allows in a file name cannot split one path into two lines.
export function notePage(log: string, path: string) {
	appendFileSync(log, `${JSON.stringify(path)}\n`);
}

/** After the last page: an early end from now on is not one while parsing a page. */
export function clearPageLog(log: string) {
	writeFileSync(log, '');
}

/** The page the indexing process was parsing, or undefined when it parsed none at that moment. */
export function pageBeingIndexed(log: string): string | undefined {
	let content: string;
	try {
		content = readFileSync(log, 'utf8');
	} catch {
		// Not written yet: the process ended before it reached the first page.
		return undefined;
	}
	// A process killed mid-write leaves a torn last line; only lines ending in a newline count.
	const last = content.split('\n').at(-2);
	return last ? (JSON.parse(last) as string) : undefined;
}
