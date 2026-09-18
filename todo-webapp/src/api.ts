// The todo-api client: openapi-fetch, typed against src/generated/todo-api.ts,
// same-origin baseUrl. nginx strips /api before proxying to the sibling
// (react-webapp). Authorization is entirely src/authz/client.ts's: this module
// attaches the bearer and applies the 401 rule through its two exports —
// authorizationHeader() and classifyResponse() — and adds nothing of its own.
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/todo-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const header = await authorizationHeader();
    if (header) request.headers.set("Authorization", header);
    return request;
  },
  async onResponse({ response }) {
    if ((await classifyResponse(response.status)) === "forbidden") {
      throw new ForbiddenError(response.status);
    }
    return response;
  },
};

export const todoApi = createClient<paths>({ baseUrl: "/api" });
todoApi.use(authMiddleware);
