// Contract-shaped error bodies (components/schemas/Error in openapi.yaml).
// These are the only authorization/validation answers this service gives:
// 401 for no verified caller, 400 for invalid input, 404 for a row that does
// not exist or is not the caller's. Never 403 — see api-management.

function unauthorizedError() returns ErrorUnauthorized => {
    body: {code: 401, message: "not signed in"}
};

function badRequestError(string message) returns ErrorBadRequest => {
    body: {code: 400, message: message}
};

function notFoundError() returns ErrorNotFound => {
    body: {code: 404, message: "not found"}
};

// A relative next/previous page URI for GET /me/todos.
function buildPageLink(int 'limit, int offset, boolean? completed) returns string {
    string link = string `/me/todos?limit=${'limit}&offset=${offset}`;
    if completed is boolean {
        link = link + "&completed=" + completed.toString();
    }
    return link;
}
