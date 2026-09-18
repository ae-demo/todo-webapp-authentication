// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS. Adapted from
// thunder-authentication's assets/screens.example.ts pattern for the
// wireframes.dsl screens of this app: TodoList, TodoForm, TodoDetail.
//
// Rail order = wireframe walk order: TodoList -> TodoForm -> TodoDetail.
// TodoList loads the list operation (GET /me/todos), TodoDetail loads the
// single-item operation (GET /me/todos/{todoId}) — both gated on todos:read,
// which the "User" role in security.json grants. TodoForm has no load call
// (it is a pure create form); it is reachable by any signed-in caller and its
// "Create" submit is itself gated on POST /me/todos (todos:write) via <Can>
// in the page component, per the pattern's own guidance for `loads: null`
// screens.

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  /** A stable id the App maps to a page component. */
  readonly key: string;
  /** The wireframe's screen name, for the rail and the Forbidden copy. */
  readonly label: string;
  readonly path: string;
  /**
   * The operation whose answer this screen renders on load; null = a signed-in
   * screen with no load call (a form that only posts, say).
   */
  readonly loads: OperationKey | null;
  /**
   * In a flow with no `role` line: reachable before sign-in, routed ABOVE the
   * sign-in guard. This app's one flow, "Manage my to-dos", has role "User",
   * so none of its screens are public.
   */
  readonly public?: boolean;
}

/** YOUR screens, in RAIL ORDER — the wireframes' walk order. */
export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "todo-list", label: "My To-Dos", path: "/todos", loads: "GET /me/todos" },
  { key: "todo-form", label: "New To-Do", path: "/todos/new", loads: null },
  {
    key: "todo-detail",
    label: "To-Do Detail",
    path: "/todos/:todoId",
    loads: "GET /me/todos/{todoId}",
  },
];

// FAIL LOUDLY, at module load — a committed table that outlived its contract
// cannot become a screen nobody can reach and nobody notices.
for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

/**
 * The screens a caller can actually open, in rail order. The first one is the
 * landing screen; an EMPTY list is the NoAccess case.
 */
export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}
