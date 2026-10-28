# StaffSync — HR management portal (MERN)

A web-based HR portal where the whole company — admin, CEO, HR, managers and employees — works in one place.
Built with **HTML, CSS, JavaScript, React (Vite), Bootstrap 5, Node.js, Express, MongoDB (Mongoose), JWT and async/await.**

## Roles and reporting line

```
Admin            (no manager)
CEO              (no manager)
 ├── HR          reports to the CEO
 ├── Manager     reports to the CEO
 │    └── Employee   reports to a manager (or the CEO)
```

Every employee, manager and HR user **must have a manager**; the admin and the CEO have none. The API enforces this.

| Module | Admin | CEO | HR | Manager | Employee |
| --- | --- | --- | --- | --- | --- |
| Login (JWT) | ✔ | ✔ | ✔ | ✔ | ✔ |
| Dashboard | company | company | company | team | personal |
| Employees | add / edit / delete anyone | view all | add / edit / delete employees & managers | view own team | — |
| Leaves | apply, review anyone | apply, review anyone | apply, review employees & managers | apply, review team | apply, track status |
| Attendance (check in / out) | ✔ + see everyone | ✔ + see everyone | ✔ + see staff | ✔ + see team | ✔ |
| Timesheets (weekly) | submit, approve anyone | submit, approve anyone | submit, approve staff | submit, approve team | fill, save draft, submit |
| Training | create, assign, delete | create, assign, delete | create, assign, delete | create & assign to team | browse, enroll, start, complete |
| Announcements | post / delete | post / delete | post / delete | read | read |

Nobody can approve their own leave or timesheet.

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

Demo logins after seeding (password `Password@123` for all):

| Role | Email |
| --- | --- |
| Admin | admin@staffsync.com |
| CEO | ceo@staffsync.com |
| HR | hr@staffsync.com |
| Manager | manager@staffsync.com (Priya, Engineering) · sanjay@staffsync.com (Sales) |
| Employee | rahul@staffsync.com · anita@ · vikram@ · meera@ |

## How access control works

- `POST /api/auth/login` returns a JWT; the client sends it as `Authorization: Bearer <token>`.
- `protect` middleware verifies the token and loads the user; `authorize(...roles)` gates routes by role.
- `manageableIds(user)` decides whose leaves, timesheets and attendance a user may see or approve:
  admin/CEO → everyone, HR → employees and managers, manager → direct reports, employee → nobody.

More detail (architecture, setup, backend, database, frontend, demo walk-through): [docs/SKILLWALLET_SUBMISSION.md](docs/SKILLWALLET_SUBMISSION.md).

## API

`/api/auth` · `/api/employees` · `/api/leaves` · `/api/attendance` · `/api/timesheets` · `/api/announcements` · `/api/training` · `/api/dashboard`
