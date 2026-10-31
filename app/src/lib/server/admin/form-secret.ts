import { decryptSecret, encryptSecret } from '../secret-encryption';

/** The field the token is typed into; never sent back. */
const ENTERED_FIELD = 'token';
/** The hidden field carrying it encrypted, so the page never holds it in plain text. */
const SEALED_FIELD = 'encryptedToken';
/** The checkbox that drops the carried token, so the form forgets what was entered. */
const DISCARD_FIELD = 'discardToken';
/** The checkbox that asks to delete the token already stored. */
const REMOVE_FIELD = 'removeToken';

export interface FormSecret {
	/** The secret in plain text, empty when there is none. */
	value: string;
	/** The secret encrypted, to send back into the form. */
	sealed: string;
	/** Delete the stored secret; a new or carried one replaces it anyway. */
	remove: boolean;
	/** The carried value could not be decrypted: changed in the browser, or the key changed. */
	damaged: boolean;
}

/**
 * Reads the token of the source form: a newly entered one wins; otherwise the carried one, unless the
 * discard checkbox drops it.
 */
export function readFormSecret(data: FormData, key: Buffer): FormSecret {
	const field = (name: string) => String(data.get(name) ?? '');
	const remove = data.get(REMOVE_FIELD) === 'on';
	const entered = field(ENTERED_FIELD).trim();
	if (entered)
		return { value: entered, sealed: encryptSecret(entered, key), remove, damaged: false };
	const sealed = data.get(DISCARD_FIELD) === 'on' ? '' : field(SEALED_FIELD);
	if (!sealed) return { value: '', sealed: '', remove, damaged: false };
	try {
		return { value: decryptSecret(sealed, key), sealed, remove, damaged: false };
	} catch {
		return { value: '', sealed: '', remove, damaged: true };
	}
}
