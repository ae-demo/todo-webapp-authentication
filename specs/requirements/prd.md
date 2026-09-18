# todo-webapp-authentication — PRD

## Problem Statement

People juggle daily tasks across sticky notes, chat threads, and scattered apps that were never built for the job, so tasks get forgotten or lost. They need one place, tied to their own identity, where their to-do items are always there and always private to them.

## Solution

A web application where a person signs in securely and manages a personal list of to-do items — creating, viewing, completing, editing, and deleting them — with everything stored durably in a database under their own account.

## Actors

- **User** — a signed-in individual who creates, views, edits, completes, and deletes only their own to-do items. No user can see or act on another user's items.

## User Stories

1. As a user, I want to sign up and sign in securely, so that my to-do items are tied to my own account and stay private to me.
2. As a user, I want to create a to-do item with a title and description, so that I can capture something I need to do.
3. As a user, I want to view my list of to-do items, so that I can see what's pending and what's already done.
4. As a user, I want to edit a to-do item's title or description, so that I can correct or update it later.
5. As a user, I want to mark a to-do item as complete or incomplete, so that I can track my progress.
6. As a user, I want to delete a to-do item, so that I can remove tasks I no longer need.
7. As a user, I want my to-do items to persist across sessions, so that they're still there the next time I sign in, on any device.

## Product Decisions

- **Sign-in**: users sign in via SSO through Thunder, the platform identity provider (organization default for all web apps).
- **Privacy**: to-do items are strictly private — visible and editable only by the user who created them; there is no sharing or collaboration.
- **To-do item shape**: an item carries a title, a description, and a completion status only — no due dates, priorities, or categories in this scope.
- **Actors**: there is no admin or manager actor; every user manages only their own data.
- **Storage**: to-do items are stored in a database, scoped per user, so they persist across sessions and devices.

## Out of Scope

- Sharing or collaborating on to-do items between users.
- Due dates, reminders, priority levels, or categories/tags on to-do items.
- Any admin or manager view across users' data.
- Notifications of any kind (email, push, etc.).

## Open Questions

None at this time.