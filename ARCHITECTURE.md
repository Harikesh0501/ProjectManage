# Architecture

This doc explains how the Student Project Tracker is built and why certain decisions were made.

## Overview

Standard MERN stack app. React frontend talks to an Express backend through REST APIs. MongoDB stores everything. We also integrate with a bunch of third-party services — GitHub, Zoom, Google Gemini AI, and Gmail for emails.

```
  React (Vite)  ──── REST API (JSON + JWT) ────  Express.js
                                                      │
                                          ┌───────────┼───────────┐
                                      MongoDB    Cloudinary    External APIs
                                      Atlas      (files)       (GitHub, Zoom,
                                                                Gemini, Gmail)
```

## Frontend

**Location:** `client/`

Built with React 19, bundled with Vite. We use Tailwind CSS for most styling, but also pull in MUI and Ant Design for things like tables, modals, and form components where building from scratch didn't make sense.

### Folder layout

```
client/src/
├── App.jsx            # routing + role-based rendering
├── config.js          # API base URL
├── context/           # auth context (React Context API)
├── components/        # all 49 components live here
├── lib/               # utility functions
└── styles/            # extra CSS files
```

### Why Context API instead of Redux

The only global state we need is authentication (current user + token). Everything else is fetched per-component. Redux would've been overkill for this, so we went with a simple Context + useReducer setup.

### How API calls work

There's a centralized Axios config in `config.js` that points to the backend URL. The auth token gets pulled from localStorage and attached to every request header automatically. Individual components just call the API and don't worry about auth headers.

### Routing

React Router handles navigation. The app renders different dashboards based on the logged-in user's role — students get their project view, mentors see projects they supervise, admins get analytics and system management. All of this logic is in `App.jsx`.

### Notable libraries

- **Recharts** for all the charts (burndown, analytics, GitHub stats)
- **@hello-pangea/dnd** for the Kanban sprint board drag-and-drop
- **React Big Calendar** for the meetings calendar view
- **jsPDF** for exporting project reports as PDFs client-side
- **Framer Motion** for page transitions and animations
- **canvas-confetti** for the celebration effect when tasks are completed

## Backend

**Location:** `server/`

The backend is split into layers. Routes handle the HTTP stuff, services deal with external APIs, models define the database schema, and middleware handles auth and caching.

### Folder layout

```
server/
├── server.js          # app setup, DB connect, mount routes
├── config/            # DB connection config
├── middleware/         # auth, role checks
│   ├── auth.js
│   └── mentorOnly.js
├── models/            # 14 Mongoose models
├── routes/            # 15 route files (one per feature)
├── services/          # 7 service modules
│   ├── aiService.js
│   ├── emailService.js
│   ├── githubService.js
│   ├── githubAdvancedService.js
│   ├── zoomService.js
│   ├── backupService.js
│   └── cacheService.js
└── utils/             # helper functions
```

### How a request flows through

```
Client hits an endpoint
    → Express picks the right route
    → Middleware runs (auth check, cache check, role check)
    → Route handler runs the business logic
    → Mongoose talks to MongoDB
    → Services call external APIs if needed
    → Response goes back
```

### Services layer

We pulled all external API logic into separate service files. This keeps the route handlers clean — they just call service methods instead of having GitHub/Zoom/Gemini code inline. Makes testing easier too.

Here's what each service does:
- `aiService.js` — wraps Google Gemini API for chat, project planning, code review, report generation
- `emailService.js` — sends emails through Gmail SMTP using Nodemailer
- `githubService.js` — basic GitHub operations (fetch commits, branches, PRs, contributors)
- `githubAdvancedService.js` — computed analytics like contribution stats, heatmaps, code quality
- `zoomService.js` — creates/manages Zoom meetings through their API
- `backupService.js` — scheduled DB backups using node-cron, stores as zip files
- `cacheService.js` — in-memory response cache with configurable TTL per route

### Caching setup

We use a custom middleware-based cache. Each route can have different cache settings:

```javascript
// in server.js
app.use('/api/projects', projectRoutes);                          // no cache — user-specific data
app.use('/api/tasks', cacheService.middleware(60), taskRoutes);    // 60 second cache
app.use('/api/feedback', cacheService.middleware(300), feedbackRoutes); // 5 min cache
```

We deliberately don't cache projects because what you see depends on your role. Caching that would leak data between users.

### Settings model

There's a Settings collection that stores system-wide config — maintenance mode, email toggle, feature flags for each service, backup frequency, rate limits, etc. It's a singleton (only one document ever exists, enforced by a pre-save hook). Admin panel reads/writes to this.

Routes check these settings at runtime — so if admin disables GitHub integration, all GitHub routes start returning 503 without needing a restart.

## Auth

JWT-based. Here's the flow:

1. User logs in with email + password
2. Server checks credentials (bcrypt compare)
3. Server signs a JWT with the user's ID
4. Client stores it in localStorage
5. Every request sends it in the `x-auth-token` header
6. The `auth` middleware verifies the token and puts user info on `req.user`
7. Role-specific middleware (`adminAuth`, `mentorOnly`, `mentorOrAdmin`) checks `req.user.role`

During maintenance mode the auth middleware rejects non-admin tokens with a 503.

## How key features work

### Project creation flow

When someone creates a project:
1. Project document gets saved to MongoDB
2. If team members are specified by email, the system looks them up — existing users get linked, unknown emails get stored for later
3. If a GitHub repo is specified, the GitHub service links it and pulls initial data
4. Invitation emails go out to team members (async — doesn't block the response)
5. Audit log entry is created

### Task submission + review

1. Student submits work — attaches a GitHub link and up to 5 screenshots
2. Screenshots go to Cloudinary through Multer middleware
3. Task status flips to `pending_review`
4. Mentor approves or rejects
5. On approval, the system recalculates milestone completion percentage
6. If all tasks in a milestone are done, milestone auto-completes
7. Project progress updates based on milestone completion

### Meeting scheduling

1. Mentor creates meeting with a Zoom link
2. System emails all team members through Nodemailer
3. In-app notifications get created for each member
4. Members join → their status updates from "invited" to "joined"
5. Past meetings auto-archive to "completed" when someone views the list

## Database

14 Mongoose models — full details are in `DATABASE_SCHEMA.md`.

Key points:
- User is the central model. Students, mentors, and admins are all Users with different roles
- Projects link to Users (creator, team members, mentor)
- Tasks belong to Projects and optionally to Milestones and Sprints
- Milestones can have sub-milestones (self-referencing)
- Each Project can have one GitHubRepo
- Settings is a singleton
- AuditLog tracks sensitive operations

We went with MongoDB because the schema changes often during development and embedded documents (like meeting participants, GitHub team info) are a natural fit. Mongoose gives us enough structure with schemas and validation without the rigidity of SQL.

## Security

- Passwords hashed with bcrypt
- JWT for auth — token required on almost every route
- Role-based middleware blocks unauthorized access
- Maintenance mode locks out non-admins
- Audit logs track deletions, role changes, failed logins
- File upload checks (type + size) before saving to Cloudinary
- Service toggles let admin disable features without touching code

## Error handling

Two layers:
1. **Per-route** — every handler has try/catch, returns proper status codes (400, 401, 403, 404, 500)
2. **Global** — catch-all handler in `server.js` catches anything that slips through. Shows stack trace in dev, hides it in production.

All errors return `{ "msg": "description" }`.
