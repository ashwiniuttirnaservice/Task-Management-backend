# API Endpoints

Base URL: `http://localhost:5002/api`

All routes require authentication (JWT cookie) unless noted. Admin-only routes additionally require `role: "admin"`.

---

## Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Login with `workingEmail` + `password`. Sets JWT cookie. |
| `POST` | `/auth/logout` | Public | Clears the JWT cookie. |
| `GET` | `/auth/me` | Any | Returns the current authenticated user. |

**Login body**
```json
{ "email": "admin@uttirna.in", "password": "admin123" }
```

---

## Tasks

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/tasks` | Any | List tasks. Employees see only their own. Supports `?member=&project=&priority=&status=&search=`. |
| `GET` | `/tasks/:id` | Any | Get a single task by ID. |
| `GET` | `/tasks/stats/summary` | Any | Aggregated counts (total, completed, pending, in-progress, rate). |
| `GET` | `/tasks/report/:range` | Any | Report for `daily` or `weekly` range. |
| `POST` | `/tasks` | Admin | Create a task. |
| `PUT` | `/tasks/:id` | Admin | Update a task. |
| `PATCH` | `/tasks/:id/status` | Any | Update status only (`Pending` / `In Progress` / `Completed`). |
| `DELETE` | `/tasks/:id` | Admin | Delete a task. |
| `DELETE` | `/tasks` | Admin | Delete all tasks. |

---

## Team

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/team` | Any | Returns `{ name: [projectNames] }` map — used by task dropdowns. |
| `GET` | `/team/list` | Any | Full member array with projects attached. |
| `GET` | `/team/me` | Any | Logged-in user's own profile + assigned projects. |
| `POST` | `/team` | Admin | Create a team member. Optionally set password and assign projects. |
| `PUT` | `/team/:id` | Admin | Update a team member. Pass `password` to reset it; fires email. |
| `DELETE` | `/team/:id` | Admin | Delete a member and remove them from all projects. |

---

## Projects

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/projects` | Any | List all projects with members populated. |
| `GET` | `/projects/:id` | Any | Get a single project by ID. |
| `POST` | `/projects` | Admin | Create a project. |
| `PUT` | `/projects/:id` | Admin | Update a project. |
| `DELETE` | `/projects/:id` | Admin | Delete a project. |

---

## Response Envelope

All responses follow a consistent shape:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tasks fetched",
  "data": { "tasks": [] },
  "error": null,
  "metadata": { "count": 0 }
}
```
