import { Writable } from 'node:stream';
import { configureLog, type LogFormat, type LogLevel } from './log';

/** For tests: sends the server log into memory instead of stdout. */
export function captureLog(format: LogFormat = 'ecs', level: LogLevel = 'info') {
	const chunks: string[] = [];
	configureLog(
		{ format, level },
		new Writable({
			write(chunk, _encoding, done) {
				chunks.push(String(chunk));
				done();
			}
		})
	);
	const lines = () =>
		chunks
			.join('')
			.split('\n')
			.filter(Boolean)
			.map((line) => JSON.parse(line) as Record<string, unknown>);
	return {
		text: () => chunks.join(''),
		lines,
		messages: () => lines().map((line) => String(line.message))
	};
}
