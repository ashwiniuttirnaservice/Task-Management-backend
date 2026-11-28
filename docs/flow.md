# Request & Business Logic Flows

## 1. Authentication Flow

```
POST /api/auth/login
  └─ Validate email + password present
       └─ TeamMember.findOne({ workingEmail }).select("+password")
            ├─ Not found / no password  →  401 Invalid email or password
            └─ comparePassword (plain-text equality)
                 ├─ Mismatch  →  401
                 └─ Match     →  jwt.sign({ id })
                                  res.cookie("token", jwt, { httpOnly, sameSite:lax })
                                  return user object (password stripped)

Subsequent requests
  └─ protect middleware
       └─ reads req.cookies.token
            ├─ Missing  →  401 Not authenticated
            ├─ Invalid  →  401 Session expired
            └─ Valid    →  TeamMember.findById(payload.id)
                             └─ attaches req.user, calls next()
```

---

## 2. Role Enforcement

```
Admin-only routes use:  router.use(protect); router.post("/", requireRole("admin"), ...)

requireRole checks req.user.role
  ├─ Matches  →  next()
  └─ No match →  403 Access denied

Employee-safe reads bypass requireRole but are still scoped:
  GET /api/tasks
    └─ if req.user.role === "employee"
         └─ force query.assignedMembers = req.user._id
              (employee can never see other members' tasks)
```

---

## 3. Task Lifecycle

```
Create  POST /api/tasks  (admin)
  └─ Zod validate createTaskSchema
       └─ Task.create(data)
            └─ populate assignedMembers
                 └─ fire-and-forget: sendTaskAssignedEmail to each member

Update status  PATCH /api/tasks/:id/status  (any authenticated user)
  └─ Zod validate updateStatusSchema
       └─ Task.findByIdAndUpdate({ status })

Delete  DELETE /api/tasks/:id  (admin)
  └─ Task.findByIdAndDelete
```

---

## 4. Member Create / Update Flow

```
POST /api/team  (admin)
  └─ Zod validate createMemberSchema
       └─ extract { projects, password, ...memberData }
            └─ if password → memberData.password = password (plain text)
                 └─ TeamMember.create(memberData)
                      └─ syncMemberProjects(member._id, projectIds)
                           └─ Project.updateMany $addToSet / $pull
                      └─ if password → sendPasswordEmail (fire-and-forget)
                         else        → sendWelcomeEmail

PUT /api/team/:id  (admin)
  └─ Zod validate updateMemberSchema
       └─ extract { projects, password, ...memberData }
            └─ if password → memberData.password = password
                 └─ TeamMember.findByIdAndUpdate(memberData)
                      └─ syncMemberProjects if projects array sent
                           └─ sendProjectAssignedEmail for newly added projects
                      └─ if password → sendPasswordEmail (fire-and-forget)
```

---

## 5. Project ↔ Member Relationship Sync

```
Ownership: Project.members owns the relationship
           TeamMember has no projects field

syncMemberProjects(memberId, newProjectIds[])
  └─ Query current projects for this member
       └─ diff: toAdd = new - current, toRemove = current - new
            ├─ Project.updateMany({ $in: toAdd },    { $addToSet: { members } })
            └─ Project.updateMany({ $in: toRemove }, { $pull:     { members } })

Called from:
  - PUT /api/team/:id  (member form sends desired project list)
  - PUT /api/projects/:id  (project form sends desired member list,
                             handled directly on Project.members array)
```

---

## 6. Email Triggers

| Event | Trigger | Recipient |
|---|---|---|
| Member created (no password) | `sendWelcomeEmail` | workingEmail |
| Member created (with password) | `sendPasswordEmail` | workingEmail |
| Member password reset | `sendPasswordEmail` | workingEmail |
| Assigned to project | `sendProjectAssignedEmail` | workingEmail |
| Task assigned | `sendTaskAssignedEmail` | each assignedMember.workingEmail |

All email calls are **fire-and-forget** — they run after `sendResponse` so a failed email never breaks the API response.

---

## 7. Validation Pattern

```
Every write controller:
  └─ validate(zodSchema, req.body)  (utils/validate.js)
       ├─ Zod parse fails  →  throws AppError.badRequest(issues)
       └─ Passes           →  returns typed, coerced data

asyncHandler wraps every controller:
  └─ catches any thrown error
       └─ passes to Express error handler
            └─ AppError → structured JSON response with statusCode + message
               Unknown  → 500 Internal Server Error
```

---

## 8. Response Envelope

Every response from `sendResponse` follows this shape:

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

Errors follow the same envelope with `success: false` and `error` populated.
