#!/usr/bin/env bash
# The agent environment: a dev server with its own settings, database and port, so an agent can
# try changes and reset data without touching the developer's `make dev`.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Inside app/: the generated files import from app/node_modules.
DIR="$ROOT/app/.agent"
PORT=5174

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
		TOKEN_ENCRYPTION_KEY=BwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwc=
		SYNC_SCHEDULE="*/5 * * * *"
	EOF
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
