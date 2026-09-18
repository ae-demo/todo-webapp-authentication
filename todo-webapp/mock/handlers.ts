// The mock SERVICE: what todo-api itself owes, once the mock gateway
// (mock/authz/gateway.ts) has already let a call through. No scope check here
// — whether an operation may be called at all is the gateway's answer, read
// from openapi.yaml, exactly as it is the real gateway's answer in a cell.
//
// State lives in module scope (the PAGE's JS context, per mock-mode.md): a
// create shows up in the next list, a delete removes it, an edit persists —
// but only across in-app navigation. A full page load (reload, a typed URL,
// a link leaving the SPA) re-runs this module and restores the seed below.
//
// Seed rows mirror wireframes.dsl's TodoList table exactly (seed.mjs output):
// "Buy groceries" (Pending), "Clean garage" (Done), "Write report" (Pending)
// — plus one row owned by somebody else, so /me/todos and "every row" would
// visibly differ if this app ever grew an every-row operation.
import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/todo-api";

type TodoItem = components["schemas"]["TodoItem"];

export const mockCaller = {
  userId: "mock-owner",
};

const NOW = new Date().toISOString();

let nextId = 4;
let todos: (TodoItem & { owner: string })[] = [
  {
    id: "1",
    title: "Buy groceries",
    description: "Milk, eggs, bread",
    completed: false,
    createdAt: NOW,
    updatedAt: NOW,
    owner: mockCaller.userId,
  },
  {
    id: "2",
    title: "Clean garage",
    description: "",
    completed: true,
    createdAt: NOW,
    updatedAt: NOW,
    owner: mockCaller.userId,
  },
  {
    id: "3",
    title: "Write report",
    description: "Quarterly summary for the team",
    completed: false,
    createdAt: NOW,
    updatedAt: NOW,
    owner: mockCaller.userId,
  },
  {
    id: "999",
    title: "Someone else's item",
    completed: false,
    createdAt: NOW,
    updatedAt: NOW,
    owner: "not-the-caller",
  },
];

function toApi(item: (TodoItem & { owner: string })): TodoItem {
  const { owner: _owner, ...rest } = item;
  return rest;
}

function errorBody(code: number, message: string) {
  return { code, message };
}

export const handlers = [
  // The caller's to-do items. No todos:read check: a caller who does not hold
  // it was refused by mock/authz/gateway.ts and never reached here.
  http.get("/api/me/todos", ({ request }) => {
    const url = new URL(request.url);
    const completedParam = url.searchParams.get("completed");
    let mine = todos.filter((t) => t.owner === mockCaller.userId);
    if (completedParam !== null) {
      const wanted = completedParam === "true";
      mine = mine.filter((t) => t.completed === wanted);
    }
    return HttpResponse.json({
      count: mine.length,
      next: null,
      previous: null,
      data: mine.map(toApi),
    });
  }),

  http.post("/api/me/todos", async ({ request }) => {
    const input = (await request.json()) as { title?: string; description?: string };
    if (!input?.title || input.title.trim().length === 0) {
      return HttpResponse.json(errorBody(400, "title is required"), { status: 400 });
    }
    const now = new Date().toISOString();
    const created: TodoItem & { owner: string } = {
      id: String(nextId++),
      title: input.title,
      description: input.description,
      completed: false,
      createdAt: now,
      updatedAt: now,
      owner: mockCaller.userId,
    };
    todos = [...todos, created];
    return HttpResponse.json(toApi(created), { status: 201 });
  }),

  // A single item of the caller's — a row that exists but is not theirs is a
  // 404, never a 403 (api-management's rule for everything under /me/).
  http.get("/api/me/todos/:todoId", ({ params }) => {
    const item = todos.find((t) => t.id === params.todoId && t.owner === mockCaller.userId);
    if (!item) return HttpResponse.json(errorBody(404, "not found"), { status: 404 });
    return HttpResponse.json(toApi(item));
  }),

  http.patch("/api/me/todos/:todoId", async ({ request, params }) => {
    const index = todos.findIndex((t) => t.id === params.todoId && t.owner === mockCaller.userId);
    if (index === -1) return HttpResponse.json(errorBody(404, "not found"), { status: 404 });
    const input = (await request.json()) as {
      title?: string;
      description?: string;
      completed?: boolean;
    };
    if (input.title !== undefined && input.title.trim().length === 0) {
      return HttpResponse.json(errorBody(400, "title cannot be empty"), { status: 400 });
    }
    const updated: TodoItem & { owner: string } = {
      ...todos[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    todos = [...todos.slice(0, index), updated, ...todos.slice(index + 1)];
    return HttpResponse.json(toApi(updated));
  }),

  http.delete("/api/me/todos/:todoId", ({ params }) => {
    const before = todos.length;
    todos = todos.filter((t) => !(t.id === params.todoId && t.owner === mockCaller.userId));
    if (todos.length === before) {
      return HttpResponse.json(errorBody(404, "not found"), { status: 404 });
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
