# Data Models

---

## TeamMember

Represents both employees and admins. Used as the auth identity.

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required, unique |
| `workingEmail` | String | Unique (sparse), used for login |
| `personalEmail` | String | Optional |
| `contactNumber` | String | Optional |
| `alternateNumber` | String | Optional |
| `role` | `"employee"` \| `"admin"` | Default: `"employee"` |
| `position` | `"intern"` \| `"frontend"` \| `"backend"` \| `"fullStack"` | Default: `"intern"` |
| `isActive` | Boolean | Default: `true` |
| `password` | String | Plain text; `select: false` — excluded from queries by default |
| `createdAt` / `updatedAt` | Date | Auto-managed by Mongoose |

> Project membership is owned by the `Project` model, not stored here. Use `GET /team/me` or `GET /team/list` to get a member's projects.

---

## Task

A unit of work assigned to one or more team members.

| Field | Type | Notes |
|---|---|---|
| `assignedMembers` | `[ObjectId → TeamMember]` | Populated on fetch with `name`, `position`, `_id` |
| `title` | String | Required |
| `description` | String | Required |
| `projectName` | String | Free-text reference to a project name |
| `priority` | `"High"` \| `"Medium"` \| `"Low"` | Default: `"Medium"` |
| `status` | `"Pending"` \| `"In Progress"` \| `"Completed"` | Default: `"Pending"` |
| `startDate` | String | `YYYY-MM-DD` |
| `deadline` | String | `YYYY-MM-DD` |
| `startTime` | String | `HH:MM`, optional |
| `endTime` | String | `HH:MM`, optional |
| `createdAt` / `updatedAt` | Date | Auto-managed |

---

## Project

A project container with members and optional resources.

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required, unique |
| `description` | String | Optional |
| `status` | `"planning"` \| `"active"` \| `"onHold"` \| `"completed"` | Default: `"planning"` |
| `startDate` | String | `YYYY-MM-DD`, optional |
| `endDate` | String | `YYYY-MM-DD`, optional |
| `members` | `[ObjectId → TeamMember]` | Source of truth for project membership |
| `resources` | `[Resource]` | Embedded array (see below) |
| `createdAt` / `updatedAt` | Date | Auto-managed |

### Resource (embedded)

| Field | Type | Notes |
|---|---|---|
| `title` | String | |
| `type` | `"repository"` \| `"document"` \| `"deployment"` \| `"design"` \| `"reference"` \| `"other"` | Default: `"other"` |
| `category` | String | Free-text label |
| `url` | String | Valid URL or empty string |
| `description` | String | |

---

## Relationships

```
Project.members  ──► TeamMember._id   (project owns membership)
Task.assignedMembers ──► TeamMember._id
```

When a member is deleted, they are `$pull`-ed from all `Project.members` arrays automatically.
