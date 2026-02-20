# 🎓 Student Project Tracker

A comprehensive **full-stack project management platform** designed for educational institutions to streamline collaboration between **Students**, **Mentors**, and **Administrators**.

Built with the **MERN stack**, it provides real-time project tracking, AI-powered assistance, GitHub & Zoom integration, and role-based dashboards.

---

## 📑 Table of Contents

1. [Tech Stack](#-tech-stack)
2. [Architecture Overview](#-architecture-overview)
3. [Features by Role](#-features-by-role)
   - [Student Features](#-student-features)
   - [Mentor Features](#-mentor-features)
   - [Admin Features](#-admin-features)
4. [Project Structure](#-project-structure)
5. [Database Models](#-database-models)
6. [API Endpoints](#-api-endpoints)
7. [Third-Party Integrations](#-third-party-integrations)
8. [Getting Started](#-getting-started)
9. [Environment Variables](#-environment-variables)
10. [Deployment](#-deployment)

---

<br>

## 🛠 Tech Stack

<br>

### 🖥 Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI library for building component-based interfaces |
| **Vite 7** | Lightning-fast dev server and build tool |
| **Tailwind CSS 3** | Utility-first CSS framework for styling |
| **React Router DOM 7** | Client-side routing and navigation |
| **Framer Motion** | Smooth animations and page transitions |
| **Recharts** | Data visualization — analytics charts, burndown charts |
| **MUI (Material UI)** | Pre-built UI components and icons |
| **Ant Design** | Additional UI component library |
| **Radix UI** | Accessible primitives — dropdowns, selects, switches |
| **Lucide React** | Modern icon library |
| **React Hot Toast** | Toast notification popups |
| **React Big Calendar** | Calendar view for meetings and deadlines |
| **@hello-pangea/dnd** | Drag-and-drop functionality for Sprint Board (Kanban) |
| **jsPDF + AutoTable** | Client-side PDF report generation |
| **canvas-confetti** | Celebration effects on task completion |
| **date-fns** | Date formatting and manipulation utilities |
| **Axios** | HTTP client for API communication |
| **React Loading Skeleton** | Loading state placeholder animations |

<br>

### ⚙️ Backend

| Technology | Purpose |
|---|---|
| **Node.js + Express 5** | REST API server framework |
| **MongoDB + Mongoose 9** | NoSQL database and ODM for data modeling |
| **JWT (jsonwebtoken)** | Token-based authentication with 24-hour sessions |
| **bcryptjs** | Secure password hashing and verification |
| **Multer + Cloudinary** | File upload handling with cloud storage |
| **Nodemailer** | Email notifications via Gmail SMTP |
| **Octokit** | GitHub API integration for repos, commits, PRs |
| **@google/generative-ai** | Google Gemini AI for smart features |
| **Axios** | Server-side HTTP client for Zoom API, GitHub API |
| **node-cron** | Scheduled tasks — automated backups |
| **Archiver** | Creating backup ZIP archives |
| **Passport + passport-github2** | GitHub OAuth authentication |
| **CORS** | Cross-origin resource sharing |
| **dotenv** | Environment variable management |

<br>

### 🚢 DevOps & Deployment

| Technology | Purpose |
|---|---|
| **Vercel** | Frontend deployment |
| **Render** | Backend deployment |
| **Cloudinary** | Cloud-based image and file storage |
| **MongoDB Atlas** | Cloud-hosted database |
| **GitHub Actions** | CI/CD pipeline |
| **Concurrently** | Run client & server simultaneously in dev |
| **Nodemon** | Auto-restart server on code changes |

---

<br>

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Vite + React)              │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  Login/   │  │Dashboard │  │   Project Detail   │ │
│  │ Register  │  │(per role)│  │  (Tasks, Sprints,  │ │
│  └──────────┘  └──────────┘  │  Milestones, etc.) │ │
│                               └────────────────────┘ │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────┐ │
│  │  Admin   │  │ Profile  │  │   Join Project     │ │
│  │Dashboard │  │ Settings │  │                    │ │
│  └──────────┘  └──────────┘  └────────────────────┘ │
└────────────────────┬────────────────────────────────┘
                     │
                     │  REST API (Axios + JWT)
                     │
┌────────────────────┴────────────────────────────────┐
│               SERVER (Express.js + Node.js)          │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │              Middleware Layer                    │ │
│  │  • JWT Auth  • CORS  • Cache  • File Storage    │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │           Route Handlers (15 modules)           │ │
│  │                                                 │ │
│  │  auth  ·  projects  ·  tasks  ·  sprints        │ │
│  │  milestones  ·  meetings  ·  feedback           │ │
│  │  evaluations  ·  mentors  ·  github             │ │
│  │  zoom  ·  ai  ·  admin  ·  notifications        │ │
│  │  audit                                          │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │            Services Layer (7 services)          │ │
│  │                                                 │ │
│  │  AI (Gemini)  ·  Email  ·  GitHub               │ │
│  │  GitHub Advanced  ·  Zoom  ·  Backup  ·  Cache  │ │
│  └─────────────────────────────────────────────────┘ │
│                                                      │
│  ┌─────────────────────────────────────────────────┐ │
│  │          Data Layer (14 Mongoose Models)        │ │
│  │                                                 │ │
│  │  User  ·  Project  ·  Task  ·  Sprint           │ │
│  │  Milestone  ·  Meeting  ·  Feedback             │ │
│  │  Evaluation  ·  Rubric  ·  Notification         │ │
│  │  AuditLog  ·  Settings  ·  GitHubRepo  ·  Mentor│ │
│  └─────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────────────┐
        │            │                    │
   ┌────┴────┐  ┌────┴─────┐  ┌──────────┴──────────┐
   │MongoDB  │  │Cloudinary│  │  External APIs       │
   │ Atlas   │  │  (Files) │  │                      │
   └─────────┘  └──────────┘  │  • GitHub (Octokit)  │
                               │  • Zoom              │
                               │  • Google Gemini AI  │
                               │  • Gmail SMTP        │
                               └─────────────────────┘
```

---

<br>

## 🎯 Features by Role

This platform has **three user roles**, each with a distinct set of capabilities:

| Role | Access Level |
|---|---|
| 👨‍🎓 **Student** | Create/join projects, manage tasks, submit work, use AI assistant |
| 👨‍🏫 **Mentor** | All student features + review submissions, evaluate students, schedule meetings |
| 🔐 **Admin** | Full system control — user management, analytics, settings, backups, monitoring |

---

<br>

### 👨‍🎓 Student Features

<br>

#### 📊 Dashboard

Students see a personalized dashboard with:

- **Project Overview**
  View all assigned and created projects with real-time status indicators (Planning → Active → Completed).

- **Progress Tracking**
  Visual progress bars showing overall project completion percentage.

- **Quick Statistics**
  Total projects, active tasks, and pending items — all at a glance.

- **Create Project**
  Initiate new projects with title, description, start/end dates, and team size configuration (1–10 members).

- **Join Project**
  Browse and request to join existing projects via a dedicated join page.

<br>

---

#### ✅ Task Management

Students can manage all tasks within their projects:

- **View Tasks**
  See all tasks assigned within a project with priority levels — Low, Medium, or High.

- **Task Submission**
  Submit completed tasks with:
  - GitHub commit or PR links
  - Upload up to **5 screenshots** as proof of work (stored on Cloudinary)
  - Written submission description

- **Task Status Tracking**
  Track tasks through the workflow:
  `Pending` → `In Progress` → `Completed`

- **Submission Verification**
  Submitted tasks go through mentor review:
  `pending_review` → `approved` or `rejected`

- **Task Deadlines**
  View task deadlines and priority indicators with color coding.

- **Story Points**
  Tasks have configurable story points for sprint velocity tracking.

<br>

---

#### 🗂 Sprint Board (Kanban)

A visual drag-and-drop board for agile project management:

- **Drag & Drop Board**
  Visual Kanban board with three columns — Pending, In Progress, Completed.

- **Sprint Planning**
  View tasks organized by sprints with start and end dates.

- **Sprint Goals**
  Each sprint has a defined goal for focused delivery.

- **Burndown Chart**
  Visual chart showing sprint progress and remaining work over time.

<br>

---

#### 🏁 Milestones

Track project milestones for major deliverables:

- **View Milestones**
  Track project milestones with due dates and completion percentages.

- **Submit Milestones**
  Submit completed milestones with:
  - Description of work done
  - GitHub link to relevant code

- **Milestone Status**
  Track through the workflow:
  `Not Started` → `In Progress` → `Submitted` → `Approved`

- **Milestone Checklist**
  Interactive checklist view for each milestone.

<br>

---

#### 🐙 GitHub Integration

Full GitHub integration within each project:

- **Link Repository**
  Connect your project to a GitHub repository.

- **View Commits**
  Browse recent commits with author name, message, and date.

- **View Contributors**
  See all contributors with their avatars and contribution counts.

- **View Branches**
  List all branches with protection status.

- **View Pull Requests**
  Track open and closed PRs with full details.

- **Task-to-Issue Mapping**
  Map internal tasks to GitHub issues for traceability.

- **Advanced Analytics**
  Code frequency analysis, commit history, and language breakdown.

- **Setup Checklist**
  Guided GitHub integration setup for all team members.

<br>

---

#### 📅 Meetings & Communication

Stay connected with your team and mentor:

- **View Meetings**
  See all scheduled meetings with Zoom links.

- **Join Meetings**
  One-click join via Zoom meeting links.

- **Meeting Calendar**
  Calendar view of all upcoming meetings.

- **Meeting Notes**
  Access notes and recordings from past meetings.

<br>

---

#### 💬 Feedback & Evaluation

Receive mentor feedback and evaluation scores:

- **Receive Feedback**
  Get feedback from mentors with star ratings (1–5) and detailed comments.

- **View Evaluations**
  Access rubric-based evaluation scores assigned by mentors.

<br>

---

#### 🤖 AI Assistant (Google Gemini)

Powered by Google Gemini AI:

- **AI Chatbot**
  Chat with the AI for project guidance, technical help, and brainstorming.

- **AI Project Plan**
  Auto-generate structured project plans based on title and description — includes milestones, tasks, and timelines.

- **AI Code Review**
  Get AI-powered code review for milestone submissions with quality scoring.

- **AI Project Report**
  Generate comprehensive project reports with executive summaries, suitable for PDF export.

<br>

---

#### 🔔 Notifications

Stay updated with in-app notifications:

- **Real-Time Notifications**
  Bell icon with unread count in the header.

- **Notification Types**
  Meeting created, feedback received, task assigned, milestone reviewed.

- **Mark as Read**
  Individual and bulk read actions.

- **30-Day Expiry**
  Notifications auto-expire after 30 days.

<br>

---

#### 👤 Profile & Settings

Manage your personal profile:

- **Edit Profile**
  Update name, bio, skills, education, and experience.

- **College ID**
  Student-specific college identification field.

- **Upload Photo**
  Profile picture upload via Cloudinary.

- **Dark / Light Mode**
  Toggle between dark and light themes.

<br>

---

<br>

### 👨‍🏫 Mentor Features

> **Note:** Mentors have **all Student features** plus the following additional capabilities.

<br>

#### 📊 Mentor Dashboard

- **Mentor Dashboard View**
  Dedicated dashboard showing all mentored projects at a glance.

- **Assigned Projects**
  Overview of all projects where they are the assigned mentor.

- **Student Overview**
  Quick view of team members across all mentored projects.

<br>

---

#### 📋 Project Oversight

- **Mentor Assignment**
  Get assigned as mentor to student projects by admin or students.

- **Full Project Visibility**
  Complete visibility into project progress, tasks, and milestones.

- **Resume Upload**
  Upload mentor resume for project association.

<br>

---

#### ✅ Task Review & Verification

Mentors review and verify student task submissions:

- **Review Task Submissions**
  Review student-submitted tasks with evidence (screenshots, GitHub links).

- **Approve / Reject Tasks**
  Mark submitted tasks as **approved** or **rejected** with feedback.

- **Submission Details**
  View GitHub links, uploaded screenshots, and written descriptions.

- **Task Review Modal**
  Dedicated modal interface for detailed task review.

<br>

---

#### 🏁 Milestone Management

Mentors create and manage project milestones:

- **Create Milestones**
  Define project milestones with:
  - Title and description
  - Due date
  - Priority levels — Low, Medium, High

- **Review Milestone Submissions**
  Review student milestone submissions with attached evidence.

- **Approve / Reject Milestones**
  Approve completed milestones or reject them with feedback notes.

- **Milestone Progress Charts**
  Visual progress charts for each milestone.

<br>

---

#### 📝 Rubric-Based Evaluation

Create structured evaluation rubrics to assess student work:

- **Create Rubrics**
  Design evaluation rubrics with:
  - Multiple criteria — each with name and description
  - Weight multipliers per criterion
  - Max scores — default is 10
  - Can be **global** (all projects) or **project-specific**

- **Evaluate Students**
  Score students against rubric criteria.

- **Weighted Scoring**
  Automatic total score calculation using weights.

- **Evaluation Comments**
  Add detailed feedback per evaluation.

<br>

---

#### 📅 Meeting Management

Schedule and manage meetings with students:

- **Schedule Meetings**
  Create meetings with:
  - Auto-generated **Zoom links**
  - Scheduled date and time
  - Duration configuration
  - Meeting description

- **Manage Participants**
  Invite team members and track attendance status (invited → joined → attended).

- **Meeting Status Tracking**
  Track meetings through: `Scheduled` → `Ongoing` → `Completed` / `Cancelled`

- **Meeting Notes**
  Add meeting notes and recording links after the meeting.

- **Calendar View**
  Visual calendar of all scheduled meetings.

<br>

---

#### 💬 Feedback System

Give feedback to students on their project work:

- **Give Feedback**
  Send feedback with:
  - Detailed written message
  - Star rating (1–5)

- **Project-Specific Feedback**
  Feedback is tied to specific projects for context.

- **Feedback History**
  View all past feedback given and received.

<br>

---

#### 🗂 Sprint Management

Manage agile sprints for each project:

- **Create Sprints**
  Define sprints with name, start/end dates, and goals.

- **Assign Tasks to Sprints**
  Organize tasks into specific sprints.

- **Sprint Status**
  Manage sprint lifecycle: `Planned` → `Active` → `Completed`

- **Sprint Board**
  Oversee the Kanban board for each sprint.

<br>

---

#### 👤 Mentor Profile (Extended)

Mentor profiles have additional professional fields:

- **Expertise Tags** — List areas of expertise

- **Availability Toggle** — Set availability status for new project assignments

- **Company Info** — Professional affiliation

- **LinkedIn & GitHub** — Professional profile links

<br>

---

<br>

### 🔐 Admin Features

> **Note:** Admins have **complete system-wide control** with the following exclusive capabilities.

<br>

#### 📊 Admin Dashboard

The admin dashboard provides a comprehensive system overview:

<br>

**System Overview Cards:**
- Total Users, Projects, Tasks, and Feedback count
- Active, Completed, and Planning projects
- Completed, In Progress, and Pending tasks
- GitHub-linked projects count

<br>

**Analytics Charts (Recharts):**
- Project status distribution — pie chart
- User role distribution — bar chart
- Project growth over time — line chart
- User growth over time — line chart
- Average project progress percentage
- Average feedback rating
- Project completion rate

<br>

**Additional Insights:**
- **Top Mentors** — Ranking of mentors by number of assigned projects
- **Recent Activity** — Projects and tasks created in the last 30 days
- **Security Alerts** — Count and details of critical actions in the last 24 hours:
  - Project deletions, user deletions, role changes
  - Failed logins, permission denials, system errors

<br>

---

#### 👥 User Management

Full CRUD control over all user accounts:

- **View All Users**
  Complete list of all registered users with name, email, role, and details.

- **Edit User Details**
  Modify user name, email, role, and bio.

- **Change User Role**
  Promote or demote users between Student, Mentor, and Admin.

- **Change User Password**
  Admin-level password reset for any user account.

- **Delete Users**
  Remove user accounts from the system.

- **Search & Filter**
  Search users by name, email, or role.

<br>

---

#### 📋 Project Management (Admin)

Oversight of all projects across the platform:

- **View All Projects**
  Overview of every project in the system, including:
  - Creator identity
  - Team members list
  - Mentor assignment
  - Status, progress, and dates

- **Delete Projects**
  Remove any project and its associated tasks.

- **Project Details**
  Deep-dive into any project's tasks, milestones, and progress.

<br>

---

#### ⚙️ System Settings

Configure platform-wide settings:

- **Maintenance Mode**
  Toggle system-wide maintenance mode. When enabled, only admins can log in.

- **Registration Control**
  Enable or disable new user registrations.

- **Email Notifications**
  Toggle the email notification system on/off.

- **Session Timeout**
  Configure JWT session duration. Default: 60 minutes.

- **Max File Upload Size**
  Set maximum upload size. Default: 10 MB.

- **Rate Limiting**
  Configure API rate limiting. Default: 100 requests.

- **Cache Expiration**
  Set cache TTL in hours. Default: 24 hours.

- **Backup Frequency**
  Configure automated backup schedule — Hourly, Daily, Weekly, or Monthly.

- **Log Retention**
  Set log retention period in days. Default: 30 days.

<br>

---

#### 🖥 Service Monitoring & Control

Admins can toggle each service on or off individually:

| Service | What It Controls |
|---|---|
| **API Server** | Core API server — disabling blocks all non-admin logins |
| **Database** | MongoDB connection monitoring |
| **Email Service** | Nodemailer email sending capability |
| **GitHub Integration** | GitHub API features — repos, commits, PRs |
| **File Storage** | Cloudinary file upload capability |
| **Notification Service** | In-app notification system |
| **Cache Service** | In-memory API response caching |
| **Backup Service** | Automated and manual database backups |

<br>

---

#### 🏥 System Health Monitoring

Real-time system health dashboard:

- **Server Uptime**
  View how long the server has been running.

- **Memory Usage**
  Real-time heap memory usage — used / total / percentage.

- **Health Status**
  Automatic health classification: `Healthy` → `Warning` → `Critical`

- **Last Health Check**
  Timestamp of the most recent health check.

<br>

---

#### 💾 Backup Management

Database backup tools:

- **Manual Backup**
  Trigger an immediate database backup — creates a ZIP archive.

- **View Backups**
  List all backup files with timestamps and sizes.

- **Download Backups**
  Download backup ZIP files to your local machine.

- **Delete Backups**
  Remove old backup files to free up space.

- **Automated Backups**
  Cron-based scheduled backups with configurable frequency.

<br>

---

#### 📜 Audit Logging

Comprehensive audit trail of all system actions:

- **Audit Log Viewer**
  View all system actions with full details.

- **Action Tracking**
  Each log entry includes: user, action type, resource, details, IP address, and user agent.

- **Critical Actions Monitored:**
  - `LOGIN`
  - `DELETE_PROJECT`
  - `DELETE_USER`
  - `ROLE_CHANGE`
  - `DELETE_TASK`
  - `FAILED_LOGIN`
  - `PERMISSION_DENIED`
  - `SYSTEM_ERROR`
  - `MILESTONE_REJECTED`
  - `SUSPENSION`

- **System Logs**
  View server logs with levels — INFO, WARNING, ERROR.

- **Clear Logs**
  Admin-level log purge.

<br>

---

<br>

## 📁 Project Structure

```
student-project-tracker/
│
├── 📁 client/                          # Frontend (React + Vite)
│   │
│   ├── 📁 src/
│   │   │
│   │   ├── 📁 components/              # 38+ React Components
│   │   │   │
│   │   │   ├── AdminDashboard.jsx          Admin overview & analytics
│   │   │   ├── AdminPanel.jsx              Admin management panel
│   │   │   ├── Analytics.jsx               Analytics visualizations
│   │   │   ├── AuditLogViewer.jsx          Audit trail viewer
│   │   │   ├── BurndownChart.jsx           Sprint burndown chart
│   │   │   ├── ChangePasswordModal.jsx     Admin password change modal
│   │   │   ├── Dashboard.jsx               Main dashboard (role-aware)
│   │   │   ├── EditUserModal.jsx           Admin user editor modal
│   │   │   │
│   │   │   ├── GitHubAdvancedAnalytics.jsx GitHub deep analytics
│   │   │   ├── GitHubIntegration.jsx       GitHub repo management
│   │   │   ├── GitHubRepoCreationGuide.jsx Setup guide
│   │   │   ├── GitHubReposManager.jsx      Multi-repo management
│   │   │   ├── GitHubSetupChecklist.jsx    Integration checklist
│   │   │   ├── GitHubTaskMapping.jsx       Task-to-issue mapping
│   │   │   │
│   │   │   ├── JoinProject.jsx             Browse & join projects
│   │   │   ├── Login.jsx                   Authentication page
│   │   │   ├── Register.jsx                Registration page
│   │   │   ├── ProtectedRoute.jsx          Auth route guard
│   │   │   │
│   │   │   ├── MeetingManager.jsx          Meeting CRUD + Zoom
│   │   │   ├── MentorRubric.jsx            Rubric evaluation
│   │   │   │
│   │   │   ├── MilestoneChecklist.jsx      Milestone checklist view
│   │   │   ├── MilestoneManager.jsx        Milestone CRUD
│   │   │   ├── MilestoneProgressChart.jsx  Milestone analytics
│   │   │   ├── MilestoneReview.jsx         Mentor milestone review
│   │   │   ├── StudentMilestones.jsx       Student milestone view
│   │   │   │
│   │   │   ├── NotificationCenter.jsx      Notification bell + list
│   │   │   ├── Profile.jsx                 User profile editor
│   │   │   ├── ProjectDetail.jsx           Full project view (~95KB)
│   │   │   ├── ProjectManagement.jsx       Admin project management
│   │   │   │
│   │   │   ├── ServiceMonitoring.jsx       Admin service controls
│   │   │   ├── Settings.jsx                User settings
│   │   │   ├── SystemSettings.jsx          Admin system settings
│   │   │   │
│   │   │   ├── SprintBoard.jsx             Kanban drag-and-drop
│   │   │   ├── StatusBadge.jsx             Reusable status badges
│   │   │   │
│   │   │   ├── TaskReviewModal.jsx         Mentor task review
│   │   │   ├── TaskSubmissionModal.jsx     Student task submission
│   │   │   ├── UserManagement.jsx          Admin user CRUD
│   │   │   ├── mode-toggle.jsx             Dark/Light theme toggle
│   │   │   │
│   │   │   └── 📁 ui/                     Shadcn / Radix primitives
│   │   │
│   │   ├── 📁 context/
│   │   │   └── AuthContext.jsx             Global auth state (JWT)
│   │   │
│   │   ├── 📁 lib/                         Utility functions
│   │   │
│   │   ├── App.jsx                         Route definitions
│   │   ├── config.js                       API URL configuration
│   │   ├── index.css                       Global styles
│   │   └── main.jsx                        App entry point
│   │
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
│
├── 📁 server/                          # Backend (Express.js)
│   │
│   ├── 📁 config/
│   │   └── cloudinary.js                   Cloudinary configuration
│   │
│   ├── 📁 middleware/
│   │   └── auth.js                         JWT authentication middleware
│   │
│   ├── 📁 models/                      # 14 Mongoose Models
│   │   ├── AuditLog.js                     System action audit trail
│   │   ├── Evaluation.js                   Rubric-based evaluations
│   │   ├── Feedback.js                     Student-mentor feedback
│   │   ├── GitHubRepo.js                   Linked GitHub repositories
│   │   ├── Meeting.js                      Zoom meetings
│   │   ├── Mentor.js                       Mentor profile extension
│   │   ├── Milestone.js                    Project milestones
│   │   ├── Notification.js                 In-app notifications
│   │   ├── Project.js                      Core project entity
│   │   ├── Rubric.js                       Evaluation rubrics
│   │   ├── Settings.js                     System-wide settings (singleton)
│   │   ├── Sprint.js                       Agile sprints
│   │   ├── Task.js                         Project tasks
│   │   └── User.js                         Users (Student/Mentor/Admin)
│   │
│   ├── 📁 routes/                      # 15 Route Modules
│   │   ├── admin.js                        Admin-only endpoints
│   │   ├── ai.js                           AI chatbot & generation
│   │   ├── audit.js                        Audit log queries
│   │   ├── auth.js                         Login / Register / Profile
│   │   ├── evaluations.js                  Rubric evaluations
│   │   ├── feedback.js                     Feedback CRUD
│   │   ├── github.js                       GitHub API integration
│   │   ├── meetings.js                     Meeting management
│   │   ├── mentors.js                      Mentor listing
│   │   ├── milestones.js                   Milestone CRUD
│   │   ├── notifications.js                Notification management
│   │   ├── projects.js                     Project CRUD
│   │   ├── sprints.js                      Sprint management
│   │   ├── tasks.js                        Task CRUD
│   │   └── zoom.js                         Zoom meeting generation
│   │
│   ├── 📁 services/                    # 7 Business Services
│   │   ├── aiService.js                    Google Gemini AI integration
│   │   ├── backupService.js                Database backup (ZIP + cron)
│   │   ├── cacheService.js                 In-memory response caching
│   │   ├── emailService.js                 Nodemailer email sending
│   │   ├── githubAdvancedService.js        Advanced GitHub analytics
│   │   ├── githubService.js                Basic GitHub API operations
│   │   └── zoomService.js                  Zoom meeting API
│   │
│   ├── 📁 utils/                       # Utility functions
│   │
│   ├── server.js                           Express app entry point
│   └── package.json
│
│
├── package.json                        # Root (concurrently for dev)
└── .gitignore
```

---

<br>

## 🗄 Database Models

<br>

### 👤 User Model

| Field | Type | Description |
|---|---|---|
| `name` | String | User's full name |
| `email` | String | Unique, lowercase, trimmed |
| `password` | String | bcrypt hashed password |
| `role` | Enum | `Student` · `Mentor` · `Admin` |
| `collegeId` | String | College ID (for students) |
| `bio` | String | Personal bio |
| `skills` | [String] | List of skills |
| `education` | String | Education details |
| `experience` | String | Work experience |
| `expertise` | [String] | Areas of expertise (mentors only) |
| `availability` | Boolean | Available for projects (mentors only) |
| `company` | String | Professional affiliation (mentors only) |
| `linkedin` | String | LinkedIn profile URL (mentors only) |
| `github` | String | GitHub profile URL (mentors only) |
| `photo` | String | Cloudinary URL for profile picture |

<br>

---

### 📁 Project Model

| Field | Type | Description |
|---|---|---|
| `title` | String | Auto-uppercased project name |
| `description` | String | Project description |
| `creator` | ObjectId → User | Who created the project |
| `students` | [ObjectId → User] | Student team members |
| `teamMembers` | [ObjectId → User] | All team members |
| `mentor` | ObjectId → User | Assigned mentor |
| `startDate` | Date | Project start date |
| `endDate` | Date | Project end date |
| `status` | Enum | `Planning` · `Active` · `App Complete` · `Completed` |
| `progress` | Number (0–100) | Overall completion percentage |
| `githubRepo` | String | Linked GitHub repository name |
| `githubRepoUrl` | String | Full GitHub repository URL |
| `teamSize` | Number (1–10) | Maximum team size |
| `isStuck` | Boolean | Flag for stuck projects |

<br>

---

### ✅ Task Model

| Field | Type | Description |
|---|---|---|
| `title` | String | Task title |
| `description` | String | Task description |
| `project` | ObjectId → Project | Parent project |
| `milestone` | ObjectId → Milestone | Associated milestone |
| `sprint` | ObjectId → Sprint | Associated sprint |
| `assignedTo` | ObjectId → User | Assigned student |
| `status` | Enum | `Pending` · `In Progress` · `Completed` |
| `priority` | Enum | `Low` · `Medium` · `High` |
| `deadline` | Date | Task deadline |
| `storyPoints` | Number | Story points for velocity tracking |
| `submission.githubLink` | String | GitHub link in submission |
| `submission.screenshots` | [String] | Uploaded screenshot URLs (max 5) |
| `submission.submittedAt` | Date | When the task was submitted |
| `submissionStatus` | Enum | `none` · `pending_review` · `approved` · `rejected` |

<br>

---

### 🏁 Milestone Model

| Field | Type | Description |
|---|---|---|
| `title` | String | Milestone title |
| `description` | String | Milestone description |
| `project` | ObjectId → Project | Parent project |
| `parentMilestone` | ObjectId → Milestone | Parent milestone (for hierarchy) |
| `submilestones` | [ObjectId → Milestone] | Child milestones |
| `tasks` | [ObjectId → Task] | Linked tasks |
| `dueDate` | Date | Milestone due date |
| `status` | Enum | `Not Started` · `In Progress` · `Submitted` · `Completed` · `Approved` |
| `priority` | Enum | `Low` · `Medium` · `High` |
| `submittedBy` | ObjectId → User | Who submitted it |
| `submissionDescription` | String | Student submission description |
| `submissionGithubLink` | String | GitHub link for submission |
| `submissionStatus` | Enum | `pending` · `approved` · `rejected` |
| `approvedBy` | ObjectId → User | Who approved it |
| `approvalNotes` | String | Mentor review notes |
| `completionPercentage` | Number (0–100) | Progress percentage |

<br>

---

### 📦 Other Models

<br>

**Sprint**
| Field | Type | Description |
|---|---|---|
| `name` | String | Sprint name |
| `project` | ObjectId → Project | Parent project |
| `startDate` | Date | Sprint start date |
| `endDate` | Date | Sprint end date |
| `goal` | String | Sprint goal |
| `status` | Enum | `Planned` · `Active` · `Completed` |

<br>

**Meeting**
| Field | Type | Description |
|---|---|---|
| `title` | String | Meeting title |
| `zoomMeetingLink` | String | Zoom meeting URL |
| `zoomMeetingId` | String | Zoom meeting ID |
| `createdBy` | ObjectId → User | Meeting creator |
| `project` | ObjectId → Project | Parent project |
| `scheduledDate` | Date | Scheduled date and time |
| `duration` | Number | Duration in minutes |
| `status` | Enum | `scheduled` · `ongoing` · `completed` · `cancelled` |
| `notes` | String | Meeting notes |
| `recordingLink` | String | Recording URL |

<br>

**Feedback**
| Field | Type | Description |
|---|---|---|
| `project` | ObjectId → Project | Related project |
| `from` | ObjectId → User | Feedback sender |
| `to` | ObjectId → User | Feedback recipient |
| `message` | String | Feedback message |
| `rating` | Number (1–5) | Star rating |

<br>

**Evaluation**
| Field | Type | Description |
|---|---|---|
| `project` | ObjectId → Project | Related project |
| `evaluator` | ObjectId → User | Who evaluated (mentor) |
| `rubric` | ObjectId → Rubric | Rubric used |
| `scores` | Map (String → Number) | Score per criterion |
| `totalScore` | Number | Calculated weighted total |
| `comments` | String | Evaluation comments |

<br>

**Rubric**
| Field | Type | Description |
|---|---|---|
| `name` | String | Rubric name |
| `project` | ObjectId → Project | Specific project (optional) |
| `isGlobal` | Boolean | Available for all projects |
| `criteria` | Array | List of criteria (name, description, weight, maxScore) |
| `createdBy` | ObjectId → User | Who created the rubric |

<br>

**Notification**
| Field | Type | Description |
|---|---|---|
| `recipient` | ObjectId → User | Who receives it |
| `type` | Enum | `meeting_created` · `feedback_received` · `task_assigned` · `milestone_reviewed` |
| `title` | String | Notification title |
| `message` | String | Notification body |
| `isRead` | Boolean | Read status |
| `expiresAt` | Date | Auto-expires after 30 days |

<br>

**AuditLog**
| Field | Type | Description |
|---|---|---|
| `user` | ObjectId → User | Who performed the action |
| `action` | String | Action type (e.g., `LOGIN`, `DELETE_PROJECT`) |
| `resource` | String | Target resource |
| `details` | Object | Extra info (diffs, etc.) |
| `ipAddress` | String | IP address |
| `userAgent` | String | Browser user agent |

<br>

**GitHubRepo**
| Field | Type | Description |
|---|---|---|
| `projectId` | ObjectId → Project | Linked project |
| `repoUrl` | String | Repository URL |
| `repoName` | String | Repository name |
| `owner` | String | Repository owner |
| `commits` | Array | Commit history (sha, message, author, date) |
| `contributors` | Array | Contributor list (login, avatar, contributions) |
| `branches` | Array | Branch list (name, protected) |
| `pullRequests` | Array | PR list (number, title, state, author) |
| `lastSynced` | Date | Last sync timestamp |

<br>

**Settings** (Singleton Document)
| Field | Type | Description |
|---|---|---|
| `maintenanceMode` | Boolean | System-wide maintenance toggle |
| `allowRegistration` | Boolean | Registration control |
| `emailNotifications` | Boolean | Email system toggle |
| `backupFrequency` | Enum | `hourly` · `daily` · `weekly` · `monthly` |
| `logRetention` | Number | Days to retain logs |
| `sessionTimeout` | Number | Session duration in minutes |
| `maxFileUploadSize` | Number | Max upload size in MB |
| `rateLimiting` | Number | API rate limit |
| `services` | Object | Toggle for each service (8 services) |
| `systemHealth` | Object | Health status, CPU, memory, disk usage |

---

<br>

## 🔌 API Endpoints

<br>

### 🔐 Authentication — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/register` | Register a new user (Student / Mentor / Admin) |
| `POST` | `/login` | Login and receive JWT token |
| `GET` | `/me` | Get current authenticated user |
| `GET` | `/profile` | Get full user profile |
| `PUT` | `/profile` | Update user profile details |
| `PUT` | `/upload-photo` | Upload profile photo to Cloudinary |

<br>

---

### 📁 Projects — `/api/projects`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get user's projects (filtered by role) |
| `POST` | `/` | Create a new project |
| `GET` | `/:id` | Get project details by ID |
| `PUT` | `/:id` | Update project details |
| `DELETE` | `/:id` | Delete a project |
| `POST` | `/:id/join` | Join a project |
| `PUT` | `/:id/mentor` | Assign a mentor to a project |

<br>

---

### ✅ Tasks — `/api/tasks`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/project/:projectId` | Get all tasks for a project |
| `POST` | `/` | Create a new task |
| `PUT` | `/:id` | Update a task |
| `DELETE` | `/:id` | Delete a task |
| `PUT` | `/:id/submit` | Submit a task for review |
| `PUT` | `/:id/review` | Approve or reject a submission |

<br>

---

### 🗂 Sprints — `/api/sprints`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/project/:projectId` | Get all sprints for a project |
| `POST` | `/` | Create a new sprint |
| `PUT` | `/:id` | Update a sprint |
| `DELETE` | `/:id` | Delete a sprint |

<br>

---

### 🏁 Milestones — `/api/milestones`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/project/:projectId` | Get all milestones for a project |
| `POST` | `/` | Create a new milestone |
| `PUT` | `/:id` | Update a milestone |
| `DELETE` | `/:id` | Delete a milestone |
| `PUT` | `/:id/submit` | Submit a milestone (student) |
| `PUT` | `/:id/review` | Approve or reject a milestone (mentor) |

<br>

---

### 📅 Meetings — `/api/meetings`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/project/:projectId` | Get all meetings for a project |
| `POST` | `/` | Create a new meeting (auto-generates Zoom link) |
| `PUT` | `/:id` | Update meeting details |
| `DELETE` | `/:id` | Delete a meeting |
| `POST` | `/:id/join` | Join a meeting |

<br>

---

### 💬 Feedback — `/api/feedback`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/project/:projectId` | Get all feedback for a project |
| `POST` | `/` | Give feedback to a team member |

<br>

---

### 📝 Evaluations — `/api/evaluations`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/project/:projectId` | Get evaluations for a project |
| `POST` | `/` | Create a new evaluation |

<br>

---

### 🐙 GitHub — `/api/github`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/repos/:projectId` | Get linked repositories |
| `POST` | `/link` | Link a GitHub repo to a project |
| `GET` | `/commits/:owner/:repo` | Get commit history |
| `GET` | `/contributors/:owner/:repo` | Get contributor list |
| `GET` | `/branches/:owner/:repo` | Get branch list |
| `GET` | `/pull-requests/:owner/:repo` | Get pull requests |
| `GET` | `/advanced/:owner/:repo` | Get advanced analytics |

<br>

---

### 🤖 AI — `/api/ai`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat` | Chat with the AI assistant |
| `POST` | `/project-plan` | Generate a project plan |
| `POST` | `/code-review` | Request AI code review |
| `POST` | `/project-report` | Generate a comprehensive project report |

<br>

---

### 📹 Zoom — `/api/zoom`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/create-meeting` | Create a new Zoom meeting |
| `GET` | `/meeting/:meetingId` | Get meeting details |
| `DELETE` | `/meeting/:meetingId` | Delete a Zoom meeting |

<br>

---

### 🔐 Admin Only — `/api/admin`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | Get all users |
| `PUT` | `/users/:id` | Update user details |
| `PUT` | `/users/:id/role` | Change user role |
| `PUT` | `/users/:id/change-password` | Reset user password |
| `DELETE` | `/users/:id` | Delete a user |
| `GET` | `/projects` | Get all projects |
| `DELETE` | `/projects/:id` | Delete any project |
| `GET` | `/analytics` | Get comprehensive analytics data |
| `GET` | `/settings` | Get system settings |
| `PUT` | `/settings` | Update system settings |
| `POST` | `/backup/trigger` | Trigger manual backup |
| `GET` | `/backups` | List all backup files |
| `GET` | `/backup/download/:filename` | Download a backup file |
| `DELETE` | `/backup/:filename` | Delete a backup file |
| `GET` | `/health` | Get system health status |
| `GET` | `/logs` | Get system logs |
| `POST` | `/logs/clear` | Clear system logs |
| `GET` | `/alerts` | Get security alerts (last 24h) |

<br>

---

### 🔔 Notifications — `/api/notifications`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Get all notifications for the user |
| `PUT` | `/:id/read` | Mark a notification as read |
| `PUT` | `/read-all` | Mark all notifications as read |

<br>

---

### 📜 Audit — `/api/audit`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/logs` | Get audit logs |

---

<br>

## 🔗 Third-Party Integrations

<br>

### 🤖 Google Gemini AI

**Service File:** `aiService.js`
**Model Used:** `gemini-2.0-flash`

| Feature | Description |
|---|---|
| **Chat Assistant** | Multi-turn conversation with AI for project guidance and technical help |
| **Project Plan Generator** | Auto-generate structured project plans with milestones, tasks, and timelines |
| **Code Reviewer** | Analyze code against milestone requirements; provides quality scoring and suggestions |
| **Report Generator** | Create comprehensive project reports with executive summaries and recommendations |

<br>

---

### 🐙 GitHub Integration

**Service Files:** `githubService.js` + `githubAdvancedService.js`
**Library:** Octokit (GitHub REST API)

| Feature | Description |
|---|---|
| **Repository Linking** | Connect projects to GitHub repos |
| **Commit Tracking** | Sync and display full commit history |
| **Contributor Analysis** | Fetch contributor stats with avatars and contribution counts |
| **Branch Management** | List and monitor all branches |
| **Pull Request Tracking** | Monitor PR lifecycle (open, closed, merged) |
| **Advanced Analytics** | Code frequency, language breakdown, commit patterns |
| **Task-Issue Mapping** | Map internal tasks to GitHub issues |

<br>

---

### 📹 Zoom Integration

**Service File:** `zoomService.js`
**Auth:** Server-to-Server OAuth

| Feature | Description |
|---|---|
| **Create Meetings** | Generate Zoom meetings programmatically |
| **Meeting Details** | Fetch meeting info and participants |
| **Participant Management** | Add registrants to meetings |
| **Delete Meetings** | Clean up completed or cancelled meetings |
| **Mock Mode** | Fallback mode for testing without Zoom credentials |

<br>

---

### 📧 Email Service

**Service File:** `emailService.js`
**Library:** Nodemailer (Gmail SMTP)

| Feature | Description |
|---|---|
| **Gmail SMTP** | Send emails via Google App Passwords |
| **Notification Emails** | Task assignments, meeting invites, milestone updates, feedback alerts |

<br>

---

### ☁️ Cloudinary

**Config File:** `config/cloudinary.js`

| Feature | Description |
|---|---|
| **Image Uploads** | Profile photos and task submission screenshots |
| **Cloud Storage** | Persistent file storage with CDN |
| **Format Validation** | Accepts JPG, PNG, JPEG only — max 5MB |

---

<br>

## 🚀 Getting Started

<br>

### Prerequisites

Make sure you have the following installed:

- **Node.js** — version 18 or higher
- **MongoDB** — local installation or MongoDB Atlas (cloud)
- **npm** — comes with Node.js

<br>

### Installation Steps

<br>

**Step 1 — Clone the repository**

```bash
git clone https://github.com/Harikesh0501/ProjectManage.git
cd ProjectManage
```

<br>

**Step 2 — Install root dependencies**

```bash
npm install
```

<br>

**Step 3 — Install server dependencies**

```bash
cd server
npm install
```

<br>

**Step 4 — Install client dependencies**

```bash
cd ../client
npm install
```

<br>

**Step 5 — Set up environment variables**

Create a `.env` file in the `server/` directory. See the [Environment Variables](#-environment-variables) section below for all required variables.

<br>

**Step 6 — Run the application**

From the **root directory**, run both client and server together:

```bash
npm run dev
```

Or run them **separately** in two terminals:

```bash
# Terminal 1 — Server (runs on port 5000)
cd server && npm run dev
```

```bash
# Terminal 2 — Client (runs on port 5173)
cd client && npm run dev
```

---

<br>

## 🔐 Environment Variables

<br>

### Server Environment (`.env` in `server/` directory)

```env
# ─── Database ───────────────────────────────────────
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>

# ─── Authentication ─────────────────────────────────
JWT_SECRET=your_jwt_secret_key

# ─── Cloudinary (File Uploads) ──────────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── Google Gemini AI ───────────────────────────────
GEMINI_API_KEY=your_gemini_api_key

# ─── GitHub Integration ────────────────────────────
GITHUB_TOKEN=your_github_personal_access_token

# ─── Zoom Integration ──────────────────────────────
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
ZOOM_ACCOUNT_ID=your_zoom_account_id
USE_MOCK_MODE=false       # Set to 'true' for testing without Zoom

# ─── Email (Gmail SMTP) ────────────────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# ─── Server ────────────────────────────────────────
PORT=5000
NODE_ENV=development
```

<br>

### Client Environment

For the client, set environment variables on Vercel/Netlify or in a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000
```

In production, this should point to your deployed backend URL:

```env
VITE_API_URL=https://your-backend.onrender.com
```

---

<br>

## 🌐 Deployment

<br>

### Frontend — Vercel

1. Push the `client/` folder to GitHub.

2. Import the project on [Vercel](https://vercel.com).

3. Set the **Root Directory** to `client`.

4. Add the environment variable:
   ```
   VITE_API_URL = https://your-backend.onrender.com
   ```

5. Deploy.

<br>

### Backend — Render

1. Push the `server/` folder to GitHub.

2. Create a new **Web Service** on [Render](https://render.com).

3. Set the **Root Directory** to `server`.

4. Set the **Build Command** to:
   ```
   npm install
   ```

5. Set the **Start Command** to:
   ```
   npm start
   ```

6. Add all environment variables from the `.env` section above.

7. Deploy.

---

<br>

## 📄 License

This project is built for educational purposes.

---

<br>

<p align="center">
  Made with ❤️ by <strong>Harikesh</strong> & team
</p>
