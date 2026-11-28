# TaskPilot API

Express + MongoDB REST API for the TaskPilot internal team management system.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express |
| Database | MongoDB via Mongoose |
| Auth | JWT (httpOnly cookie) |
| Validation | Zod |
| Email | Nodemailer (Gmail) |

## Folder Structure

```
api/
├── controllers/       # Route handlers (auth, task, team, project)
├── middleware/        # protect, requireRole
├── models/            # Mongoose schemas (TeamMember, Task, Project)
├── routes/            # Express routers
├── scripts/           # One-off scripts (seedAdmin, resetPasswords)
├── services/          # emailService
├── utils/             # AppError, asyncHandler, sendResponse, statusCodes, validate
├── validators/        # Zod schemas for all create/update operations
└── server.js
```

## Getting Started

```bash
npm install
node server.js          # or: nodemon server.js
```

The server listens on the port defined by `PORT` (default `5002`).

## Environment Variables

Create a `.env` file in `api/`:

```env
PORT=5002
MONGODB_URI=mongodb://localhost:27017/taskpilot
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000,http://localhost:3001
NODE_ENV=development

# Email (optional — skipped if not set)
GMAIL_EMAIL=you@gmail.com
GMAIL_APP_PASSWORD=your_app_password
APP_URL=http://localhost:3000
```

## Packages

| Package | Purpose |
|---|---|
| `express` | HTTP server and routing |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT signing and verification |
| `cookie-parser` | Parse httpOnly cookies |
| `cors` | Cross-origin request handling |
| `dotenv` | Load `.env` variables |
| `zod` | Request body/query validation |
| `nodemailer` | Transactional email via Gmail |
| `bcryptjs` | Installed; no longer used for hashing |

## Scripts

| Script | Purpose |
|---|---|
| `node scripts/seedAdmin.js` | Create the initial admin account |
| `node scripts/resetPasswords.js` | Migrate bcrypt hashes to plain-text defaults |
