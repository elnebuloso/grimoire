#!/usr/bin/env bash
# Prepares a fresh clone for `make dev`: checks the Node version, creates `app/.env` with a new
# token encryption key unless it exists, and installs the dependencies. Safe to run again.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/app"

# The required version is the one `engines` names; npm would refuse with a less helpful message.
required="$(node -p "require('$APP/package.json').engines.node.replace(/^>=/, '')")"
if ! node -e "
	const [have, need] = [process.versions.node, '$required'].map((v) => v.split('.').map(Number));
	const index = have.findIndex((part, i) => part !== need[i]);
	process.exit(index === -1 || have[index] > need[index] ? 0 : 1);
"; then
	echo "grimoire needs Node $required or newer, this is $(node -v). Switch, e.g. with: nvm use $required"
	exit 1
fi

if [ -e "$APP/.env" ]; then
	echo "app/.env exists, left unchanged."
else
	key="$(node -p "require('node:crypto').randomBytes(32).toString('base64')")"
	sed "s|^TOKEN_ENCRYPTION_KEY=.*|TOKEN_ENCRYPTION_KEY=$key|" "$APP/.env.example" > "$APP/.env"
	echo "Created app/.env with a new TOKEN_ENCRYPTION_KEY."
fi

npm --prefix "$APP" ci
echo "Ready: make dev"
