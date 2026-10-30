import type { Preview } from '@storybook/sveltekit';
import '../src/app.css';

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i
			}
		},

		// An accessibility violation fails the story's test, in `make test` and in CI.
		a11y: { test: 'error' }
	},

	// Sets the scheme as the product does: `data-theme` on <html>, none to follow the system.
	globalTypes: {
		theme: {
			description: 'Colour scheme',
			toolbar: {
				title: 'Theme',
				items: [
					{ value: 'system', title: 'System' },
					{ value: 'light', title: 'Light' },
					{ value: 'dark', title: 'Dark' }
				],
				dynamicTitle: true
			}
		}
	},
	initialGlobals: { theme: 'system' },
	decorators: [
		(story, { globals }) => {
			if (globals.theme === 'light' || globals.theme === 'dark') {
				document.documentElement.dataset.theme = globals.theme;
			} else {
				delete document.documentElement.dataset.theme;
			}
			return story();
		}
	]
};

export default preview;
