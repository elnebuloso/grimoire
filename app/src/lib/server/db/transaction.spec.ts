import { describe, it, expect } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { inTransaction } from './transaction';

function database() {
	const db = new DatabaseSync(':memory:');
	db.exec('CREATE TABLE items (name TEXT)');
	return db;
}

const count = (db: DatabaseSync) => db.prepare('SELECT count(*) AS n FROM items').get();

describe('inTransaction', () => {
	it('commits and returns what the work returns', () => {
		const db = database();

		expect(
			inTransaction(db, () => db.prepare("INSERT INTO items VALUES ('a')").run().changes)
		).toBe(1);
		expect(count(db)).toEqual({ n: 1 });
		expect(db.isTransaction).toBe(false);
	});

	it('rolls back everything and rethrows when the work throws', () => {
		const db = database();

		expect(() =>
			inTransaction(db, () => {
				db.exec("INSERT INTO items VALUES ('a')");
				throw new Error('broken');
			})
		).toThrow('broken');
		expect(count(db)).toEqual({ n: 0 });
		expect(db.isTransaction).toBe(false);
	});
});
