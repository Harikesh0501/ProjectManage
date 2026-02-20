# Student Project Tracker

A project management platform built for colleges. Students create and manage projects, mentors review their work and give feedback, and admins handle everything behind the scenes. Built with the MERN stack.

## Tech Stack

**Frontend:** React 19, Vite 7, Tailwind CSS, MUI, Ant Design, Framer Motion, Recharts, React Router DOM 7

**Backend:** Node.js, Express 5, Mongoose 9, JWT, bcryptjs, Multer, Cloudinary, Nodemailer, Octokit, Google Gemini AI, node-cron

**Database:** MongoDB Atlas

**Deployment:** Vercel (frontend), Render (backend)

## Features

### Student

Students can create projects, invite team members by email, and track everything from their dashboard.

**Projects** — Create projects with title, description, team members, dates, and optional GitHub repo. Join existing projects. Track progress with visual indicators.

**Tasks** — View and manage tasks within projects. Submit completed work with GitHub links and up to 5 screenshots. Track task status (Pending → In Progress → Completed) and submission review status (pending → approved/rejected).

**Sprint Board** — Kanban-style drag-and-drop board with Pending, In Progress, and Completed columns. Sprint planning with goals, dates, and burndown charts showing ideal vs actual progress.

**Milestones** — Track project checkpoints with due dates and completion percentages. Submit work against milestones with description and GitHub links. View milestone checklists.

**GitHub** — Link a repo to your project. Browse commits, contributors, branches, and PRs right inside the app. Commit heatmaps, contribution stats, code quality metrics. Sync GitHub issues into tasks.

**Meetings** — View scheduled meetings with Zoom links. Join with one click. Calendar view for upcoming meetings. Access notes and recordings from past ones.

**AI Assistant** — Chat with JARVIS (powered by Gemini) for project help. Generate project plans from a title. Get AI code reviews on milestone submissions. Export AI-generated project reports as PDF.

**Notifications** — Bell icon with unread count. Notifications for meetings, feedback, task assignments, milestone reviews. Mark read individually or all at once. Auto-expire after 30 days.

**Profile** — Edit name, bio, skills, education, experience. Upload profile photo. Dark/light mode toggle.

### Mentor

Mentors have all student features plus:

**Dashboard** — Dedicated view showing all projects they're mentoring with team member overview.

**Task Review** — Review student submissions with screenshots and GitHub links. Approve or reject with feedback.

**Milestones** — Create milestones with titles, due dates, and priorities. Approve or reject submissions with notes. Email notifications sent to students on review.

**Evaluations** — Create rubrics with weighted criteria and max scores (global or project-specific). Score students against rubrics. System calculates weighted totals.

**Feedback** — Send feedback with star ratings (1-5) to individual students or broadcast to entire team. Email notifications go out automatically.

**Meetings** — Schedule meetings with Zoom links. All team members get email invitations and in-app notifications. Update meeting status, add notes and recording links.

**AI Code Review** — Use AI to analyze code from GitHub for milestone submissions. Get quality scores and detailed feedback.

**Profile** — Upload resume. Set expertise areas and availability.

### Admin

Admins have full system control:

**User Management** — View all users. Change roles. Update details. Reset passwords. Delete accounts.

**Project Management** — View all projects across the system. Delete projects (removes associated tasks too).

**Analytics Dashboard** — Total users, projects, tasks. Completion rates. User role distribution. Project status breakdown. Top mentors. Monthly growth charts. Recent activity stats.

**System Settings** — Toggle maintenance mode, registration, email notifications. Configure backup frequency, log retention, session timeout, file upload limits, rate limiting, cache duration. Enable/disable individual services (GitHub, email, file storage, etc.) without restarts.

**Backups** — Trigger manual database backups. View and download backup files. Delete old backups. Automated backups via node-cron.

**System Health** — Monitor memory, CPU, disk usage. Check service status. View system logs. Clear logs. Security alerts for the last 24 hours.

**Audit Logs** — Track logins, failed logins, project deletions, role changes, and other sensitive operations with user info and IP addresses.

## Project Structure

```
├── client/                    # React frontend
│   ├── src/
│   │   ├── App.jsx            # Main app with routing
│   │   ├── config.js          # API URL config
│   │   ├── context/           # Auth context
│   │   ├── components/        # 49 UI components
│   │   └── lib/               # Utilities
│   ├── vercel.json            # Vercel routing config
│   └── vite.config.js
│
├── server/                    # Express backend
│   ├── server.js              # Entry point
│   ├── config/                # DB connection
│   ├── middleware/             # Auth, role checks
│   ├── models/                # 14 Mongoose models
│   ├── routes/                # 15 route modules
│   ├── services/              # 7 service modules
│   └── utils/                 # Helpers
│
├── API_DOCUMENTATION.md       # All 95 endpoints documented
├── DATABASE_SCHEMA.md         # All 14 models documented
├── ARCHITECTURE.md            # System architecture
└── DEPLOYMENT_GUIDE.md        # How to deploy
```

## Database

14 MongoDB collections. User is the central model, everything else links back to it.

**Core models:** User, Project, Task, Sprint, Milestone

**Communication:** Meeting, Feedback, Notification

**Evaluation:** Evaluation, Rubric

**Integration:** GitHubRepo, Mentor

**System:** AuditLog, Settings (singleton)

Full schema details in [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md).

## API

95 endpoints across 15 route modules covering auth, projects, tasks, sprints, milestones, meetings, feedback, evaluations, GitHub, AI, Zoom, notifications, admin, audit, and mentors.

Full documentation in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## Third-Party Integrations

**GitHub** — Link repos, fetch commits/branches/PRs/contributors, sync issues to tasks, commit heatmaps, contribution analytics.

**Zoom API** — Create meetings, manage participants, get meeting details. Invitations emailed to team members automatically.

**Google Gemini AI** — Project plan generation, chat assistant, code review for milestones, system health analysis, project report generation.

**Cloudinary** — Cloud storage for profile photos, task screenshots, and mentor resumes. Uploads handled through Multer middleware.

**Gmail SMTP** — Email notifications for team invitations, meeting schedules, feedback, milestone reviews. Uses Nodemailer with Gmail App Password.

## Getting Started

### Prerequisites

- Node.js
- MongoDB Atlas account
- Cloudinary account
- Gmail account with App Password

### Installation

```bash
# Clone the repo
git clone https://github.com/Harikesh0501/ProjectManage.git
cd ProjectManage

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Required
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
JWT_SECRET=your_random_secret_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
PORT=5000
NODE_ENV=development

# Optional (features won't work without these)
GITHUB_TOKEN=ghp_your_token
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
ZOOM_SECRET_TOKEN=your_token
USE_MOCK_MODE=false
GEMINI_API_KEY=your_gemini_key
EMAIL_FROM=noreply@yourapp.com
```

For the client, set `VITE_API_URL` in Vercel:
```
VITE_API_URL=https://your-backend.onrender.com/api
```

### Running

From the root directory:
```bash
npm run dev
```

This starts both client (port 5173) and server (port 5000) using concurrently.

Or run them separately:
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

## Deployment

**Frontend → Vercel** — Root directory: `client`, framework: Vite, set `VITE_API_URL`

**Backend → Render** — Root directory: `server`, build: `npm install`, start: `node server.js`, add all env vars

Full instructions in [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

## License

Built for educational purposes.

---

Made by **Harikesh** & team
