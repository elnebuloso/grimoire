/** Runs `work` once a slot is free. */
export type Limiter = <T>(work: () => Promise<T>) => Promise<T>;

/** Lets at most `max` pieces of work run at once; the others wait in order. */
export function createLimiter(max: number): Limiter {
	let active = 0;
	const waiting: (() => void)[] = [];
	return async (work) => {
		// A finished piece hands its slot straight to the next waiting one, so a newcomer
		// cannot slip in between and exceed the limit.
		if (active < max) active++;
		else await new Promise<void>((resolve) => waiting.push(resolve));
		try {
			return await work();
		} finally {
			const next = waiting.shift();
			if (next) next();
			else active--;
		}
	};
}
