// wireframes.dsl: screen TodoList — "The user's pending and completed to-do
// items". navbar (AppShell) + row(heading, right, "New To-Do" primary ->
// TodoForm) + table "Title | Status" with each row -> TodoDetail.
import { useCallback, useEffect, useState, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Chip, ListingTable, PageContent, PageTitle } from "@wso2/oxygen-ui";
import { Plus } from "@wso2/oxygen-ui-icons-react";
import { todoApi } from "../api";
import type { components } from "../generated/todo-api";
import { Can } from "../authz/gates";

type TodoItem = components["schemas"]["TodoItem"];

export function TodoListPage(): JSX.Element {
  const navigate = useNavigate();
  const [todos, setTodos] = useState<TodoItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: apiError } = await todoApi.GET("/me/todos");
    if (apiError) {
      setError("Could not load your to-do items.");
      return;
    }
    setTodos(data?.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>My To-Dos</PageTitle.Header>
        <PageTitle.Actions>
          <Can op="POST /me/todos">
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => navigate("/todos/new")}
            >
              New To-Do
            </Button>
          </Can>
        </PageTitle.Actions>
      </PageTitle>

      {error ? (
        <ListingTable.Container>
          <ListingTable.EmptyState title="Something went wrong" description={error} />
        </ListingTable.Container>
      ) : (
        <ListingTable.Container>
          <ListingTable>
            <ListingTable.Head>
              <ListingTable.Row>
                <ListingTable.Cell>Title</ListingTable.Cell>
                <ListingTable.Cell>Status</ListingTable.Cell>
              </ListingTable.Row>
            </ListingTable.Head>
            <ListingTable.Body>
              {todos === null ? null : todos.length === 0 ? (
                <ListingTable.Row>
                  <ListingTable.Cell colSpan={2}>
                    <ListingTable.EmptyState
                      title="No to-do items yet"
                      description="Create your first to-do to get started."
                    />
                  </ListingTable.Cell>
                </ListingTable.Row>
              ) : (
                todos.map((todo) => (
                  <ListingTable.Row
                    key={todo.id}
                    clickable
                    onClick={() => navigate(`/todos/${todo.id}`)}
                  >
                    <ListingTable.Cell>{todo.title}</ListingTable.Cell>
                    <ListingTable.Cell>
                      <Chip
                        label={todo.completed ? "Done" : "Pending"}
                        color={todo.completed ? "success" : "warning"}
                        size="small"
                      />
                    </ListingTable.Cell>
                  </ListingTable.Row>
                ))
              )}
            </ListingTable.Body>
          </ListingTable>
        </ListingTable.Container>
      )}
    </PageContent>
  );
}
