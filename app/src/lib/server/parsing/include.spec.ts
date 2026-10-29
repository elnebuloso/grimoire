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
	// Expected values are what pymdownx.snippets 12.3 renders for the same files.
	describe('line selections', () => {
		const files = { 'lines.md': '1\n2\n3\n4\n5\n6\n' };

		it.each([
			['lines.md:3', '3\n4\n5\n6\n'],
			['lines.md::3', '1\n2\n3'],
			['lines.md:4:6', '4\n5\n6'],
			['lines.md:1:2,5:5', '1\n2\n5'],
			['lines.md:-2:', '6\n'],
			['lines.md:2:-3', '2\n3\n4\n5'],
			['lines.md:0:1', '1']
		])('inserts "%s" like pymdownx.snippets', (name, expected) => {
			const result = resolve(`--8<-- "${name}"`, files);
			expect(result.markdown).toBe(expected);
			expect(result.warnings).toEqual([]);
		});

		it('reports the file without its selection as outside the source path', () => {
			expect(resolve('--8<-- "lines.md:2:3"', files).outsideSourcePath).toEqual(['lines.md']);
		});
	});

	describe('named sections', () => {
		const files = {
			'app.py': [
				'import os',
				'# --8<-- [start:main]',
				'def main():',
				'    # ;--8<-- [start:kept]',
				'    print("hi")',
				'# --8<-- [end:main]',
				'# --8<-- [start:other]',
				'x = 1',
				'# --8<-- [end:other]',
				''
			].join('\n')
		};

		it('inserts only the lines between the markers, also when they sit in a comment', () => {
			const result = resolve('```python\n--8<-- "app.py:main"\n```', files);
			expect(result.markdown).toBe(
				'```python\ndef main():\n    # --8<-- [start:kept]\n    print("hi")\n```'
			);
			expect(result.warnings).toEqual([]);
		});

		it('removes the markers when the whole file is included', () => {
			expect(resolve('--8<-- "app.py"', files).markdown).toBe(
				'import os\ndef main():\n    # --8<-- [start:kept]\n    print("hi")\nx = 1'
			);
		});

		it('removes markers from the page itself', () => {
			expect(resolve('Page\n<!-- --8<-- [start:x] -->\nEnd', {}).markdown).toBe('Page\nEnd');
		});

		it('works in the block format', () => {
			const result = resolve('--8<--\napp.py:other\nlines.md:6\n--8<--', {
				...files,
				'lines.md': '1\n2\n3\n4\n5\n6\n'
			});
			expect(result.markdown).toBe('x = 1\n6\n');
		});

		it('warns about a section the file does not have', () => {
			const result = resolve('Before\n--8<-- "app.py:missing"\nAfter', files);
			expect(result.markdown).toBe('Before\nAfter');
			expect(result.warnings).toEqual([
				'docs/deploy.md: include "app.py" has no section "missing"'
			]);
		});
	});
});
