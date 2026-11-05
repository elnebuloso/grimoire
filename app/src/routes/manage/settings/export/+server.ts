import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ENCRYPTION_KEY, INSTANCE_TITLE, TZ } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { MIN_PASSPHRASE_LENGTH, writeExport } from '#lib/server/instance-export.js';
import { log } from '#lib/server/log.js';
import { dateIn } from '#lib/time-zone.js';

/**
 * Downloads the real state of the instance, encrypted with the passphrase of the form. A refusal
 * leads back to the settings with its code; the passphrase is never sent back to be filled in.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	const data = await request.formData();
	const passphrase = String(data.get('passphrase') ?? '');
	if (passphrase.length < MIN_PASSPHRASE_LENGTH) refuse('passphrase-too-short');
	if (passphrase !== String(data.get('repeat') ?? '')) refuse('passphrase-mismatch');

	const result = await writeExport(database(), ENCRYPTION_KEY.sourceTokens, passphrase);
	if ('error' in result) refuse(result.error, result.sources);

	log.info(`instance exported by user ${locals.user!.id}`);
	return new Response(new Uint8Array(result.file), {
		headers: {
			'content-type': 'application/octet-stream',
			'content-disposition': `attachment; filename="${fileName(new Date())}"`,
			'cache-control': 'no-store'
		}
	});
};

function refuse(problem: string, sources: string[] = []): never {
	const query = new URLSearchParams({ export: problem });
	if (sources.length > 0) query.set('sources', sources.join(','));
	redirect(303, `/manage/settings?${query}#export`);
}

// Names the instance and the day, so exports of several instances and days stay apart.
function fileName(now: Date): string {
	const instance = INSTANCE_TITLE.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	return `${instance || 'grimoire'}-${dateIn(TZ, now)}.grimoire-export`;
}
