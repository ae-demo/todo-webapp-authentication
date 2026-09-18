import ballerina/os;

// Platform-injected `todo-db` (postgres-cnpg) wiring — see design.json's
// dependencies[].wiring.envBindings, copied verbatim. Each defaults to "" when
// unset so the service starts with no required environment variables; the
// resulting connection settings then fall back to sensible local defaults in
// db.bal.
configurable string todoDbHost = os:getEnv("TODO_DB_HOST");
configurable string todoDbPort = os:getEnv("TODO_DB_PORT");
configurable string todoDbUser = os:getEnv("TODO_DB_USER");
configurable string todoDbPassword = os:getEnv("TODO_DB_PASSWORD");
configurable string todoDbName = os:getEnv("TODO_DB_DBNAME");
