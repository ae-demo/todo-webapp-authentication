screen TodoList "The user's pending and completed to-do items"
  navbar "Todo App"
  row
    heading "My To-Dos"
    right
    button "New To-Do" primary -> TodoForm
  table "Title | Status"
    row "Buy groceries | Pending" -> TodoDetail
    row "Clean garage | Done" -> TodoDetail
    row "Write report | Pending" -> TodoDetail

screen TodoForm "Create a new to-do item"
  navbar "Todo App"
  heading "New To-Do"
  input "Title"
  textarea "Description"
  row
    button "Cancel" -> TodoList
    right
    button "Create" primary -> TodoList

screen TodoDetail "View, edit, complete, or delete a to-do item"
  navbar "Todo App"
  heading "To-Do Detail"
  input "Title"
  textarea "Description"
  checkbox "Completed" active
  row
    button "Delete" danger -> TodoList
    right
    button "Save" primary -> TodoList

flow "Manage my to-dos"
  role "User"
  description "A signed-in user views, creates, edits, completes, and deletes their own to-do items"
  TodoList
  TodoForm
  TodoDetail
