import { describe, expect, it } from 'vitest';
import { areaOf } from './areas.js';

describe('areaOf', () => {
	it('places a path by its first segment', () => {
		expect(areaOf('/manage')).toBe('manage');
		expect(areaOf('/manage/sources/3')).toBe('manage');
		expect(areaOf('/account/api-keys')).toBe('account');
		expect(areaOf('/')).toBe('start');
		expect(areaOf('/no/such/page')).toBe('start');
	});

	it('does not take a longer segment for the area', () => {
		expect(areaOf('/managers')).toBe('start');
		expect(areaOf('/accounts')).toBe('start');
	});
});
