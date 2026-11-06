import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'node:events';

/** A terminal on stdin: reports whether it is paused, which decides whether the script can exit. */
class FakeTerminal extends EventEmitter {
	paused = true;
	setRawMode() {
		return this;
	}
	setEncoding() {
		return this;
	}
	resume() {
		this.paused = false;
		return this;
	}
	pause() {
		this.paused = true;
		return this;
	}
}

let terminal: FakeTerminal;
const realStdin = Object.getOwnPropertyDescriptor(process, 'stdin')!;

beforeEach(() => {
	terminal = new FakeTerminal();
	Object.defineProperty(process, 'stdin', { value: terminal, configurable: true });
	vi.spyOn(process.stdout, 'write').mockReturnValue(true);
	vi.resetModules();
});

afterEach(() => {
	Object.defineProperty(process, 'stdin', realStdin);
	vi.restoreAllMocks();
});

async function prompt() {
	return (await import('../../../../scripts/prompt.ts')).readHidden;
}

describe('readHidden', () => {
	it('reads two passwords that arrive in one chunk and leaves stdin paused', async () => {
		const readHidden = await prompt();

		const first = readHidden('Password: ');
		terminal.emit('data', 'new password\rnew password\r');
		expect(await first).toBe('new password');
		expect(await readHidden('Again: ')).toBe('new password');

		expect(terminal.paused).toBe(true);
	});

	it('reads two passwords typed one after the other and leaves stdin paused', async () => {
		const readHidden = await prompt();

		const first = readHidden('Password: ');
		terminal.emit('data', 'new password\r');
		expect(await first).toBe('new password');
		const second = readHidden('Again: ');
		terminal.emit('data', 'new pa');
		terminal.emit('data', 'ssword\r');
		expect(await second).toBe('new password');

		expect(terminal.paused).toBe(true);
	});
});
