// What arrived after the line just read: pasted or piped input can bring several lines at once.
let pending = '';

/** Reads a line from the terminal without showing it, as a password prompt does. */
export function readHidden(question: string): Promise<string> {
	process.stdout.write(question);
	process.stdin.setRawMode(true);
	process.stdin.setEncoding('utf8');
	let typed = '';
	return new Promise((resolve) => {
		const onData = (chunk: string) => {
			const characters = [...chunk];
			for (const [index, character] of characters.entries()) {
				if (character === '\u0003') {
					process.stdout.write('\n');
					process.exit(130);
				}
				if (character === '\r' || character === '\n') {
					pending = characters
						.slice(index + 1)
						.join('')
						.replace(/^\n/, '');
					process.stdin.off('data', onData);
					process.stdin.setRawMode(false);
					process.stdin.pause();
					process.stdout.write('\n');
					resolve(typed);
					return;
				}
				// Terminals send DEL for backspace, some `\b`.
				typed =
					character === '\u007f' || character === '\b' ? typed.slice(0, -1) : typed + character;
			}
		};
		process.stdin.on('data', onData);
		if (pending) {
			const earlier = pending;
			pending = '';
			onData(earlier);
		}
		process.stdin.resume();
	});
}

/** Whether `error` is SQLite's "database is locked", from a write of the running server. */
export function isDatabaseBusy(error: unknown): boolean {
	return (error as { errcode?: number }).errcode === 5;
}
