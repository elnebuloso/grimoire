// Serves the bare repositories below a directory over https through `git http-backend`, for e2e
// and the image smoke test: the server reaches Git only over https, and these must not need the
// network. Any credentials are accepted.
//
//   node scripts/git-https-server.ts <repositories> <port> <cert.pem> <key.pem>
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:https';

const [root, port, cert, key] = process.argv.slice(2);
if (!root || !port || !cert || !key) {
	console.error('usage: git-https-server.ts <repositories> <port> <cert.pem> <key.pem>');
	process.exit(2);
}

const server = createServer(
	{ cert: readFileSync(cert), key: readFileSync(key) },
	(request, response) => {
		const url = new URL(request.url ?? '/', 'https://localhost');
		const backend = spawn('git', ['http-backend'], {
			env: {
				PATH: process.env.PATH,
				GIT_PROJECT_ROOT: root,
				GIT_HTTP_EXPORT_ALL: '1',
				REQUEST_METHOD: request.method,
				PATH_INFO: decodeURIComponent(url.pathname),
				QUERY_STRING: url.search.slice(1),
				CONTENT_TYPE: request.headers['content-type'] ?? '',
				HTTP_CONTENT_ENCODING: request.headers['content-encoding'] ?? '',
				GIT_PROTOCOL: request.headers['git-protocol'] ?? '',
				REMOTE_ADDR: request.socket.remoteAddress ?? '',
				// Blob-less clones fetch the files of a sparse checkout later, by hash.
				GIT_CONFIG_COUNT: '2',
				GIT_CONFIG_KEY_0: 'uploadpack.allowFilter',
				GIT_CONFIG_VALUE_0: 'true',
				GIT_CONFIG_KEY_1: 'uploadpack.allowAnySHA1InWant',
				GIT_CONFIG_VALUE_1: 'true'
			}
		});
		request.pipe(backend.stdin);
		backend.stderr.pipe(process.stderr);

		// CGI output: header lines, an empty line, the body.
		let head = Buffer.alloc(0);
		let headersSent = false;
		backend.stdout.on('data', (chunk: Buffer) => {
			if (headersSent) {
				response.write(chunk);
				return;
			}
			head = Buffer.concat([head, chunk]);
			const end = head.indexOf('\r\n\r\n');
			if (end === -1) return;
			let status = 200;
			for (const line of head.subarray(0, end).toString().split('\r\n')) {
				const colon = line.indexOf(':');
				const name = line.slice(0, colon).trim();
				const value = line.slice(colon + 1).trim();
				if (name.toLowerCase() === 'status') status = Number.parseInt(value, 10);
				else response.setHeader(name, value);
			}
			response.writeHead(status);
			headersSent = true;
			response.write(head.subarray(end + 4));
		});
		backend.on('close', () => {
			if (!headersSent) response.writeHead(500);
			response.end();
		});
	}
);
server.listen(Number(port), () => console.log(`git over https on port ${port}, from ${root}`));
