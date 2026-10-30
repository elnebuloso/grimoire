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

		a11y: {
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: 'todo'
		}
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
