// mockEnv carries exactly the keys the platform actually emits for this
// component: the four USER_AUTH_* OIDC keys src/env.ts declares. No sibling
// API URL — todo-api is same-origin at /api (see src/api.ts) and its address
// is pod env for nginx, never a window._env_ key.
export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  // The OIDC scopes are `group` and `ou`, SINGULAR — exactly as the platform
  // requests them — followed by the project's own catalog handles.
  USER_AUTH_SCOPES: "openid profile email group ou todos:read todos:write",
  USER_AUTH_RESOURCE: "https://mock-idp.test/resources/mock-project",
};
