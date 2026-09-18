// wireframes.dsl: screen TodoForm — "Create a new to-do item". heading "New
// To-Do" + input "Title" + textarea "Description" + row(Cancel -> TodoList,
// right, Create primary -> TodoList). No load call (loads: null in
// src/authz/screens.ts); the Create submit is gated on POST /me/todos.
import { useState, type FormEvent, type JSX } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, PageContent, PageTitle, Stack, TextField } from "@wso2/oxygen-ui";
import { todoApi } from "../api";
import { Can } from "../authz/gates";

export function TodoFormPage(): JSX.Element {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError("Title is required");
      return;
    }
    setTitleError(null);
    setSubmitError(null);
    setSubmitting(true);
    const { error } = await todoApi.POST("/me/todos", {
      body: { title: trimmed, description: description.trim() || undefined },
    });
    setSubmitting(false);
    if (error) {
      setSubmitError("Could not create the to-do item. Please try again.");
      return;
    }
    navigate("/todos");
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.Header>New To-Do</PageTitle.Header>
      </PageTitle>

      <Form.Section>
        <form onSubmit={(e) => void handleSubmit(e)}>
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
            {submitError ? (
              <Form.Body sx={{ color: "error.main" }}>{submitError}</Form.Body>
            ) : null}
            <Stack direction="row" justifyContent="flex-end" spacing={2}>
              <Button variant="outlined" onClick={() => navigate("/todos")}>
                Cancel
              </Button>
              <Can op="POST /me/todos">
                <Button type="submit" variant="contained" disabled={submitting}>
                  Create
                </Button>
              </Can>
            </Stack>
          </Form.Stack>
        </form>
      </Form.Section>
    </PageContent>
  );
}
