// Loaded by the scripts in `scripts/` with plain node too, through `admin/auth.ts`: it may import
// npm packages and `node:` modules, but nothing that needs Vite (`#lib`, `$app`).
import { format } from 'node:util';
import { pino, type Logger } from 'pino';
import { ecsFormat } from '@elastic/ecs-pino-format';
import { PinoPretty } from 'pino-pretty';

const FORMATS = ['ecs', 'pretty'] as const;
const LEVELS = ['error', 'warn', 'info', 'debug'] as const;

export type LogFormat = (typeof FORMATS)[number];
export type LogLevel = (typeof LEVELS)[number];

function oneOf<T extends string>(name: string, value: string, allowed: readonly T[]): T {
	if ((allowed as readonly string[]).includes(value)) return value as T;
	throw new Error(`${name} "${value}" is not one of ${allowed.join(', ')}`);
}

/** `LOG_FORMAT`: `ecs`, one JSON object per line in the Elastic Common Schema, or `pretty`. */
export function parseLogFormat(value: string | undefined): LogFormat {
	return oneOf('LOG_FORMAT', value || 'ecs', FORMATS);
}

/** `LOG_LEVEL`: the lowest level that is written. */
export function parseLogLevel(value: string | undefined): LogLevel {
	return oneOf('LOG_LEVEL', value || 'info', LEVELS);
}

export function createLogger(
	{ format, level }: { format: LogFormat; level: LogLevel },
	destination: NodeJS.WritableStream = process.stdout
): Logger {
	if (format === 'pretty') {
		// A stream in this thread, not a pino transport: a transport runs in a worker that loads
		// its module from disk, which the bundled server does not ship.
		return pino({ level }, PinoPretty({ sync: true, destination }));
	}
	return pino(
		{ ...ecsFormat({ serviceName: 'grimoire', apmIntegration: false }), level },
		destination
	);
}

/** The logger of the server; `configureLog` sets it up from the environment on start. */
export let log = createLogger({ format: 'ecs', level: 'info' });

export function configureLog(
	options: { format: LogFormat; level: LogLevel },
	destination?: NodeJS.WritableStream
) {
	log = createLogger(options, destination);
}

/** Writes a warning whatever `LOG_LEVEL` says, for what nobody can do without, like the setup token. */
export function logAlways(message: string) {
	log.child({}, { level: 'debug' }).warn(message);
}

/**
 * Sends what SvelteKit and the Node adapter write with `console`, such as `Listening on …`, through
 * the logger too, so every line follows LOG_FORMAT and LOG_LEVEL.
 */
export function routeConsoleToLog() {
	const route =
		(level: 'debug' | 'info' | 'warn' | 'error') =>
		(...args: unknown[]) => {
			const err = args.find((arg) => arg instanceof Error);
			log[level](err ? { err } : {}, format(...args));
		};
	/* eslint-disable no-console -- replacing the console methods, not writing with them */
	console.debug = route('debug');
	console.log = route('info');
	console.info = route('info');
	console.warn = route('warn');
	console.error = route('error');
	/* eslint-enable no-console */
}
