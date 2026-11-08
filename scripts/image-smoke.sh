#!/usr/bin/env bash
# Starts a built image and runs what plain Node loads from source in it: the checked Git calls, the
# child process that indexes a source, and the grant-admin, backup and import scripts. They only
# work when everything they import was copied into the image, which no other check sees, because
# tests and e2e run in the full checkout.
set -euo pipefail

IMAGE="${1:-grimoire:latest}"
VERSION="${2:-0.0.0}"

# Runs in the container as the user `node`. The schema comes from the server itself
# (MIGRATE_ONLY); the source is a Git repository made on the spot, indexed by the real indexing process.
read -r -d '' SMOKE <<'EOF' || true
set -eu
if [ "$GRIMOIRE_VERSION" != "$EXPECTED_VERSION" ]; then
	echo "GRIMOIRE_VERSION is '$GRIMOIRE_VERSION', expected '$EXPECTED_VERSION'" >&2
	exit 1
fi
echo 'version: ok'
MIGRATE_ONLY=true node app/build

# The source comes from a local https Git server, through the same checked and pinned Git calls a
# sync makes: its page includes a file outside the source path, which the indexing process fetches.
work=/tmp/fixture
mkdir -p "$work/docs" "$work/shared" /tmp/repositories
printf '# Start\n\n## Setup\n\n--8<-- "shared/included.md"\n' > "$work/docs/index.md"
printf 'Included text from the fixture.\n' > "$work/shared/included.md"
git -C "$work" init --quiet --initial-branch=main
git -C "$work" -c user.name=smoke -c user.email=smoke@example.com add --all
git -C "$work" -c user.name=smoke -c user.email=smoke@example.com commit --quiet -m fixture
git clone --quiet --bare "$work" /tmp/repositories/fixture.git
node /smoke/git-https-server.ts /tmp/repositories 4443 /smoke/cert.pem /smoke/key.pem >/tmp/git-server.log 2>&1 &
for _ in $(seq 50); do
	node -e "require('node:net').connect(4443, 'localhost').on('connect', () => process.exit(0)).on('error', () => process.exit(1))" && break
	sleep 0.2
done
export GIT_SSL_CAINFO=/smoke/cert.pem

cd app
node --input-type=module -e "
import { fork } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
const { sparseClone } = await import('#lib/server/sync/git.ts');
const db = new DatabaseSync(process.env.DATABASE_PATH);
const remote = {
	url: 'https://localhost:4443/fixture.git',
	username: null,
	policy: { allowedHosts: ['localhost'], proxy: false }
};
db.exec(\"INSERT INTO sources (id, slug, name, git_url, branch, path) VALUES (1, 'smoke', 'Smoke', 'https://localhost:4443/fixture.git', 'main', 'docs/')\");
await sparseClone(remote, 'main', 'docs/', '/tmp/checkout');
// Not --input-type from this eval, which a process started from a file refuses.
const child = fork(fileURLToPath(import.meta.resolve('#lib/server/sync/index-worker.ts')), {
	execArgv: []
});
child.send({
	checkout: '/tmp/checkout',
	source: { path: 'docs/', exclusions: [] },
	remote,
	allowedIncludeOrigins: [],
	databasePath: process.env.DATABASE_PATH,
	sourceId: 1,
	branch: 'main',
	commit: 'smoke',
	serverPid: process.pid
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
console.log('git over https and indexing process: ok');
"

# An unknown address is refused after all of the script's imports loaded.
if node ../scripts/grant-admin.ts nobody@example.com 2>&1 | grep -q 'No account has that email address'; then
	echo 'grant-admin script: ok'
else
	node ../scripts/grant-admin.ts nobody@example.com || true
	exit 1
fi

node ../scripts/backup.ts /tmp/smoke-backup.db
node -e "
const { DatabaseSync } = require('node:sqlite');
const count = new DatabaseSync('/tmp/smoke-backup.db').prepare('SELECT count(*) AS n FROM snippets').get().n;
if (count === 0) throw new Error('the backup has no snippets');
"
echo 'backup script: ok'

# The export written by the first version that exports, read with the migrations from their folder.
printf 'fixture passphrase 2026\r' | DATABASE_PATH=/tmp/smoke-import.db \
	script -qec 'node ../scripts/import.ts src/lib/server/fixtures/export-schema-4.grimoire-export' /dev/null \
	> /tmp/smoke-import.log
if grep -q 'Imported 2 users and 2 sources' /tmp/smoke-import.log; then
	echo 'import script: ok'
else
	cat /tmp/smoke-import.log
	exit 1
fi
EOF

# A certificate of its own for the Git server in the container; readable for the user `node` there.
certificates="$(mktemp -d)"
trap 'rm -rf "$certificates"' EXIT
openssl req -x509 -newkey rsa:2048 -nodes -days 2 -subj /CN=localhost \
	-addext subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1 \
	-keyout "$certificates/key.pem" -out "$certificates/cert.pem" 2>/dev/null
chmod a+rx "$certificates" && chmod a+r "$certificates"/*.pem
cp "$(dirname "$0")/git-https-server.ts" "$certificates/"

docker run --rm \
	--volume "$certificates:/smoke:ro" \
	--env ENCRYPTION_KEY="$(head -c 32 /dev/urandom | base64)" \
	--env LOG_LEVEL=error \
	--env EXPECTED_VERSION="$VERSION" \
	--entrypoint sh \
	"$IMAGE" -c "$SMOKE"
