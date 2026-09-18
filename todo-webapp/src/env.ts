// Typed read of window._env_, the platform's runtime config. The platform
// mounts /env-config.js into the served root before the bundle runs; this
// module throws if it did not.
//
// Only keys the browser actually needs are declared: the four <DEP>_* OIDC
// keys for the `user-auth` platform-resource dependency. `USER_AUTH_JWKS_URL`
// is emitted too but is NOT here — the browser never validates a token, the
// API gateway does, so no asset reads it. There is no browser-visible URL for
// the `todo-api` sibling: it is reached same-origin at `/api` (see
// src/api.ts), and its address arrives only as pod env for nginx.
type Env = {
  USER_AUTH_CLIENT_ID: string;
  USER_AUTH_ISSUER: string;
  USER_AUTH_SCOPES: string;
  USER_AUTH_RESOURCE: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
