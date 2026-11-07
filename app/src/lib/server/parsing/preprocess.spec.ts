import { describe, it, expect } from 'vitest';
import { chunkPage } from './chunk';
import { preprocessPage } from './preprocess';

const mkdocsPage = `---
title: Auth-Service
description: Login and sessions
tags:
  - auth
  - platform
---

# Auth-Service

<!-- TODO: add diagram -->

![Architecture overview](img/architecture.png)

## Rollback

Roll back to the previous version:

\`\`\`bash
make rollback ENV=prod VERSION=<tag>
\`\`\`

!!! warning "Achtung"
    Database migrations are not rolled back.

## Install

=== "Linux"

    Run the installer.

=== "macOS"

    Use Homebrew.

\`\`\`mermaid
graph LR
  A --> B
\`\`\`
`;

const expectedMarkdown = `# Auth-Service

Architecture overview

## Rollback

Roll back to the previous version:

\`\`\`bash
make rollback ENV=prod VERSION=<tag>
\`\`\`

> **Achtung:** Database migrations are not rolled back.

## Install

**Linux:**

Run the installer.

**macOS:**

Use Homebrew.

\`\`\`mermaid
graph LR
  A --> B
\`\`\`
`;

describe('preprocessPage', () => {
	it('reads unclosed images, sources and comments in raw HTML in linear time', () => {
		// Patterns that searched to the end of the page from every unclosed tag took seconds per
		// 100 KB and minutes for a page of this size, far past the test timeout.
		for (const unclosed of ['<img', '<source', '<!--']) {
			const page = preprocessPage(`<div>\n${unclosed.repeat(100_000)}\n</div>\n\nAfter.\n`);
			expect(page.markdown).toContain('After.');
		}
	});

	it('removes closed images, sources and comments in raw HTML as before', () => {
		const page = preprocessPage(
			'<div>\n<!-- note --><img src="a.png" alt="Logo"><picture><source srcset="b.png"></picture>\n</div>\n'
		);
		expect(page.markdown).toBe('<div>\nLogo<picture></picture>\n</div>\n');
	});

	it('converts a MkDocs page with every supported element', () => {
		expect(preprocessPage(mkdocsPage)).toEqual({
			title: 'Auth-Service',
			description: 'Login and sessions',
			tags: ['auth', 'platform'],
			markdown: expectedMarkdown
		});
	});

	it('passes plain Markdown through unchanged', () => {
		const plain = `# Guide

Some text with \`code\` and a [link](other.md#section).

- one
- two

| Key | Value |
| --- | ----- |
| a   | b     |
`;
		expect(preprocessPage(plain)).toEqual({ tags: [], markdown: plain });
	});

	describe('frontmatter', () => {
		it('leaves missing fields empty', () => {
			expect(preprocessPage('---\ntitle: Only title\n---\nText\n')).toEqual({
				title: 'Only title',
				description: undefined,
				tags: [],
				markdown: 'Text\n'
			});
		});

		it('throws on invalid YAML', () => {
			expect(() => preprocessPage('---\ntitle: [unclosed\n---\nText\n')).toThrow();
		});

		it('keeps the last value of a repeated key', () => {
			expect(preprocessPage('---\ntitle: First\ntitle: Last\n---\nText\n')).toMatchObject({
				title: 'Last',
				markdown: 'Text\n'
			});
		});

		it('ignores a horizontal rule that is not at the start', () => {
			expect(preprocessPage('Text\n\n---\n\nMore\n').markdown).toBe('Text\n\n***\n\nMore\n');
		});

		it('reads frontmatter after a byte order mark', () => {
			expect(
				preprocessPage('\uFEFF---\ntitle: Deploy\ndescription: How to deploy\n---\n## Steps\n')
			).toMatchObject({ title: 'Deploy', description: 'How to deploy', markdown: '## Steps\n' });
		});

		it('ends frontmatter at `...`, and a later rule stays content', () => {
			expect(
				preprocessPage('---\ntitle: Deploy\n...\n\n## Steps\n\ntext\n\n---\n\nmore\n')
			).toMatchObject({ title: 'Deploy', markdown: '## Steps\n\ntext\n\n***\n\nmore\n' });
		});

		it('accepts spaces after the opening dashes', () => {
			expect(preprocessPage('--- \t\ntitle: Deploy\n---\nText\n')).toMatchObject({
				title: 'Deploy',
				markdown: 'Text\n'
			});
		});
	});

	describe('admonitions', () => {
		it('uses the capitalized type when no title is given', () => {
			expect(preprocessPage('!!! note\n    Keep it short.\n').markdown).toBe(
				'> **Note:** Keep it short.\n'
			);
		});

		it('shows no label for an empty title', () => {
			expect(preprocessPage('!!! note ""\n    Keep it short.\n').markdown).toBe(
				'> Keep it short.\n'
			);
		});

		it('handles collapsible blocks and extra classes', () => {
			expect(preprocessPage('???+ tip inline end "Hint"\n    Use make.\n').markdown).toBe(
				'> **Hint:** Use make.\n'
			);
		});

		it('puts the label on its own line when the body starts with a code block', () => {
			expect(preprocessPage('!!! example\n    ```sh\n    make test\n    ```\n').markdown).toBe(
				'> **Example:**\n>\n> ```sh\n> make test\n> ```\n'
			);
		});

		it('converts an admonition nested in a content tab', () => {
			expect(preprocessPage('=== "Linux"\n\n    !!! warning\n        Needs root.\n').markdown).toBe(
				'**Linux:**\n\n> **Warning:** Needs root.\n'
			);
		});

		it('ends at the first line that is not indented', () => {
			expect(preprocessPage('!!! note\n    Inside.\nOutside.\n').markdown).toBe(
				'> **Note:** Inside.\n\nOutside.\n'
			);
		});

		it('leaves the syntax alone inside a code fence', () => {
			const page = '```md\n!!! note\n    Not converted.\n```\n';
			expect(preprocessPage(page).markdown).toBe(page);
		});
	});

	describe('images and comments', () => {
		it('drops an image in a heading, which MkDocs leaves out of the anchor', () => {
			const anchors = (markdown: string) =>
				chunkPage(preprocessPage(markdown), 'deploy.md').snippets.map((s) => s.anchor);

			expect(anchors(`# Page\n\n## Logo ![alt text](x.png)\n\n${'Text. '.repeat(60)}\n`)).toEqual([
				'logo'
			]);
			expect(
				anchors(
					`# Page\n\n## Build [![status](b.svg)](https://ci.example)\n\n${'Text. '.repeat(60)}\n`
				)
			).toEqual(['build']);
			expect(preprocessPage('Text ![alt text](x.png)\n').markdown).toBe('Text alt text\n');
			expect(
				anchors(
					`# Page\n\n## Build <img src="https://ci.example.com/badge.svg" alt="status">\n\n${'Text. '.repeat(60)}\n`
				)
			).toEqual(['build']);
			expect(
				anchors(`# Page\n\n## <img src="x.png" alt="logo"> Release\n\n${'Text. '.repeat(60)}\n`)
			).toEqual(['release']);
		});

		it('keeps the alt text of a linked image', () => {
			expect(preprocessPage('[![Build status](badge.svg)](https://ci.example)\n').markdown).toBe(
				'[Build status](https://ci.example)\n'
			);
		});

		it('drops an image without alt text', () => {
			expect(preprocessPage('Before ![](spacer.png) after\n').markdown).toBe('Before  after\n');
		});

		it('keeps the alt text of an inline HTML image', () => {
			expect(preprocessPage('See <img src="flow.png" alt="Login flow" /> here\n').markdown).toBe(
				'See Login flow here\n'
			);
		});

		it('keeps the alt text of an HTML image in a block element', () => {
			expect(
				preprocessPage('<p align="center"><img src="logo.png" width=200 alt=Logo></p>\n').markdown
			).toBe('<p align="center">Logo</p>\n');
		});

		it('drops a picture source and an HTML image without alt text', () => {
			expect(
				preprocessPage(
					'<picture>\n<source srcset="dark.png" media="(prefers-color-scheme: dark)">\n<img src="light.png">\n</picture>\n'
				).markdown
			).toBe('<picture>\n\n\n</picture>\n');
		});

		it('removes an inline comment and keeps the surrounding text', () => {
			expect(preprocessPage('Visible <!-- hidden --> text\n').markdown).toBe('Visible  text\n');
		});
	});
});
