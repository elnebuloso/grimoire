import { describe, it, expect } from 'vitest';
import { resolveIncludes } from './include';

const page = { path: 'docs/deploy.md', sourcePath: 'docs/' };

function resolve(source: string, files: Record<string, string>) {
	return resolveIncludes(source, page, (path) => files[path]);
}

describe('resolveIncludes', () => {
	it('replaces an include with the file content, resolved from the repository root', () => {
		const result = resolve('# Deploy\n\n--8<-- "docs/shared/note.md"\n\nAfter.\n', {
			'docs/shared/note.md': 'Shared note.\n'
		});
		expect(result.markdown).toBe('# Deploy\n\nShared note.\n\nAfter.\n');
		expect(result.warnings).toEqual([]);
		expect(result.outsideSourcePath).toEqual([]);
	});

	it('accepts single quotes and any number of dashes', () => {
		const result = resolve('-8<- \'a.md\'\n---8<------ "b.md"', { 'a.md': 'A', 'b.md': 'B' });
		expect(result.markdown).toBe('A\nB');
	});

	it('resolves nested includes from the repository root', () => {
		const result = resolve('--8<-- "docs/a.md"', {
			'docs/a.md': 'A start\n--8<-- "snippets/b.md"\nA end\n',
			'snippets/b.md': 'B\n'
		});
		expect(result.markdown).toBe('A start\nB\nA end');
	});

	it('does not insert a file already in the include chain and warns about the cycle', () => {
		const result = resolve('--8<-- "docs/a.md"', {
			'docs/a.md': 'A\n--8<-- "docs/b.md"',
			'docs/b.md': 'B\n--8<-- "docs/a.md"\n--8<-- "docs/deploy.md"'
		});
		expect(result.markdown).toBe('A\nB');
		expect(result.warnings).toEqual([
			'docs/deploy.md: include cycle docs/deploy.md → docs/a.md → docs/b.md → docs/a.md, "docs/a.md" not inserted again',
			'docs/deploy.md: include cycle docs/deploy.md → docs/a.md → docs/b.md → docs/deploy.md, "docs/deploy.md" not inserted again'
		]);
	});

	it('includes the same file twice when it is not part of a cycle', () => {
		const result = resolve('--8<-- "docs/a.md"\n--8<-- "docs/a.md"', { 'docs/a.md': 'A' });
		expect(result.markdown).toBe('A\nA');
		expect(result.warnings).toEqual([]);
	});

	it('warns about a missing target and keeps the rest of the page', () => {
		const result = resolve('Before\n--8<-- "docs/missing.md"\nAfter', {});
		expect(result.markdown).toBe('Before\nAfter');
		expect(result.warnings).toEqual(['docs/deploy.md: include "docs/missing.md" not found']);
	});

	it('warns about a target outside the repository and does not read it', () => {
		const result = resolveIncludes('--8<-- "../secret.md"\n--8<-- "/etc/passwd"', page, () => {
			throw new Error('must not read');
		});
		expect(result.markdown).toBe('');
		expect(result.warnings).toHaveLength(2);
	});

	it('reports targets outside the source path, found or not', () => {
		const result = resolve('--8<-- "shared/a.md"\n--8<-- "docs/b.md"\n--8<-- "other/c.md"', {
			'shared/a.md': 'A',
			'docs/b.md': 'B'
		});
		expect(result.markdown).toBe('A\nB');
		expect(result.outsideSourcePath).toEqual(['shared/a.md', 'other/c.md']);
	});

	it('treats nothing as outside when the source path is the repository root', () => {
		const result = resolveIncludes(
			'--8<-- "shared/a.md"',
			{ path: 'index.md', sourcePath: '.' },
			() => 'A'
		);
		expect(result.outsideSourcePath).toEqual([]);
	});

	it('resolves the block format, keeping empty lines and skipping commented entries', () => {
		const result = resolve('--8<--\ndocs/a.md\n\n; docs/skip.md\ndocs/b.md\n--8<--\nAfter', {
			'docs/a.md': 'A',
			'docs/b.md': 'B'
		});
		expect(result.markdown).toBe('A\n\nB\nAfter');
		expect(result.warnings).toEqual([]);
	});

	it('leaves an unterminated block marker as it is', () => {
		expect(resolve('--8<--\ndocs/a.md', { 'docs/a.md': 'A' }).markdown).toBe('--8<--\ndocs/a.md');
	});

	it('drops a disabled include and unescapes an escaped one', () => {
		const result = resolve('--8<-- "; docs/a.md"\n;--8<-- "docs/a.md"\n;;--8<--', {
			'docs/a.md': 'A'
		});
		expect(result.markdown).toBe('--8<-- "docs/a.md"\n;--8<--');
	});

	it('indents the included lines like the marker, also inside code fences', () => {
		const result = resolve('```python\n    --8<-- "src/example.py"\n```', {
			'src/example.py': 'def main():\n\n    pass\n'
		});
		expect(result.markdown).toBe('```python\n    def main():\n\n        pass\n```');
	});

	it('ignores a marker with text after the quoted name', () => {
		const source = '--8<-- "docs/a.md" trailing';
		expect(resolve(source, { 'docs/a.md': 'A' }).markdown).toBe(source);
	});
});
