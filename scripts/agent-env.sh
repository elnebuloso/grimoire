#!/usr/bin/env bash
# The agent environment: a dev server with its own settings, database and port, so an agent can
# try changes and reset data without touching the developer's `make dev`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Inside app/: the generated files import from app/node_modules.
DIR="$ROOT/app/.agent"
PORT=5174

IDP_PORT=5580
IDP_CONTAINER=grimoire-agent-idp-mock

# The identity providers the agent environment logs in with: one mock, a provider per path.
start_idp_mock() {
	docker rm -f "$IDP_CONTAINER" >/dev/null 2>&1 || true
	docker run -d --rm --name "$IDP_CONTAINER" -p "$IDP_PORT:8080" \
		ghcr.io/navikt/mock-oauth2-server:6.1.2 >/dev/null
	for _ in $(seq 60); do
		curl -sf "http://localhost:$IDP_PORT/gitlab/.well-known/openid-configuration" >/dev/null && return
		sleep 1
	done
	echo "The identity provider mock did not start within 60 s"
	exit 1
}

listening_pid() {
	ss -ltnpH "sport = :$PORT" | grep -oP 'pid=\K[0-9]+' | head -n 1 || true
}

start() {
	if [ -n "$(listening_pid)" ]; then
		echo "Port $PORT is already in use; the agent environment may be running (make agent-stop)."
		exit 1
	fi
	mkdir -p "$DIR"
	# Fixed fixture key: the sources hold no tokens, so nothing secret depends on it.
	cat > "$DIR/.env" <<-EOF
		DATABASE_PATH=$DIR/grimoire.db
		ENCRYPTION_KEY=BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=
		SYNC_SCHEDULE="*/5 * * * *"
		LOG_FORMAT=pretty
		BASE_URL=http://localhost:$PORT
		OIDC_PROVIDERS=gitlab entra
	EOF
	start_idp_mock
	# The settings of each provider come from the environment of the process, not from `.env`.
	OIDC_GITLAB_ISSUER="http://localhost:$IDP_PORT/gitlab" OIDC_GITLAB_CLIENT_ID=grimoire \
		OIDC_GITLAB_CLIENT_SECRET=agent-gitlab-secret OIDC_GITLAB_LABEL=GitLab \
		OIDC_GITLAB_ALLOWED_DOMAINS=example.com \
		OIDC_ENTRA_ISSUER="http://localhost:$IDP_PORT/entra" OIDC_ENTRA_CLIENT_ID=grimoire \
		OIDC_ENTRA_CLIENT_SECRET=agent-entra-secret OIDC_ENTRA_LABEL=Microsoft \
		OIDC_ENTRA_REQUIRED_CLAIMS=hd=example.com \
		GRIMOIRE_AGENT_DIR="$DIR" nohup npm --prefix "$ROOT/app" run dev -- --port "$PORT" --strictPort \
		> "$DIR/server.log" 2>&1 &
	for _ in $(seq 60); do
		if [ -n "$(listening_pid)" ]; then
			echo "Agent environment at http://localhost:$PORT, log in $DIR/server.log"
			return
		fi
		sleep 1
	done
	echo "The server did not start within 60 s; see $DIR/server.log"
	exit 1
}

stop() {
	local pid
	docker stop "$IDP_CONTAINER" >/dev/null 2>&1 || true
	pid="$(listening_pid)"
	if [ -z "$pid" ]; then
		echo "The agent environment is not running."
		return
	fi
	kill "$pid"
	echo "Agent environment stopped."
}

reset() {
	node "$ROOT/scripts/agent-seed.ts" "$DIR/grimoire.db"
}

case "${1:-}" in
	start) start ;;
	stop) stop ;;
	reset) reset ;;
	*)
		echo "usage: $0 start|stop|reset"
		exit 1
		;;
esac
