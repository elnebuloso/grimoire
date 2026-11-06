import { defineParams } from '@sveltejs/kit/params';

// The sub pages of a source beside its status, which has no segment of its own.
const SOURCE_TABS = ['pages', 'history', 'settings'] as const;

export const params = defineParams({
	tab: (param) => SOURCE_TABS.find((tab) => tab === param)
});
