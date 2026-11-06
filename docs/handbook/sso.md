# Single sign-on

!!! info "Prerequisites"
    - Reader: operator.
    - Required access: the environment of the grimoire container, and someone who can register
      an application at your identity provider.
    - `BASE_URL` is set and grimoire is reached over `https` (see [Reverse proxy](docker.md#reverse-proxy)).

Users can log in through any OpenID Connect provider you configure, such as GitLab, Microsoft
Entra ID or Google, next to their password. The login page shows one button per provider.

What decides which account a provider login reaches:

- A provider login reaches an existing account only once that account is linked to it. Users link
  a provider themselves under **Login and password**, with their password, or by accepting an invitation
  through the provider. An email address the provider reports never links anything: a login whose
  address belongs to an unlinked account is refused.
- A login that reaches no account creates one only for an address the provider marks as verified,
  in a domain you allow for that provider. Such an account is a user without a role and without a
  password, like an invited one: it reads the public and internal sources and creates its own API
  keys, nothing more.
- grimoire keeps nothing of the provider's tokens and asks the provider nothing after the login. A
  provider login lasts like a password login: 60 minutes without a request, 12 hours at most.
- Roles stay in grimoire; groups at the provider grant nothing. Admins make an account admin in
  `Management > Access > Users`.

## What a provider must support

grimoire treats every provider alike; GitLab, Entra and Google below only need particular settings
at their end. Any other provider works if it offers:

- OpenID Connect with a discovery document at `<issuer>/.well-known/openid-configuration`. Plain
  OAuth 2.0 is not enough: logging in with GitHub accounts is not possible.
- A web application with a client secret (a confidential client). A public client without a secret
  cannot be configured.
- The authorization code flow with PKCE (`S256`).
- In the ID token: `sub`, the user's ID at the provider, which every login is linked by; for
  accounts to be created at a first login also `email` and `email_verified`. A provider that sends
  the address only from its userinfo endpoint logs in linked accounts and invited people, but
  creates no account.

## Configuring a provider

1. Choose a key for the provider: lowercase letters and digits, such as `gitlab` or `keycloak`. Any
   name works; it is part of the variable names and of the redirect URI, so changing it later
   means registering the new redirect URI at the provider.
2. Register grimoire at the provider as a web application with a client secret, the scopes
   `openid` and `email`, and the redirect URI `<BASE_URL>/auth/oidc/<key>/callback`, such as
   `https://grimoire.example.com/auth/oidc/gitlab/callback`.
3. Set the variables below and restart grimoire. The log names the redirect URI of each provider:
   `OIDC provider gitlab: register the redirect URI https://grimoire.example.com/auth/oidc/gitlab/callback`.

| Variable | Default | Meaning |
|---|---|---|
| `OIDC_PROVIDERS` | none | Keys of the providers, separated by spaces or commas, such as `gitlab entra`. Empty: no provider, no login button. |
| `OIDC_<KEY>_ISSUER` | none, required | Issuer URL of the provider, without `/.well-known/openid-configuration`: the value of `issuer` in that document, exactly, trailing slash included. `https` only; `http` only for `localhost`. |
| `OIDC_<KEY>_CLIENT_ID` | none, required | Client ID of the registered application. |
| `OIDC_<KEY>_CLIENT_SECRET` | none, required | Client secret of the registered application. It never appears in the log. |
| `OIDC_<KEY>_LABEL` | the key | Name on the button: `Log in with <LABEL>`. |
| `OIDC_<KEY>_ALLOWED_DOMAINS` | none | Domains whose verified addresses get an account at their first login, such as `example.com,example.org`; `*` for any domain. Empty: no account is created, the provider only logs in to linked accounts. |
| `OIDC_<KEY>_REQUIRED_CLAIMS` | none | Claims every login through the provider must carry, as `name=value` separated by spaces, such as `hd=example.com`. Checked on every login, also of linked accounts; the value must match exactly. |

`<KEY>` is the key in uppercase: the key `gitlab` reads `OIDC_GITLAB_ISSUER`.

This prints the value for `OIDC_<KEY>_ISSUER`:

```sh
curl -s https://gitlab.example.com/.well-known/openid-configuration | jq -r .issuer
```

Docker Compose, under `environment:` of the grimoire service:

```yaml
      BASE_URL: https://grimoire.example.com
      OIDC_PROVIDERS: gitlab
      OIDC_GITLAB_ISSUER: https://gitlab.example.com
      OIDC_GITLAB_CLIENT_ID: <application id>
      OIDC_GITLAB_CLIENT_SECRET: <secret>
      OIDC_GITLAB_LABEL: GitLab
      OIDC_GITLAB_ALLOWED_DOMAINS: example.com
```

## Who gets an account

- **No allowed domains** (the default): only people with a linked account or an invitation get in.
- **A list of domains**: in addition, anyone whose verified address is in one of them gets an
  account at their first login. The domain must match exactly; `example.com` does not allow
  `mail.example.com`.
- **`*`**: anyone the provider vouches for.

!!! danger "`*` with a public provider"
    With gitlab.com, Google or Microsoft personal accounts, `*` gives an account to anyone on the
    internet. Every account reads every internal source and creates API keys that read them. Use `*` only with a provider that admits nobody but your organisation.

An invitation works regardless of the allowed domains: the invited person accepts it through the
provider, and the account keeps the invited address.

## GitLab

- Issuer: the address of the instance, such as `https://gitlab.example.com`; for gitlab.com
  `https://gitlab.com`.
- Register the application as confidential with the scopes `openid` and `email`.
- With the scope `email`, GitLab sends the user's primary email address and whether it is
  confirmed, also when the profile shows no public email address. A confirmed address in an
  allowed domain therefore gets an account at the first login.

## Microsoft Entra ID

- Register a single-tenant application. Issuer: `https://login.microsoftonline.com/<tenant id>/v2.0`.
  An issuer with `common`, `organizations` or `consumers` admits accounts of any tenant.
- Entra sends no `email_verified`. For accounts to be created, add the optional claims `email` and
  `xms_edov` to the ID token in the app registration; `xms_edov` says whether the address's domain
  is verified.
- Guests of your tenant sign in through your issuer too. To keep them out, set
  `OIDC_<KEY>_REQUIRED_CLAIMS=acct=0` (`0` member, `1` guest), with the optional claim `acct`.
- With **Assignment required** in the enterprise application, only users and groups assigned to it
  get a login at all.
- The client secret has an expiry date. Once it has passed, every login through Entra ends with
  `The login at the identity provider did not complete.`; create a new secret before then.

## Google

- Issuer: `https://accounts.google.com`. Create an OAuth client of the type web application.
- An allowed domain alone does not prove a person belongs to your Google Workspace: anyone can
  create a personal Google account with an address of your domain, and keeps it after leaving.
  Set `OIDC_<KEY>_REQUIRED_CLAIMS=hd=<your workspace domain>`; Google sends `hd` only for accounts
  of a Workspace.

## What blocking at the provider does not end

Blocking or deleting a user at the provider ends their next provider login, not their access:

- a running session lasts until 60 minutes without a request, at most 12 hours after the login;
- their API keys keep working;
- a password they set keeps working.

When someone leaves, delete their account under `Management > Access > Users` too. A deleted user whose
address is in an allowed domain gets a new, empty account at their next provider login; to keep
them out, block them at the provider or narrow the allowed domains.

## Changing the issuer or the application

A link is the issuer and the user's ID at the provider. When the issuer changes, even by a trailing
slash, or you register the application anew (Entra gives users a new ID per application), no link
matches any more:

- users with a password log in with it and link the provider again under **Login and password**;
- users without a password set one through a link: by mail under **Login and password**, or from an admin
  under `Management > Access > Users`, **Password link**, which works without mail too.

`Management > Access > Users` marks links to a provider that is no longer configured with `(no longer offered
here)`; an admin can remove them there.

## Troubleshooting

### The server does not start

The log names the cause; correct the variable and start again:

- `BASE_URL is required when OIDC_PROVIDERS is set`
- `OIDC_GITLAB_ISSUER is required for the OIDC provider gitlab`, also for `_CLIENT_ID` and
  `_CLIENT_SECRET`
- `OIDC_GITLAB_ISSUER must be an https URL (http only for localhost), got "…"`
- `OIDC_PROVIDERS: "GitLab" must be lowercase letters and digits`
- `OIDC providers gitlab and gitlabcom share an issuer`: one provider per issuer.
- `OIDC_GITLAB_REQUIRED_CLAIMS: "hd" must be name=value`, `OIDC_GITLAB_REQUIRED_CLAIMS names the
  claim hd twice`

### `Logging in through the identity provider is not possible right now.`

grimoire could not reach the provider, the provider answered with a server error, or
`OIDC_<KEY>_ISSUER` does not lead to it. The log names which request failed:

- `OIDC provider <key> unavailable: discovery failed: <error>`: the container could not reach
  `<ISSUER>/.well-known/openid-configuration` (`TypeError: fetch failed`, `operation timed out`),
  or the provider answered with an HTTP status of 500 or above. Check the network between the two.
- `OIDC provider <key> misconfigured: discovery failed: <error>; check OIDC_<KEY>_ISSUER`: the
  address answered, but not with the provider's configuration, such as `(HTTP 404)` for a wrong
  path, or `discovered metadata issuer does not match the expected issuer` when the issuer stated
  there differs from `OIDC_<KEY>_ISSUER`. Trying again does not help; fix the variable.
- `OIDC provider <key> unavailable: token request failed: <error>`: the provider's token endpoint
  did not answer within 10 seconds (`operation timed out`), could not be reached
  (`TypeError: fetch failed`), answered with an HTTP status of 500 or above, or limited the rate
  (HTTP 429). The status stands at the end, such as
  `ClientError: unexpected HTTP response status code (HTTP 502)`.

The next login tries again.

### `The login at the identity provider did not complete.`

The user took longer than 10 minutes at the provider, cancelled there, or the provider refused
the login. The log has `OIDC login through <key> failed: <error>`.

- `the flow cookie is expired`: the user took longer than 10 minutes at the provider.
- `the flow cookie is missing`: the browser came back without the cookie the login started with.
  Usually the login started under another host name than the one in `BASE_URL`, such as a short
  intranet name, a second DNS name or the IP address: the cookie belongs to the host it was set
  on, and the provider sends the user back to `BASE_URL`. Open grimoire only under the `BASE_URL`
  host, for instance by redirecting the other names to it in the reverse proxy. A browser that
  blocks cookies has the same effect.
- Otherwise the OAuth error the provider sent, its HTTP status and description, such as
  `OIDC login through gitlab failed: invalid_client (HTTP 401): Client authentication failed`.

- Logged as a warning: `invalid_client` or `unauthorized_client`, or any answer with HTTP 401 (a
  wrong or expired client secret, or a client ID the provider does not know). Every login through
  the provider fails until you fix it.
- Logged as information: `access_denied` (the user cancelled at the provider), and anything else
  a single user causes, such as a code used twice or too late (`invalid_grant`), even where the
  provider's description mentions the redirection URI. An answer that is not OAuth, such as the
  page of a firewall in front of the provider, is logged with its HTTP status, such as
  `ClientError: unexpected response content-type (HTTP 403)`.

### The provider shows an error about the redirect URI

Register the redirect URI exactly as the log names it at start, scheme and path included.

### `Your account at the identity provider may not log in here.`

The login lacks a claim of `OIDC_<KEY>_REQUIRED_CLAIMS` or has another value. A misspelled claim
name refuses every login through the provider, linked accounts too.
