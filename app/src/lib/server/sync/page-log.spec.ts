import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { appendFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { clearPageLog, notePage, pageBeingIndexed } from './page-log';

let dir: string;
let log: string;

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'grimoire-page-log-'));
	log = join(dir, 'pages');
});

afterEach(() => rmSync(dir, { recursive: true, force: true }));

describe('pageBeingIndexed', () => {
	it('names the last page noted', () => {
		notePage(log, 'docs/index.md');
		notePage(log, 'docs/api.md');

		expect(pageBeingIndexed(log)).toBe('docs/api.md');
	});

	it('names no page before the first one was noted', () => {
		expect(pageBeingIndexed(log)).toBeUndefined();
	});

	it('names no page once parsing is over', () => {
		notePage(log, 'docs/api.md');
		clearPageLog(log);

		expect(pageBeingIndexed(log)).toBeUndefined();
	});

	it('ignores a line torn by a process killed while writing it', () => {
		notePage(log, 'docs/index.md');
		appendFileSync(log, 'docs/ap');

		expect(pageBeingIndexed(log)).toBe('docs/index.md');
	});

	it('names no page when only a torn line was written', () => {
		appendFileSync(log, 'docs/ap');

		expect(pageBeingIndexed(log)).toBeUndefined();
	});
});
