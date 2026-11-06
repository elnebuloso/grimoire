// Adds 500 made-up sources to the agent environment's database, to see lists and pickers at the
// size an instance can reach. They are paused, so the scheduler does not try to sync their URLs.
// `make agent-reset` removes them again.
import { DatabaseSync } from 'node:sqlite';

const COUNT = 500;

const path = process.argv[2];
if (!path) throw new Error('usage: node scripts/agent-many-sources.ts <database path>');

const db = new DatabaseSync(path, { timeout: 5000 });
const insert = db.prepare(
	`INSERT INTO sources (slug, name, git_url, branch, path, paused)
	VALUES (?, ?, ?, 'main', 'docs', 1)`
);
db.exec('BEGIN IMMEDIATE');
for (let index = 1; index <= COUNT; index++) {
	const number = String(index).padStart(3, '0');
	insert.run(
		`team-${number}-docs`,
		`Team ${number}`,
		`https://git.example.com/team-${number}/docs.git`
	);
}
db.exec('COMMIT');
console.log(`${COUNT} paused sources added to ${path}; make agent-reset removes them.`);
