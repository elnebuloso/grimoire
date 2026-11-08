# Trying things by hand

- Admin forms with curl: a POST without a body gets 415, send `-d ""`. Over plain `http` add
  `-H X-Forwarded-Proto:http -H Origin:<url>` (server with `PROTOCOL_HEADER=x-forwarded-proto`);
  `-H 'x-sveltekit-action: true'` returns the action result as JSON.
- MCP with curl needs `Accept: application/json, text/event-stream`, or the transport rejects the
  request.
- Stop a test server by the PID `ss -ltnp` shows for its port, not by `$!`, which is the PID of
  the wrapping shell or npm. `pkill -f <pattern>` kills the agent's own shell, whose command line
  contains the pattern.
- `docker exec -it` needs a terminal; without one:
  `printf 'new password\nnew password\n' | script -qec "docker exec -it <container> node scripts/grant-admin.ts <email> --password" /dev/null`.
  The output then shows the piped passwords: the pseudo terminal echoes them before the script
  turns echo off. Typed by hand, they stay hidden.
- The OIDC callback page continues by `<meta http-equiv="refresh">`, not by a redirect: curl
  stops there. A login is complete at that point; a link is not until the page's
  `/account/link` is requested with the same cookies.
- The Playwright MCP browser saves screenshots only inside the repository (`.playwright-mcp/`,
  ignored by git), not in the scratchpad.
- A dev server started before an update can run old server code against a newer indexing
  worker, which is read from disk at every sync: after a pull that touches `sync/`, restart
  `make dev` or the agent environment (`make agent-stop && make agent-start`).
- Close the Playwright MCP browser (`browser_close`) once a check by hand is done: it stays open
  in WSL otherwise, and a hung page blocks every later call until it is closed.
- The Playwright MCP browser answers native `confirm()` dialogs on its own in some runs and holds
  them in others; register `page.on('dialog', …)` in the script to decide, and never click a
  destructive action outside the agent environment.
- Sources added to the agent database by hand with made-up Git URLs are synced by its scheduler
  within seconds and end with a sync error; reset afterwards. `make agent-many-sources` adds 500
  paused ones, which the scheduler leaves alone; `make agent-reset` removes them.
- A Playwright click on a button that opens a dialog does nothing before hydration: load the page
  with `waitUntil: 'networkidle'` first.
