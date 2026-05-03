# Intent-OS

Intent-OS is a goal-to-task productivity application. The project currently uses Django REST Framework for the backend, React with Tailwind CSS for the frontend, and supports PostgreSQL through environment-based Django settings.

## Developer Progress

### Module 1: Intent Input System

- Added intent creation through the REST API.
- Added frontend form support for capturing an intent title and optional description.
- Added intent listing and selection in the React UI.

### Module 2: Task Management System

- Added task model linked to intents.
- Added task CRUD API endpoints.
- Added filtering tasks by `intent_id`.
- Added frontend task panel for viewing, creating, completing, and deleting tasks for a selected intent.

### Module 3: Task Generation Engine

- Added a separate backend task generation service layer.
- Added rule-based keyword detection for learning, fitness, and exam preparation intents.
- Added automatic task generation when a new intent is created.
- Added `POST /api/intents/{id}/generate-tasks/` for manual generation.
- Added duplicate prevention so existing intent tasks are not regenerated unless forced.
- Added frontend `Generate Tasks` action for each intent.
- Added immediate task refresh and user messages for generated or already-existing tasks.
- Added backend tests covering automatic generation, endpoint generation, and duplicate prevention.

## Current API Surface

- `GET /api/intents/`
- `POST /api/intents/`
- `GET /api/intents/{id}/`
- `PUT/PATCH /api/intents/{id}/`
- `DELETE /api/intents/{id}/`
- `POST /api/intents/{id}/generate-tasks/`
- `GET /api/tasks/`
- `GET /api/tasks/?intent_id={id}`
- `POST /api/tasks/`
- `GET /api/tasks/{id}/`
- `PUT/PATCH /api/tasks/{id}/`
- `DELETE /api/tasks/{id}/`

## Not Added Yet

- AI-based task generation.
- Scheduling or calendar logic.
- Authentication and user-specific data separation.
- Production deployment configuration.
