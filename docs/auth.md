# Authentication

TaskPilot uses JWT stored in an httpOnly cookie. There is no Bearer token — the cookie is attached automatically by the browser on every request.

## Login Flow

1. Client sends `POST /api/auth/login` with `{ email, password }`.
2. Server looks up `TeamMember` by `workingEmail`, compares plain-text password.
3. On success, signs a JWT (`id` payload, 7-day expiry) and sets it as an httpOnly cookie named `token`.
4. Response includes the user object (password field excluded via `select: false`).

## Cookie Options

| Option | Value |
|---|---|
| `httpOnly` | `true` — not accessible via JS |
| `secure` | `true` in production |
| `sameSite` | `lax` |
| `maxAge` | 7 days |

## Middleware

### `protect`

Attached to every protected route. Verifies the `token` cookie, looks up the matching `TeamMember`, and attaches the document to `req.user`. Throws `401` if the token is missing, expired, or the user no longer exists.

### `requireRole(...roles)`

Must be used **after** `protect`. Checks `req.user.role` against the allowed roles list. Throws `403` if the role does not match.

```js
router.post("/", protect, requireRole("admin"), createTask);
```

## Roles

| Role | Access |
|---|---|
| `admin` | Full read/write across all resources |
| `employee` | Read own tasks only; can update task status |

## Logout

`POST /api/auth/logout` clears the cookie and returns `200`.
