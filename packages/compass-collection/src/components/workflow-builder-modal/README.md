# AI Workflow Builder

A multi-step modal wizard integrated into MongoDB Compass that lets users build AI-powered document processing workflows directly from a collection view.

## Overview

The workflow builder guides users through a 6-step process to configure an AI pipeline that reads documents from a MongoDB collection, sends selected fields to an LLM, and writes the result back.

### Steps

1. **Write Prompt** — Author a prompt using `@fieldname` syntax to reference document fields. A sample document is shown alongside for reference.
2. **Configure Output** — Choose a target field name and output mode (`new-field`, `overwrite`, or `append`).
3. **Define Filters** — Optionally add MongoDB filter conditions (equals, regex, exists, array size, comparisons, etc.) to scope which documents are processed.
4. **Test Prompt** — Run the prompt against a sample document to verify results before committing.
5. **Configure Model** — Select a provider (Gemini, OpenAI, Anthropic, Azure OpenAI), model variant, temperature, and execution limit.
6. **Preview & Deploy** — Review the generated JSON configuration and save/deploy the workflow.

## Files Changed

### `packages/compass-crud/`

| File                             | Purpose                                                                |
| -------------------------------- | ---------------------------------------------------------------------- |
| `components/workflow-button.tsx` | New "Workflow" toolbar button with tooltip and write-permission gating |
| `components/crud-toolbar.tsx`    | Integrated the workflow button into the existing CRUD toolbar          |

### `packages/compass-collection/`

| File                            | Purpose                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `components/collection-tab.tsx` | Mounts `WorkflowBuilderModal` and wires the open action                                                                  |
| `modules/collection-tab.ts`     | Redux state slice, actions, and reducer for all workflow builder state (prompt, output, model, filters, saved workflows) |

### `packages/compass-workspaces/`

| File                                                | Purpose                                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/types.ts`                                      | Added `ManageWorkflowsWorkspace` schema and type to the workspace type system                  |
| `src/stores/workspaces.ts`                          | Added `'Manage Workflows'` to `OpenWorkspaceOptions` union                                     |
| `src/provider.tsx`                                  | Added `openManageWorkflowsWorkspace` method to `WorkspacesService` and `useOpenWorkspace` hook |
| `src/components/workspaces-provider.tsx`            | Added `WorkspacePlugin<'Manage Workflows'>` to `AnyWorkspacePlugin` union                      |
| `src/components/workspace-tab-context-provider.tsx` | Added `'Manage Workflows'` case to `getInitialPropsForWorkspace`                               |

### `packages/compass-data-modeling/`

| File                                            | Purpose                                                                                                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/components/manage-workflows-screen.tsx`    | Full-page workflow list UI with search, delete, copy config, and expand/collapse details. Renders as workspace tab content (moved from `compass-collection`) |
| `src/components/manage-workflows-tab-title.tsx` | Tab title component for the Manage Workflows workspace tab                                                                                                   |
| `src/index.ts`                                  | Exports `ManageWorkflowsWorkspaceTab` workspace plugin alongside `DataModelingWorkspaceTab`                                                                  |

### `packages/compass-sidebar/`

| File                                                            | Purpose                                                                                                                                                         |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/multiple-connections/navigation/navigation.tsx` | "Manage Workflows" is a top-level navigation item (peer of "Data Modeling", not nested under it); opens as a workspace tab via `openManageWorkflowsWorkspace()` |

### `packages/compass/`

| File                               | Purpose                                                             |
| ---------------------------------- | ------------------------------------------------------------------- |
| `src/app/components/workspace.tsx` | Registers `ManageWorkflowsWorkspaceTab` in the `WorkspacesProvider` |

### `packages/compass-collection/.../workflow-builder-modal/`

| File                                   | Purpose                                                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `types.ts`                             | TypeScript types/enums, helper utilities (`extractFieldsFromPrompt`, `buildMongoFilter`, `maskMongoUri`, ID generators)                                      |
| `constants.ts`                         | Step labels, ordering, button text, output mode options, temperature marks, mittai server URL                                                                |
| `index.ts`                             | Public exports                                                                                                                                               |
| `workflow-builder-modal.tsx`           | Main modal shell with step indicator, navigation (Previous/Next/Cancel), and per-step content rendering                                                      |
| `workflow-builder-modal-container.tsx` | Redux `connect()` wrapper mapping state and dispatch to modal props                                                                                          |
| `prompt-configuration-screen.tsx`      | Prompt editor with `@field` autocomplete and sample document preview                                                                                         |
| `output-configuration-screen.tsx`      | Output field name input and mode selector                                                                                                                    |
| `model-configuration-screen.tsx`       | Provider/model dropdowns, temperature slider, execution limit input                                                                                          |
| `preview-export-screen.tsx`            | Read-only JSON config preview, copy-to-clipboard, save/name workflow. "Manage Workflows" button opens the workspace tab via `openManageWorkflowsWorkspace()` |

### `mittai/server/` (backend)

| File            | Purpose                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth.go`       | User storage (`UserStorage`, persisted to `users.json`), bcrypt password hashing, JWT generation, `handleSignup` and `handleLogin` HTTP handlers |
| `auth_types.go` | Auth-specific request/response types: `SignupRequest`, `LoginRequest`, `PublicUser`, `AuthResponse`                                              |
| `main.go`       | Registers `POST /auth/signup` and `POST /auth/login` routes alongside the existing workflow and test routes                                      |
| `go.mod`        | Added `github.com/golang-jwt/jwt/v5` as a direct dependency                                                                                      |

## Architecture

- **State management**: All workflow state lives in the `workflowBuilder` key of the collection-tab Redux store. Actions are plain Redux actions; async work uses thunks.
- **Backend**: The generated config targets a local **mittai** server (`http://localhost:8787`) for workflow execution.
- **Prompt syntax**: `@fieldname` in the prompt is converted to `{{fieldname}}` in the exported config. Fields are auto-extracted for the `input_fields` array.
- **Filters**: UI filter conditions are converted to a standard MongoDB query filter via `buildMongoFilter()`.
- **Persistence**: Saved workflows are stored under `compass-workflow-builder-saved` in local storage.
- **Navigation**: "Manage Workflows" is a full workspace tab (not a modal) that appears as a **top-level sidebar item**, at the same level as "Data Modeling" — not nested beneath it. It is independently controlled by the `enableWorkflowManagement` preference. It opens in a new tab just like opening a collection — covering the right half of the page. The workspace type `'Manage Workflows'` is registered in `compass-workspaces` and the tab plugin is exported from `compass-data-modeling`. Clicking the sidebar item or the "Manage Workflows" button in the preview screen both call `openManageWorkflowsWorkspace()` which dispatches `openWorkspace({ type: 'Manage Workflows' }, { newTab: true })`.

## Authentication (mittai server)

The mittai server now supports user accounts via two endpoints:

### `POST /auth/signup`

Create a new account.

**Request body:**

```json
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "supersecret"
}
```

**Response `201 Created`:**

```json
{
  "token": "<jwt>",
  "user": {
    "id": "user-1234567890",
    "username": "alice",
    "email": "alice@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### `POST /auth/login`

Authenticate with an existing account.

**Request body:**

```json
{
  "email": "alice@example.com",
  "password": "supersecret"
}
```

**Response `200 OK`:**

```json
{
  "token": "<jwt>",
  "user": {
    "id": "user-1234567890",
    "username": "alice",
    "email": "alice@example.com",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### JWT details

- Algorithm: **HS256**
- Expiry: **24 hours**
- Claims: `sub` (user ID), `username`, `exp`
- Secret: read from the `JWT_SECRET` environment variable; falls back to `"mittai-secret-key"` if not set. **Set `JWT_SECRET` to a strong random value in production.**

### User persistence

User records (excluding plaintext passwords — only bcrypt hashes are stored) are persisted to `users.json` on disk alongside `workflows.json`, using the same mutex-guarded storage pattern as `WorkflowStorage`.
