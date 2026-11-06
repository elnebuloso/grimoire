import { m } from '#lib/paraglide/messages.js';
import type { Visibility } from '#lib/source-fields.js';

/** The word for each visibility of a source. */
export const VISIBILITY_LABEL: Record<Visibility, () => string> = {
	internal: m.visibility_internal,
	public: m.visibility_public
};
