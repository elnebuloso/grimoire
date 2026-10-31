import { decryptSecret, encryptSecret } from '../secret-encryption';

/** The form fields that carry a secret between requests. */
export interface SecretFields {
	/** The field the secret is typed into; never sent back. */
	entered: string;
	/** The hidden field carrying it encrypted, so the page never holds it in plain text. */
	sealed: string;
	/** The checkbox that drops the carried secret, so the form forgets what was entered. */
	discard: string;
	/** The checkbox that asks to delete the secret already stored. */
	remove: string;
}

export const SOURCE_TOKEN_FIELDS: SecretFields = {
	entered: 'token',
	sealed: 'encryptedToken',
	discard: 'discardToken',
	remove: 'removeToken'
};

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
 * Reads the secret of a form: a newly entered one wins; otherwise the carried one, unless the
 * discard checkbox drops it.
 */
export function readFormSecret(data: FormData, key: Buffer, fields: SecretFields): FormSecret {
	const field = (name: string) => String(data.get(name) ?? '');
	const remove = data.get(fields.remove) === 'on';
	const entered = field(fields.entered).trim();
	if (entered)
		return { value: entered, sealed: encryptSecret(entered, key), remove, damaged: false };
	const sealed = data.get(fields.discard) === 'on' ? '' : field(fields.sealed);
	if (!sealed) return { value: '', sealed: '', remove, damaged: false };
	try {
		return { value: decryptSecret(sealed, key), sealed, remove, damaged: false };
	} catch {
		return { value: '', sealed: '', remove, damaged: true };
	}
}
