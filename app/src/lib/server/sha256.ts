import { createHash } from 'node:crypto';

/** The SHA-256 of `value` in hex, as tokens and keys are stored. */
export function sha256(value: string): string {
	return createHash('sha256').update(value).digest('hex');
}
