#!/usr/bin/env bash
# Starts a built image and runs what plain Node loads from source in it: the child process that
# indexes a source, and the reset script. Both only work when everything they import was copied
# into the image, which no other check sees, because tests and e2e run in the full checkout.
set -euo pipefail

IMAGE="${1:-grimoire:latest}"

# Runs in the container as the user `node`. The schema comes from the server itself
# (MIGRATE_ONLY); the source is a Git repository made on the spot, indexed by the real indexing process.
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
import { fork } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
const db = new DatabaseSync(process.env.DATABASE_PATH);
db.exec(\"INSERT INTO sources (id, slug, git_url, branch, path) VALUES (1, 'smoke', 'file:///tmp/fixture', 'main', 'docs/')\");
// Not --input-type from this eval, which a process started from a file refuses.
const child = fork(fileURLToPath(import.meta.resolve('#lib/server/sync/index-worker.ts')), {
	execArgv: []
});
child.send({
	checkout: '/tmp/fixture',
	source: { path: 'docs/', exclusions: ['docs/shared.md'] },
	remote: { url: 'file:///tmp/fixture', username: null },
	allowedIncludeOrigins: [],
	databasePath: process.env.DATABASE_PATH,
	sourceId: 1,
	commit: 'smoke'
});
const result = await new Promise((resolve, reject) => {
	child.once('message', resolve);
	child.once('error', reject);
	child.once('close', (code, signal) => reject(new Error('indexing ended with ' + (signal ?? code))));
});
const snippet = db.prepare('SELECT content FROM snippets').all().map((row) => row.content).join();
if (result.pages !== 1 || !snippet.includes('Included text from the fixture.')) {
	throw new Error('indexing in the image went wrong: ' + JSON.stringify(result));
}
console.log('indexing process: ok');
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
