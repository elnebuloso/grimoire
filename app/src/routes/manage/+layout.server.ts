import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// The access hook decides; thrown here, the error renders in the layout.
export const load: LayoutServerLoad = ({ locals }) => {
	if (locals.accessDenied) error(locals.accessDenied);
};
