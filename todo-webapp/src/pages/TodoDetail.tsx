// wireframes.dsl: screen TodoDetail — "View, edit, complete, or delete a
// to-do item". heading "To-Do Detail" + input "Title" + textarea
// "Description" + checkbox "Completed" active + row(Delete danger ->
// TodoList, right, Save primary -> TodoList). Loads GET /me/todos/{todoId}
// (todos:read); Save/Delete are gated on todos:write via <Can>.
import { useCallback, useEffect, useState, type FormEvent, type JSX } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Form,
  PageContent,
  PageTitle,
  Stack,
  TextField,
  Typography,
} from "@wso2/oxygen-ui";
import { todoApi } from "../api";
import { Can } from "../authz/gates";

export function TodoDetailPage(): JSX.Element {
  const { todoId } = useParams<{ todoId: string }>();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [completed, setCompleted] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!todoId) return;
    setLoading(true);
    setLoadError(null);
    const { data, error } = await todoApi.GET("/me/todos/{todoId}", {
      params: { path: { todoId } },
    });
    setLoading(false);
    if (error || !data) {
      setLoadError("This to-do item could not be found.");
      return;
    }
    setTitle(data.title);
    setDescription(data.description ?? "");
    setCompleted(data.completed);
  }, [todoId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!todoId) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError("Title is required");
      return;
    }
    setTitleError(null);
    setSaveError(null);
    setSaving(true);
    const { error } = await todoApi.PATCH("/me/todos/{todoId}", {
      params: { path: { todoId } },
      body: { title: trimmed, description: description.trim() || undefined, completed },
    });
    setSaving(false);
    if (error) {
      setSaveError("Could not save your changes. Please try again.");
      return;
    }
    navigate("/todos");
  }

  async function handleDelete(): Promise<void> {
    if (!todoId) return;
    const { error } = await todoApi.DELETE("/me/todos/{todoId}", {
      params: { path: { todoId } },
    });
    if (error) {
      setSaveError("Could not delete this to-do item. Please try again.");
      return;
    }
    navigate("/todos");
  }

  if (loading) {
    return (
      <PageContent>
        <PageTitle>
          <PageTitle.Header>To-Do Detail</PageTitle.Header>
        </PageTitle>
        <Typography color="text.secondary">Loading…</Typography>
      </PageContent>
    );
  }

  if (loadError) {
    return (
      <PageContent>
        <PageTitle>
          <PageTitle.Header>To-Do Detail</PageTitle.Header>
        </PageTitle>
        <Typography color="error.main">{loadError}</Typography>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>To-Do Detail</PageTitle.Header>
      </PageTitle>

      <Form.Section>
        <form onSubmit={(e) => void handleSave(e)}>
          <Form.Stack spacing={3}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={Boolean(titleError)}
              helperText={titleError ?? " "}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={completed}
                  onChange={(e) => setCompleted(e.target.checked)}
                />
              }
              label="Completed"
            />
            {saveError ? (
              <Form.Body sx={{ color: "error.main" }}>{saveError}</Form.Body>
            ) : null}
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Can op="DELETE /me/todos/{todoId}">
                <Button variant="outlined" color="error" onClick={() => void handleDelete()}>
                  Delete
                </Button>
              </Can>
              <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ flexGrow: 1 }}>
                <Can op="PATCH /me/todos/{todoId}">
                  <Button type="submit" variant="contained" disabled={saving}>
                    Save
                  </Button>
                </Can>
              </Stack>
            </Box>
          </Form.Stack>
        </form>
      </Form.Section>
    </PageContent>
  );
}
