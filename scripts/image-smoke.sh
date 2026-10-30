#!/usr/bin/env bash
# Starts a built image and runs what plain Node loads from source in it: the worker thread that
# indexes a source, and the reset script. Both only work when everything they import was copied
# into the image, which no other check sees, because tests and e2e run in the full checkout.
set -euo pipefail

IMAGE="${1:-grimoire:latest}"

# Runs in the container as the user `node`. The schema comes from the server itself
# (MIGRATE_ONLY); the source is a Git repository made on the spot, indexed by the real worker.
read -r -d '' SMOKE <<'EOF' || true
set -eu
MIGRATE_ONLY=true node app/build

fixture=/tmp/fixture
mkdir -p "$fixture/docs"
printf '# Start\n\n## Setup\n\n--8<-- "docs/shared.md"\n' > "$fixture/docs/index.md"
printf 'Included text from the fixture.\n' > "$fixture/docs/shared.md"
git -C "$fixture" init --quiet
git -C "$fixture" -c user.name=smoke -c user.email=smoke@example.com add --all
git -C "$fixture" -c user.name=smoke -c user.email=smoke@example.com commit --quiet -m fixture

cd app
node --input-type=module -e "
import { DatabaseSync } from 'node:sqlite';
import { Worker } from 'node:worker_threads';
const db = new DatabaseSync(process.env.DATABASE_PATH);
db.exec(\"INSERT INTO projects (id, slug) VALUES (1, 'smoke')\");
db.exec(\"INSERT INTO sources (id, project_id, slug, git_url, branch, path) VALUES (1, 1, 'docs', 'file:///tmp/fixture', 'main', 'docs/')\");
const worker = new Worker(new URL(import.meta.resolve('#lib/server/sync/index-worker.ts')), {
	// Not --input-type from this eval, which a worker started from a file refuses.
	execArgv: [],
	workerData: {
		checkout: '/tmp/fixture',
		source: { path: 'docs/', exclusions: ['docs/shared.md'] },
		remote: { url: 'file:///tmp/fixture', username: null },
		allowedIncludeOrigins: [],
		databasePath: process.env.DATABASE_PATH,
		sourceId: 1,
		commit: 'smoke'
	}
});
const result = await new Promise((resolve, reject) => {
	worker.once('message', resolve);
	worker.once('error', reject);
});
const snippet = db.prepare('SELECT content FROM snippets').all().map((row) => row.content).join();
if (result.pages !== 1 || !snippet.includes('Included text from the fixture.')) {
	throw new Error('indexing in the image went wrong: ' + JSON.stringify(result));
}
console.log('indexing worker: ok');
"

# Without a terminal the script stops at its first question, after all of its imports loaded.
if node ../scripts/reset-admin.ts 2>&1 < /dev/null | grep -q 'Run this in a terminal'; then
	echo 'reset script: ok'
else
	node ../scripts/reset-admin.ts < /dev/null || true
	exit 1
fi
EOF

docker run --rm \
	--env TOKEN_ENCRYPTION_KEY="$(head -c 32 /dev/urandom | base64)" \
	--env LOG_LEVEL=error \
	--entrypoint sh \
	"$IMAGE" -c "$SMOKE"
