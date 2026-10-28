# StaffSync — HR management portal (MERN)

A small first version: HR, managers and employees each get their own view of the same system.

| Module | HR | Manager | Employee |
| --- | --- | --- | --- |
| Login (JWT) | yes | yes | yes |
| Dashboard | company counts | team counts | personal counts |
| Employees | add / edit / delete everyone | view own team | — |
| Leaves | approve / reject anyone's | approve / reject team's, apply own | apply, track status |
| Attendance | see everyone per day | see team per day | check in / check out, this month's history |
| Announcements | post / delete | read | read |
| Training | create, assign, delete | create & assign to team | browse, enroll, start, complete |

**Stack:** HTML, CSS, JavaScript, React (Vite), Bootstrap 5, Node.js, Express, MongoDB (Mongoose), JWT, async/await throughout.

## Run it

You need Node.js 18+ and MongoDB (local, or a free Atlas cluster).

```bash
# 1. API
cd server
npm install
copy .env.example .env        # then edit MONGO_URI / JWT_SECRET
npm run seed                  # demo data
npm run dev                   # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev                   # http://localhost:5173
```

Demo logins after seeding (password `Password@123`): `hr@staffsync.com`, `manager@staffsync.com`, `rahul@staffsync.com`.

## How access control works

- `POST /api/auth/login` returns a JWT; the client sends it as `Authorization: Bearer <token>`.
- `protect` middleware verifies the token and loads the user; `authorize('hr', ...)` gates routes by role.
- A manager's "team" is every active user whose `manager` field points at them. Leave review, attendance view
  and training assignment are limited to that team; nobody can review their own leave.

## API

`/api/auth` · `/api/employees` · `/api/leaves` · `/api/attendance` · `/api/announcements` · `/api/training` · `/api/dashboard`
