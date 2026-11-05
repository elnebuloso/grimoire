/** An identity provider the operator configured. */
export interface OidcProvider {
	/** Names the provider in its routes and its variables, such as `gitlab`. */
	key: string;
	issuer: string;
	clientId: string;
	clientSecret: string;
	/** What the login button says. */
	label: string;
	/** Domains whose verified addresses may sign up; `'*'` for any, empty for none. */
	allowedDomains: string[] | '*';
	/** Claims every login must carry, each with the value it must have. */
	requiredClaims: [name: string, value: string][];
	redirectUri: string;
}

const KEY = /^[a-z][a-z0-9]*$/;

/**
 * The providers `keys` names (separated by commas or spaces), with their settings from `env`
 * (`OIDC_<KEY>_ISSUER` and so on). Throws on the first setting that cannot work, naming its
 * variable: a misconfigured provider fails the start instead of the first login.
 */
export function parseOidcProviders(
	keys: string,
	env: Record<string, string | undefined>,
	baseUrl: string
): OidcProvider[] {
	const names = keys.split(/[\s,]+/).filter(Boolean);
	if (names.length === 0) return [];
	if (!baseUrl) throw new Error('BASE_URL is required when OIDC_PROVIDERS is set');
	const providers = names.map((key) => parseProvider(key, env, baseUrl));
	providers.forEach((provider, index) => {
		const twin = providers.findIndex((other) => other.issuer === provider.issuer);
		if (twin !== index) {
			throw new Error(`OIDC providers ${providers[twin].key} and ${provider.key} share an issuer`);
		}
	});
	return providers;
}

function parseProvider(
	key: string,
	env: Record<string, string | undefined>,
	baseUrl: string
): OidcProvider {
	if (!KEY.test(key)) {
		throw new Error(`OIDC_PROVIDERS: "${key}" must be lowercase letters and digits`);
	}
	const prefix = `OIDC_${key.toUpperCase()}_`;
	const required = (name: string) => {
		const value = env[prefix + name]?.trim();
		if (!value) throw new Error(`${prefix}${name} is required for the OIDC provider ${key}`);
		return value;
	};
	return {
		key,
		issuer: parseIssuer(required('ISSUER'), `${prefix}ISSUER`),
		clientId: required('CLIENT_ID'),
		clientSecret: required('CLIENT_SECRET'),
		label: env[`${prefix}LABEL`]?.trim() || key,
		allowedDomains: parseDomains(env[`${prefix}ALLOWED_DOMAINS`]),
		requiredClaims: parseClaims(env[`${prefix}REQUIRED_CLAIMS`], `${prefix}REQUIRED_CLAIMS`),
		redirectUri: `${baseUrl}/auth/oidc/${key}/callback`
	};
}

// Kept as written: ID tokens must carry exactly this issuer, a trailing slash included.
function parseIssuer(value: string, variable: string): string {
	const url = URL.parse(value);
	const local = url?.hostname === 'localhost' || url?.hostname === '127.0.0.1';
	if (!url || !(url.protocol === 'https:' || (url.protocol === 'http:' && local))) {
		throw new Error(`${variable} must be an https URL (http only for localhost), got "${value}"`);
	}
	return value;
}

function parseDomains(value: string | undefined): string[] | '*' {
	const domains = (value ?? '').split(/[\s,]+/).filter(Boolean);
	if (domains.includes('*')) return '*';
	return domains.map((domain) => domain.toLowerCase());
}

function parseClaims(value: string | undefined, variable: string): [string, string][] {
	const pairs = (value ?? '').split(/[\s,]+/).filter(Boolean);
	const claims = pairs.map((pair): [string, string] => {
		const [name, claimValue, ...rest] = pair.split('=');
		if (!name || !claimValue || rest.length > 0) {
			throw new Error(`${variable}: "${pair}" must be name=value`);
		}
		return [name, claimValue];
	});
	const names = claims.map(([name]) => name);
	const repeated = names.find((name, index) => names.indexOf(name) !== index);
	if (repeated) throw new Error(`${variable} names the claim ${repeated} twice`);
	return claims;
}
