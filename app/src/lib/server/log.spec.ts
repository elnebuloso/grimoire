import { describe, it, expect, afterEach, vi } from 'vitest';
import { captureLog as capture } from './capture-log';
import {
	configureLog,
	log,
	logAlways,
	parseLogFormat,
	parseLogLevel,
	routeConsoleToLog
} from './log';

afterEach(() => configureLog({ format: 'ecs', level: 'info' }));

describe('ecs', () => {
	it('writes one JSON object per line with the ECS base fields', () => {
		const output = capture('ecs', 'info');
		log.info('sync started');

		const [line] = output.lines();
		expect(line).toMatchObject({
			'log.level': 'info',
			message: 'sync started',
			'ecs.version': expect.any(String),
			'service.name': 'grimoire'
		});
		expect(line['@timestamp']).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
	});

	it('puts an error with its stack into the same line', () => {
		const output = capture('ecs', 'info');
		log.error({ err: new TypeError('no route') }, 'request failed');

		const lines = output.lines();
		expect(lines).toHaveLength(1);
		expect(lines[0]).toMatchObject({
			'log.level': 'error',
			message: 'request failed',
			error: {
				type: 'TypeError',
				message: 'no route',
				stack_trace: expect.stringContaining('TypeError: no route')
			}
		});
	});
});

describe('pretty', () => {
	it('writes the level and the message as text', () => {
		const output = capture('pretty', 'info');
		log.warn('Admin account was reset.');

		expect(output.text()).toMatch(/WARN.*Admin account was reset\./);
		expect(() => JSON.parse(output.text())).toThrow();
	});
});

describe('LOG_LEVEL', () => {
	it('drops messages below the level', () => {
		const output = capture('ecs', 'info');
		log.debug('details');
		log.info('shown');
		expect(output.lines().map((line) => line.message)).toEqual(['shown']);
	});

	it('keeps only errors at error', () => {
		const output = capture('ecs', 'error');
		log.warn('hidden');
		log.error('shown');
		expect(output.lines().map((line) => line.message)).toEqual(['shown']);
	});

	it('does not hold back what has to be written always', () => {
		const output = capture('ecs', 'error');
		logAlways('setup token abc');
		expect(output.lines()).toMatchObject([{ 'log.level': 'warn', message: 'setup token abc' }]);
	});
});

describe('routeConsoleToLog', () => {
	afterEach(() => vi.restoreAllMocks());

	it('turns what the framework writes with console into log lines', () => {
		for (const method of ['debug', 'log', 'info', 'warn', 'error'] as const) {
			vi.spyOn(console, method);
		}
		const output = capture('ecs', 'info');
		routeConsoleToLog();

		console.log('Listening on %s', 'http://0.0.0.0:3000');
		console.error(new Error('Could not determine request origin'));

		expect(output.lines()).toMatchObject([
			{ 'log.level': 'info', message: 'Listening on http://0.0.0.0:3000' },
			{ 'log.level': 'error', error: { message: 'Could not determine request origin' } }
		]);
	});
});

describe('parsing the environment', () => {
	it('defaults to ecs and info', () => {
		expect(parseLogFormat(undefined)).toBe('ecs');
		expect(parseLogLevel('')).toBe('info');
	});

	it('accepts the known values', () => {
		expect(parseLogFormat('pretty')).toBe('pretty');
		expect(parseLogLevel('debug')).toBe('debug');
	});

	it('rejects unknown values, naming the variable and the value', () => {
		expect(() => parseLogFormat('json')).toThrow('LOG_FORMAT "json" is not one of ecs, pretty');
		expect(() => parseLogLevel('verbose')).toThrow(
			'LOG_LEVEL "verbose" is not one of error, warn, info, debug'
		);
	});
});
