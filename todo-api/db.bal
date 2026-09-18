import ballerina/sql;
import ballerina/time;
import ballerina/uuid;
import ballerinax/postgresql;
import ballerinax/postgresql.driver as _;

// A to-do item row as stored in Postgres, camelCase to match the aliases the
// queries below select the columns under.
type TodoRow record {|
    string id;
    string ownerId;
    string title;
    string? description;
    boolean completed;
    time:Utc createdAt;
    time:Utc updatedAt;
|};

type TodoPage record {|
    int count;
    TodoItem[] data;
|};

function resolveDbHost() returns string => todoDbHost != "" ? todoDbHost : "localhost";

function resolveDbUser() returns string => todoDbUser != "" ? todoDbUser : "postgres";

function resolveDbName() returns string => todoDbName != "" ? todoDbName : "todo_api";

function resolveDbPort() returns int {
    if todoDbPort == "" {
        return 5432;
    }
    int|error parsed = int:fromString(todoDbPort);
    if parsed is int {
        return parsed;
    }
    return 5432;
}

// The client is constructed lazily, on the first query any request actually
// needs — never as a module-level initializer. Postgres connectors validate
// connectivity synchronously during `new (...)`, so an eager module-level
// client would make every `bal test` run depend on a reachable todo-db.
// gateway_assertion_test.bal exercises only the gateway assertion
// interceptor and never calls getDbClient(), so module init there never
// touches Postgres at all; its one request that does reach a handler
// (GET /me/todos with a valid assertion) tolerates the resulting error since
// it only asserts the interceptor let the request through (not 401).
postgresql:Client? dbClientHolder = ();

function createDbClient() returns postgresql:Client|error {
    postgresql:Client newClient = check new (
        host = resolveDbHost(),
        username = resolveDbUser(),
        password = todoDbPassword,
        database = resolveDbName(),
        port = resolveDbPort()
    );
    sql:ExecutionResult _ = check newClient->execute(`
        CREATE TABLE IF NOT EXISTS todo_items (
            id TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMPTZ NOT NULL,
            updated_at TIMESTAMPTZ NOT NULL
        )
    `);
    sql:ExecutionResult _ = check newClient->execute(`
        CREATE INDEX IF NOT EXISTS todo_items_owner_id_idx ON todo_items (owner_id)
    `);
    return newClient;
}

// The shared client, created and schema-checked on first use and reused
// after. A failure on that first call is a real error to the caller (never a
// stub table), so the first request against an unreachable todo-db 500s
// loudly rather than serving against a table that isn't there.
function getDbClient() returns postgresql:Client|error {
    postgresql:Client? existing = dbClientHolder;
    if existing is postgresql:Client {
        return existing;
    }
    postgresql:Client newClient = check createDbClient();
    dbClientHolder = newClient;
    return newClient;
}

function rowToTodoItem(TodoRow row) returns TodoItem {
    TodoItem item = {
        id: row.id,
        title: row.title,
        completed: row.completed,
        createdAt: time:utcToString(row.createdAt),
        updatedAt: time:utcToString(row.updatedAt)
    };
    string? description = row.description;
    if description is string {
        item.description = description;
    }
    return item;
}

// The caller's to-do items, filtered on ownerId — never on anything the
// client sends. `completed`, when given, narrows further.
function listTodos(string ownerId, int 'limit, int offset, boolean? completed) returns TodoPage|error {
    sql:ParameterizedQuery countQuery = `SELECT COUNT(*) FROM todo_items WHERE owner_id = ${ownerId}`;
    sql:ParameterizedQuery dataQuery = `SELECT id, owner_id AS "ownerId", title, description, completed,
        created_at AS "createdAt", updated_at AS "updatedAt"
        FROM todo_items WHERE owner_id = ${ownerId}`;
    if completed is boolean {
        countQuery = sql:queryConcat(countQuery, ` AND completed = ${completed}`);
        dataQuery = sql:queryConcat(dataQuery, ` AND completed = ${completed}`);
    }
    dataQuery = sql:queryConcat(dataQuery, ` ORDER BY created_at ASC LIMIT ${'limit} OFFSET ${offset}`);

    postgresql:Client dbClient = check getDbClient();
    int total = check dbClient->queryRow(countQuery);
    stream<TodoRow, sql:Error?> rowStream = dbClient->query(dataQuery);
    TodoItem[] items = [];
    check from TodoRow row in rowStream
        do {
            items.push(rowToTodoItem(row));
        };
    check rowStream.close();
    return {count: total, data: items};
}

// A single to-do item, resolved through the caller's ownerId. `()` when it
// does not exist or belongs to someone else — those are indistinguishable on
// purpose, so the handler answers 404 either way.
function getTodo(string ownerId, string todoId) returns TodoItem?|error {
    sql:ParameterizedQuery q = `SELECT id, owner_id AS "ownerId", title, description, completed,
        created_at AS "createdAt", updated_at AS "updatedAt"
        FROM todo_items WHERE id = ${todoId} AND owner_id = ${ownerId}`;
    postgresql:Client dbClient = check getDbClient();
    TodoRow|error row = dbClient->queryRow(q);
    if row is sql:NoRowsError {
        return ();
    }
    if row is error {
        return row;
    }
    return rowToTodoItem(row);
}

// Creates a to-do item owned by ownerId — stamped from the verified caller,
// never read from the request body.
function createTodo(string ownerId, TodoItemInput input) returns TodoItem|error {
    string id = uuid:createRandomUuid();
    time:Utc now = time:utcNow();
    string? description = input?.description;
    postgresql:Client dbClient = check getDbClient();
    sql:ExecutionResult _ = check dbClient->execute(`
        INSERT INTO todo_items (id, owner_id, title, description, completed, created_at, updated_at)
        VALUES (${id}, ${ownerId}, ${input.title}, ${description}, false, ${now}, ${now})
    `);
    TodoRow row = {
        id: id,
        ownerId: ownerId,
        title: input.title,
        description: description,
        completed: false,
        createdAt: now,
        updatedAt: now
    };
    return rowToTodoItem(row);
}

// Updates only the fields the caller supplied, on the caller's own row.
// `()` when the row does not exist or is not theirs.
function updateTodo(string ownerId, string todoId, TodoItemUpdate update) returns TodoItem?|error {
    sql:ParameterizedQuery selectQuery = `SELECT id, owner_id AS "ownerId", title, description, completed,
        created_at AS "createdAt", updated_at AS "updatedAt"
        FROM todo_items WHERE id = ${todoId} AND owner_id = ${ownerId}`;
    postgresql:Client dbClient = check getDbClient();
    TodoRow|error existing = dbClient->queryRow(selectQuery);
    if existing is sql:NoRowsError {
        return ();
    }
    if existing is error {
        return existing;
    }

    string newTitle = existing.title;
    string? updateTitle = update?.title;
    if updateTitle is string {
        newTitle = updateTitle;
    }

    string? newDescription = existing.description;
    string? updateDescription = update?.description;
    if updateDescription is string {
        newDescription = updateDescription;
    }

    boolean newCompleted = existing.completed;
    boolean? updateCompleted = update?.completed;
    if updateCompleted is boolean {
        newCompleted = updateCompleted;
    }

    time:Utc now = time:utcNow();
    sql:ExecutionResult _ = check dbClient->execute(`
        UPDATE todo_items SET title = ${newTitle}, description = ${newDescription},
            completed = ${newCompleted}, updated_at = ${now}
        WHERE id = ${todoId} AND owner_id = ${ownerId}
    `);
    TodoRow updatedRow = {
        id: existing.id,
        ownerId: existing.ownerId,
        title: newTitle,
        description: newDescription,
        completed: newCompleted,
        createdAt: existing.createdAt,
        updatedAt: now
    };
    return rowToTodoItem(updatedRow);
}

// Deletes the caller's own row. false when it does not exist or is not
// theirs — the handler maps that to 404.
function deleteTodo(string ownerId, string todoId) returns boolean|error {
    postgresql:Client dbClient = check getDbClient();
    sql:ExecutionResult result = check dbClient->execute(`
        DELETE FROM todo_items WHERE id = ${todoId} AND owner_id = ${ownerId}
    `);
    int? affected = result.affectedRowCount;
    return affected is int && affected > 0;
}
