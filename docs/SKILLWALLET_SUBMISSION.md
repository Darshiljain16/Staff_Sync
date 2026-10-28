# StaffSync — Skill Wallet submission notes

Paste each section below into the matching section of the **Project Progress** panel on Skill Wallet.

- **GitHub link:** https://github.com/Darshiljain16/Staff_Sync
- **Demo link:** add the link to your screen recording or deployed app (see the last section for how to record one).

---

## 1. Project Architecture

StaffSync is a three-tier MERN web application.

```
 React (Vite) + Bootstrap 5        Express REST API (Node.js)         MongoDB
 ┌──────────────────────┐  HTTPS   ┌───────────────────────────┐     ┌──────────────┐
 │ Pages, routing,      │ ───────► │ routes → middleware →     │ ──► │ Mongoose     │
 │ AuthContext, axios   │ ◄─────── │ business rules (JSON)     │ ◄── │ collections  │
 └──────────────────────┘   JWT    └───────────────────────────┘     └──────────────┘
```

- **Client** (`client/`): single-page React app. It keeps the JWT in `localStorage` and sends it on every request.
- **API** (`server/`): Express app, one router per module, all handlers use `async/await`.
- **Database**: MongoDB accessed through Mongoose models.
- **Authentication:** login returns a signed JWT. `protect` middleware verifies it and loads the user, and `authorize(...roles)` restricts routes by role.

**Organisation model.** Five roles and a mandatory reporting line:

```
Admin   (no manager)
CEO     (no manager)
 ├── HR        reports to the CEO
 ├── Manager   reports to the CEO
 │    └── Employee   reports to a manager (or the CEO)
```

A single helper, `manageableIds(user)`, decides whose leaves, timesheets and attendance a user may see or approve:
admin/CEO → everyone, HR → employees and managers, manager → direct reports, employee → nobody.
Nobody can approve their own request.

## 2. Project Setup and Configuration

**Prerequisites:** Node.js 18+, MongoDB (local or Atlas), Git.

```bash
git clone https://github.com/Darshiljain16/Staff_Sync.git
cd Staff_Sync

# API
cd server
npm install
copy .env.example .env      # Windows (use cp on macOS/Linux)
npm run seed                # creates demo users and data
npm run dev                 # http://localhost:5000

# Web app (second terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

**`server/.env`**

| Variable | Purpose |
| --- | --- |
| `PORT` | API port (5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | secret used to sign tokens (use a long random value) |
| `JWT_EXPIRES_IN` | token lifetime (7d) |
| `CLIENT_URL` | allowed CORS origin (http://localhost:5173) |

The Vite dev server proxies `/api` to `http://localhost:5000`, so the client needs no extra configuration.
`.env` and `node_modules` are git-ignored; only `.env.example` is committed.

**Demo accounts** (password `Password@123`): admin@, ceo@, hr@, manager@, rahul@ — all `@staffsync.com`.

## 3. Backend Development

Stack: Node.js, Express, Mongoose, bcryptjs, jsonwebtoken, cors, morgan.

| Module | Endpoints | Rules |
| --- | --- | --- |
| Auth | `POST /auth/login`, `GET/PUT /auth/me` | bcrypt-hashed passwords, JWT, change password needs the current one |
| Employees | `GET/POST/PUT/DELETE /employees` | HR/admin add people; every employee, manager and HR user must have a valid manager; HR cannot create CEO/HR/admin; cannot remove a manager who still has a team |
| Leaves | `GET/POST/DELETE /leaves`, `PATCH /leaves/:id/status` | no overlapping requests, withdraw while pending, approve/reject by the right manager only, never your own |
| Attendance | `POST /attendance/check-in`, `/check-out`, `GET /attendance/me`, `GET /attendance` | one record per day, "late" after 9:30, hours calculated on check-out |
| Timesheets | `GET/PUT /timesheets/week/:weekStart`, `POST …/submit`, `GET /timesheets/review`, `PATCH /timesheets/:id/status` | weekly, entries must fall inside the week, max 24 h/day, locked once submitted or approved, editable again if rejected |
| Training | `GET/POST/DELETE /training`, `POST …/enroll`, `PATCH …/progress` | managers assign only to their own team |
| Announcements | `GET/POST/DELETE /announcements` | posted by admin, CEO or HR |
| Dashboard | `GET /dashboard` | role-aware counts, last 7 days of hours |

Cross-cutting: `asyncHandler` forwards async errors, a central error handler converts validation, cast and duplicate-key errors into clean 400/409 responses, and unknown routes return 404.

## 4. Database Development

MongoDB with Mongoose schemas (6 collections):

| Collection | Key fields |
| --- | --- |
| `users` | name, email (unique), password (hashed, hidden by default), role, department, designation, phone, `manager` → users, joinDate, active |
| `leaves` | employee → users, type, startDate, endDate, reason, status, reviewedBy |
| `attendances` | employee → users, date (YYYY-MM-DD), checkIn, checkOut, hours, status |
| `timesheets` | employee → users, weekStart (Monday), entries[{date, project, description, hours}], totalHours, status |
| `trainings` | title, description, trainer, dates, createdBy, participants[{user, status}] |
| `announcements` | title, body, author → users |

Integrity is enforced with indexes: unique email, unique `(employee, date)` for attendance and unique `(employee, weekStart)` for timesheets. `npm run seed` rebuilds a realistic demo organisation (admin, CEO, HR, 2 managers, 4 employees with leaves, attendance, timesheets and trainings).

## 5. Frontend Development

Stack: React 18, Vite, React Router, Axios, Bootstrap 5 and Bootstrap Icons, custom CSS (Inter font).

- **Routing & access:** `Protected` routes redirect unauthenticated users to login and block pages the role should not see; the sidebar shows only what the role can use.
- **State:** `AuthContext` holds the user and token; an Axios interceptor attaches the JWT and signs out on 401.
- **Pages:** Login (with one-click demo accounts), Dashboard (stat cards, 7-day hours chart, quick check-in/out), Employees (add/edit, search and role filter), Leaves, Attendance (live clock), Timesheets (weekly editor with submit/approve flow), Training, Announcements, My Profile.
- **UI:** modern card layout, avatars, soft status badges, responsive sidebar that collapses on mobile.

## 6. Project Execution

**Run:** follow section 2, then open http://localhost:5173.

**Suggested demo walk-through (5 minutes):**
1. Sign in as **HR** → *Employees* → *Add employee* (note that a manager must be chosen).
2. Sign in as the new **Employee** → check in on the dashboard → apply for leave → fill and submit a weekly timesheet.
3. Sign in as the **Manager** → approve the leave and the timesheet.
4. Sign in as **CEO** → show the company-wide view and post an announcement; sign in as **Admin** to show full control.

**Testing performed:** more than 100 automated API checks covering every role — access control, the reporting-line rules, leave and timesheet approval flows (including cross-team and self-approval attempts), attendance edge cases, password change and account deactivation — plus a manual browser pass through the main screens. A production build (`npm run build`) compiles cleanly.

**Recording a demo link:** record the walk-through above with any screen recorder (for example the Windows Game Bar `Win + G`, or Google Meet’s recording), upload it to Google Drive or YouTube (unlisted) and paste that link into *Add Demo Link*.
