import type { UrlContent } from '../parsing/include';

const TIMEOUT_MS = 10_000;
const MAX_BYTES = 1024 * 1024;

/**
 * `INCLUDE_URL_ALLOW`: the origins URL includes may be fetched from, separated by commas or
 * spaces, each `https://` and nothing after the host and port. Empty when not set.
 */
export function parseAllowedOrigins(value: string | undefined): string[] {
	return (value ?? '')
		.split(/[\s,]+/)
		.filter(Boolean)
		.map((entry) => {
			let url: URL | undefined;
			try {
				url = new URL(entry);
			} catch {
				url = undefined;
			}
			if (!url || url.protocol !== 'https:' || entry.replace(/\/$/, '') !== url.origin) {
				throw new Error(
					`INCLUDE_URL_ALLOW "${entry}" is not an https:// origin such as https://docs.example.com`
				);
			}
			return url.origin;
		});
}

/**
 * Fetches a file included by URL, only from an allowed origin. Follows no redirect, which could
 * lead anywhere, sends no credentials, and gives up after 10 seconds or 1 MiB. Never throws: what
 * goes wrong comes back as the problem.
 */
export async function fetchInclude(
	url: string,
	allowedOrigins: string[],
	limits = { timeoutMs: TIMEOUT_MS, maxBytes: MAX_BYTES }
): Promise<UrlContent> {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return { problem: 'not a valid URL' };
	}
	if (parsed.username || parsed.password) return { problem: 'a URL with credentials' };
	if (!allowedOrigins.includes(parsed.origin)) {
		return { problem: `${parsed.origin} is not listed in INCLUDE_URL_ALLOW` };
	}

	try {
		const response = await fetch(parsed, {
			redirect: 'manual',
			signal: AbortSignal.timeout(limits.timeoutMs)
		});
		if (response.status >= 300 && response.status < 400) {
			await response.body?.cancel();
			return { problem: `answered with a redirect (${response.status}), which is not followed` };
		}
		if (!response.ok) {
			await response.body?.cancel();
			return { problem: `answered with status ${response.status}` };
		}
		const chunks: Uint8Array[] = [];
		let size = 0;
		const reader = response.body!.getReader();
		for (let read = await reader.read(); !read.done; read = await reader.read()) {
			size += read.value.length;
			if (size > limits.maxBytes) {
				await reader.cancel();
				return { problem: `larger than ${limits.maxBytes} bytes` };
			}
			chunks.push(read.value);
		}
		return { content: Buffer.concat(chunks).toString('utf8') };
	} catch (error) {
		if ((error as Error).name === 'TimeoutError') {
			return { problem: `no answer within ${limits.timeoutMs / 1000} seconds` };
		}
		return { problem: `request failed, ${(error as Error).message}` };
	}
}
