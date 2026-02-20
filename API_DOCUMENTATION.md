# API Documentation

## Student Project Tracker

This document covers every API endpoint in the Student Project Tracker application. The backend is built with Express.js and MongoDB, and all routes are prefixed with `/api`.

**How authentication works:** Most endpoints need a valid JWT token. Include it in the request header as `x-auth-token`. You get this token when you register or login.

**Content type:** Send JSON for all requests. For file uploads (photos, resumes, screenshots), use `multipart/form-data` instead.

---

## Quick Reference

The app has 15 route modules. Here's a quick look at what each one does:

- **Auth** (`/api/auth`) — Registration, login, profile management
- **Projects** (`/api/projects`) — Create and manage student projects
- **Tasks** (`/api/tasks`) — Track tasks within projects
- **Sprints** (`/api/sprints`) — Sprint planning with burndown charts
- **Milestones** (`/api/milestones`) — Project milestones and submissions
- **Meetings** (`/api/meetings`) — Schedule meetings with Zoom links
- **Feedback** (`/api/feedback`) — Mentor feedback on projects
- **Evaluations** (`/api/evaluations`) — Rubric-based project grading
- **GitHub** (`/api/github`) — Repo linking, commits, PRs, analytics
- **AI** (`/api/ai`) — AI-powered project planning, chat, code review
- **Zoom** (`/api/zoom`) — Create and manage Zoom meetings
- **Notifications** (`/api/notifications`) — In-app notifications
- **Admin** (`/api/admin`) — User management, settings, backups
- **Audit** (`/api/audit`) — System activity logs
- **Mentors** (`/api/mentors`) — Mentor profiles and resumes

---

## Auth Routes

Base path: `/api/auth`

These routes handle user registration, login, and profile updates. No token is needed for register and login. Everything else requires authentication.

**POST /api/auth/register**

Creates a new user account. If the role is set to "Mentor", a mentor profile document is also created automatically.

Request body:
```json
{
  "name": "Harikesh Patel",
  "email": "harikeshpatel0105@gmail.com",
  "password": "123",
  "role": "Student",
  "collegeId": "CS2024001"
}
```
- `role` can be "Student", "Mentor", or "Admin"
- `collegeId` is optional

Response:
```json
{ "token": "eyJhbGciOiJIUzI1NiIs..." }
```

**POST /api/auth/login**

Authenticates the user and returns a JWT token. During maintenance mode, only admins can log in.

Request body:
```json
{
  "email": "hari@college.edu",
  "password": "mypassword123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "65a1b2c3d4e5f6", "name": "Hari Patel", "role": "Student" }
}
```

**GET /api/auth/me** — requires token

Returns the current logged-in user's info (password excluded).

**GET /api/auth/profile** — requires token

Same as `/me`, returns the profile of the authenticated user.

**PUT /api/auth/profile** — requires token

Updates profile fields. You only need to send the fields you want to change.

Request body (all fields optional):
```json
{
  "name": "Hari Patel",
  "bio": "Full stack developer",
  "skills": ["React", "Node.js", "MongoDB"],
  "experience": "2 years in web development",
  "education": "B.Tech CSE",
  "collegeId": "CS2024001",
  "expertise": ["Web Dev", "AI"],
  "availability": true,
  "company": "TechCorp",
  "linkedin": "https://linkedin.com/in/hari",
  "github": "https://github.com/hari"
}
```

Response: updated user object.

**PUT /api/auth/upload-photo** — requires token

Uploads a profile photo to Cloudinary. Send as `multipart/form-data` with the field name `photo`. Accepts jpg, png, jpeg. Max size is 5MB. Won't work if file storage is disabled in admin settings.

Response:
```json
{ "msg": "Photo uploaded successfully", "user": { "..." } }
```

---

## Project Routes

Base path: `/api/projects`

All project routes require authentication. What you see depends on your role — students see their own projects, mentors see projects they're assigned to, admins see everything.

**GET /api/projects** — requires token

Fetches projects based on your role:
- Students get projects where they're the creator or a team member
- Mentors get projects they're mentoring
- Admins get all projects

**GET /api/projects/available** — requires token (students only)

Shows projects created by admins that don't have a student yet. Used for the "join project" feature.

**GET /api/projects/:id** — requires token

Returns a single project with full details including creator info, team members, and mentor. Access is checked — you can only view projects you're part of (unless you're admin).

**POST /api/projects** — requires token

Creates a new project. Team members can be invited by email. If someone doesn't have an account yet, their email is stored so they can join later.

Request body:
```json
{
  "title": "Student Tracker App",
  "description": "A web app to track student projects",
  "teamMembers": ["abc@college.edu", "xyz@college.edu"],
  "mentor": "65a1b2c3d4e5f6",
  "startDate": "2024-01-15",
  "endDate": "2024-06-30",
  "githubRepo": "harikesh/student-tracker",
  "shouldCreateGithubRepo": true,
  "teamMembersGithub": [
    { "name": "Alice", "email": "alice@college.edu", "githubUsername": "alice-dev" }
  ],
  "teamSize": 4
}
```

The title gets auto-uppercased. After creation, invitation emails go out to team members in the background so the response comes back fast.

**PUT /api/projects/:id** — requires token

Updates project details. You can change the title, description, status, dates, github repo, or team size.

Status options: "Planning", "Active", "App Complete", "Completed"

---

## Task Routes

Base path: `/api/tasks`

Tasks belong to projects and optionally to milestones and sprints. The system has some smart features like auto-escalating priority when a deadline is close.

**GET /api/tasks/project/:projectId** — requires token

Gets all tasks for a project. If a task's deadline is within 24 hours and it's not done yet, the system automatically bumps its priority to "High".

**POST /api/tasks** — requires token

Creates a new task. If a milestone is specified, the task gets linked to it.

Request body:
```json
{
  "title": "Design login page",
  "description": "Create the login page with Google OAuth",
  "project": "65a1b2c3d4e5f6",
  "milestone": "65b2c3d4e5f6a7",
  "sprint": "65c3d4e5f6a7b8",
  "assignedTo": "student@college.edu",
  "deadline": "2024-02-01",
  "priority": "Medium",
  "storyPoints": 5
}
```

`assignedTo` can be either a user email or user ID. The system figures it out.

**PUT /api/tasks/:id/submit** — requires token (students only)

Submit completed work. Send as `multipart/form-data`. You can attach up to 5 screenshot images and a GitHub link.

Form fields:
- `githubLink` — link to the commit or PR
- `screenshots` — up to 5 image files

**PUT /api/tasks/:id/review** — requires token (mentors/admins only)

Approve or reject a student's task submission. When you approve a task, the system recalculates the milestone progress automatically.

Request body:
```json
{ "action": "approve" }
```

`action` is either "approve" or "reject".

**PUT /api/tasks/:id** — requires token

Updates a task. Students can update the status (Pending, In Progress, Completed). Mentors can update story points and sprint assignment. When a task is marked as Completed, the system checks if the associated milestone should auto-complete.

---

## Sprint Routes

Base path: `/api/sprints`

Sprints help organize work into time-boxed iterations. Each sprint belongs to a project.

**GET /api/sprints/project/:projectId** — requires token

Gets all sprints for a project, ordered by start date.

**POST /api/sprints** — requires token

Creates a new sprint.

Request body:
```json
{
  "name": "Sprint 1",
  "startDate": "2024-01-15",
  "endDate": "2024-01-29",
  "goal": "Complete user authentication module",
  "projectId": "65a1b2c3d4e5f6"
}
```

**PUT /api/sprints/:id/status** — requires token

Changes the sprint status. Options are "Planned", "Active", or "Completed".

Request body:
```json
{ "status": "Active" }
```

**GET /api/sprints/:id/burndown** — requires token

Returns burndown chart data showing ideal vs actual progress. The chart tracks story points of verified tasks over each day of the sprint.

Response:
```json
{
  "totalPoints": 50,
  "securedPoints": 30,
  "data": [
    { "date": "2024-01-15", "ideal": 0, "actual": 0 },
    { "date": "2024-01-16", "ideal": 7, "actual": 5 },
    { "date": "2024-01-17", "ideal": 14, "actual": 12 }
  ]
}
```

---

## Milestone Routes

Base path: `/api/milestones`

Milestones are major project checkpoints. They can have sub-milestones and linked tasks. Only mentors and admins can create or delete milestones, but students can submit work against them.

**GET /api/milestones/:projectId/with-submissions** — requires token

Gets milestones along with submission details — who submitted, when, approval status, etc.

**GET /api/milestones/:projectId** — requires token

Gets all milestones for a project (without submission details).

**POST /api/milestones** — requires token (mentor/admin only)

Creates a milestone. You can optionally generate sub-milestones by specifying `submilestoneCount`.

Request body:
```json
{
  "title": "Backend API Complete",
  "description": "All REST APIs should be working",
  "project": "65a1b2c3d4e5f6",
  "dueDate": "2024-03-01",
  "priority": "High",
  "submilestoneCount": 3
}
```

**PUT /api/milestones/:id** — requires token

This endpoint handles multiple actions depending on what you pass:

For student submissions:
```json
{
  "action": "submit",
  "submissionDescription": "Completed all API endpoints",
  "submissionGithubLink": "https://github.com/user/repo/commit/abc123"
}
```

For mentor approval:
```json
{
  "action": "approve",
  "approvalNotes": "Good work, all requirements met"
}
```

For mentor rejection:
```json
{
  "action": "reject",
  "approvalNotes": "Missing unit tests, please add and resubmit"
}
```

For general status update:
```json
{ "status": "In Progress" }
```

The system sends emails to students when their submission is approved or rejected.

**POST /api/milestones/:id/check-completion** — requires token

Checks if all tasks under a milestone are completed. If yes, the milestone is auto-completed and the project progress gets updated.

**GET /api/milestones/:id/checklist** — requires token

Returns the milestone along with its tasks and sub-milestones as a checklist view.

**DELETE /api/milestones/:id** — requires token (mentor/admin only)

Deletes a milestone.

---

## Meeting Routes

Base path: `/api/meetings`

Meetings are scheduled by mentors and linked to projects. The system handles email invitations and in-app notifications automatically.

**POST /api/meetings** — requires token (mentor only)

Creates a new meeting. All team members of the project get an email and a notification.

Request body:
```json
{
  "title": "Sprint 1 Review",
  "description": "Review progress on Sprint 1",
  "zoomMeetingLink": "https://zoom.us/j/123456789",
  "zoomMeetingId": "123456789",
  "projectId": "65a1b2c3d4e5f6",
  "scheduledDate": "2024-01-22T10:00:00Z",
  "duration": 60
}
```

**GET /api/meetings/project/:projectId** — requires token

Gets all meetings for a project. Past meetings that are still marked as "scheduled" get auto-archived to "completed".

**GET /api/meetings/user/history** — requires token

Gets all meetings the current user has been part of (as creator, mentor, or team member).

**POST /api/meetings/:meetingId/join** — requires token

Marks the user as "joined" for the meeting.

**PATCH /api/meetings/:meetingId/status** — requires token

Updates meeting status and optionally adds notes or a recording link.

Request body:
```json
{
  "status": "completed",
  "notes": "Discussed milestone progress. Action items assigned.",
  "recordingLink": "https://cloud.zoom.us/recording/..."
}
```

Status options: "scheduled", "ongoing", "completed", "cancelled"

**DELETE /api/meetings/:meetingId** — requires token (creator only)

Deletes a meeting. Only the person who created it can delete it.

**GET /api/meetings/:meetingId** — requires token

Gets details of a specific meeting.

---

## Feedback Routes

Base path: `/api/feedback`

Feedback is given by mentors and admins to students on their project work. Each feedback has a message and a rating.

**GET /api/feedback/project/:projectId** — requires token

Gets all feedback entries for a project.

**GET /api/feedback/user/:userId** — requires token

Gets all feedback received by a specific user across projects.

**POST /api/feedback** — requires token (mentor/admin only)

Creates feedback. You can send it to a specific student or broadcast it to the entire team by setting `to` to "all".

Request body (to one person):
```json
{
  "project": "65a1b2c3d4e5f6",
  "to": "65b2c3d4e5f6a7",
  "message": "Great progress on the API module. Keep it up!",
  "rating": 4
}
```

Request body (broadcast to all):
```json
{
  "project": "65a1b2c3d4e5f6",
  "to": "all",
  "message": "Good team effort this sprint",
  "rating": 5
}
```

Rating is 1-5, defaults to 5 if not provided. Feedback emails are sent to recipients automatically.

---

## Evaluation Routes

Base path: `/api/evaluations`

Evaluations let mentors grade projects using customizable rubrics. Each rubric has criteria with weights and max scores.

**POST /api/evaluations/rubrics** — requires token

Creates a rubric. It can be tied to a specific project or marked as global (available for all projects).

Request body:
```json
{
  "name": "Final Project Rubric",
  "criteria": [
    { "name": "Code Quality", "description": "Clean, readable code", "weight": 30, "maxScore": 10 },
    { "name": "Documentation", "description": "Clear docs and comments", "weight": 20, "maxScore": 10 },
    { "name": "Testing", "description": "Unit and integration tests", "weight": 25, "maxScore": 10 },
    { "name": "UI/UX", "description": "User interface design", "weight": 25, "maxScore": 10 }
  ],
  "projectId": "65a1b2c3d4e5f6",
  "isGlobal": false
}
```

**GET /api/evaluations/rubrics/project/:projectId** — requires token

Gets all rubrics available for a project (includes both project-specific and global rubrics).

**POST /api/evaluations** — requires token (mentor/admin only)

Submits an evaluation using a rubric. The system calculates a weighted total score.

Request body:
```json
{
  "projectId": "65a1b2c3d4e5f6",
  "rubricId": "65c3d4e5f6a7b8",
  "scores": {
    "Code Quality": 8,
    "Documentation": 7,
    "Testing": 9,
    "UI/UX": 6
  },
  "comments": "Solid work overall",
  "feedback": "Focus more on UI polish for the final submission"
}
```

**GET /api/evaluations/project/:projectId** — requires token

Gets all evaluations for a project, including who evaluated and which rubric was used.

---

## GitHub Routes

Base path: `/api/github`

These routes connect projects to GitHub repositories and pull in data like commits, contributors, branches, and PRs. All GitHub routes check if GitHub integration is enabled in admin settings first.

**POST /api/github/link-repo** — requires token

Links a GitHub repository to a project. Pass either a full URL or an "owner/repo" string.

Request body:
```json
{
  "repoUrl": "https://github.com/harikesh/student-tracker",
  "projectId": "65a1b2c3d4e5f6"
}
```

**GET /api/github/repo/:projectId** — requires token

Returns details of the linked repository (name, owner, description, stars, etc).

**GET /api/github/commits/:projectId** — requires token

Fetches recent commits. You can control how many with the `limit` query param (default 30).

Example: `GET /api/github/commits/65a1b2c3?limit=10`

**GET /api/github/contributors/:projectId** — requires token

Lists all contributors to the repo.

**GET /api/github/branches/:projectId** — requires token

Lists all branches.

**GET /api/github/pull-requests/:projectId** — requires token

Lists pull requests. Filter by state using the `state` query param (default "open").

Example: `GET /api/github/pull-requests/65a1b2c3?state=closed`

**GET /api/github/stats/:projectId** — requires token

Quick summary — total commits, contributors, and stars.

**GET /api/github/heatmap/:projectId** — requires token

Commit activity heatmap data (for visualizations).

**GET /api/github/contribution-stats/:projectId** — requires token

Per-contributor breakdown of commits and additions.

**GET /api/github/weekly-activity/:projectId** — requires token

Weekly commit activity for charting.

**GET /api/github/code-quality/:projectId** — requires token

Code quality metrics derived from the repository.

**GET /api/github/issue-stats/:projectId** — requires token

Count of open vs closed issues.

**GET /api/github/deployments/:projectId** — requires token

Deployment status info.

**GET /api/github/releases/:projectId** — requires token

Release history.

**GET /api/github/timeline/:projectId** — requires token

Activity timeline. Use `days` query param to set the range (default 30 days).

**GET /api/github/dashboard/:projectId** — requires token

Returns everything at once — heatmap, contributions, weekly activity, code quality, issues, deployments, releases, and timeline. Great for loading the dashboard in a single call.

**POST /api/github/send-invites** — requires token

Sends repository invitation emails to team members.

Request body:
```json
{
  "projectId": "65a1b2c3d4e5f6",
  "memberIds": ["65b2c3d4e5f6a7", "65c3d4e5f6a7b8"],
  "repoUrl": "https://github.com/harikesh/student-tracker"
}
```

**POST /api/github/send-github-invites** — requires token

Sends GitHub setup instructions to team members (usually happens during project creation).

**POST /api/github/sync-issues** — requires token

Syncs open GitHub issues into the project as tasks. Only creates tasks for new issues that don't already exist.

Request body:
```json
{ "projectId": "65a1b2c3d4e5f6" }
```

---

## AI Routes

Base path: `/api/ai`

Powered by Google Gemini. These routes provide AI-assisted features like project planning, code review, and a chat assistant.

**POST /api/ai/generate-project** — requires token

Generates a project plan based on a title and optional description. Useful for kickstarting new projects.

Request body:
```json
{
  "title": "E-commerce Platform",
  "description": "An online marketplace for local artisans"
}
```

**POST /api/ai/chat** — requires token

Chat with the built-in AI assistant (JARVIS). Supports conversation history for context-aware responses.

Request body:
```json
{
  "message": "How should I structure my React components for a dashboard?",
  "history": [
    { "role": "user", "content": "previous message" },
    { "role": "assistant", "content": "previous response" }
  ]
}
```

Response:
```json
{ "response": "For a dashboard, I'd recommend..." }
```

**POST /api/ai/system-health** — requires token (admin only)

Uses AI to analyze the current system health and provide insights. Pulls real metrics like CPU, memory, and disk usage.

**POST /api/ai/review-milestone** — requires token (mentor/admin only)

AI code review for a milestone submission. It fetches the code from GitHub and analyzes it.

Request body:
```json
{
  "milestoneId": "65b2c3d4e5f6a7",
  "githubLink": "https://github.com/harikesh/student-tracker"
}
```

**POST /api/ai/generate-report** — requires token

Generates a comprehensive project report with AI analysis. Pulls together project data, milestones, tasks, and feedback into a structured report.

Request body:
```json
{ "projectId": "65a1b2c3d4e5f6" }
```

---

## Zoom Routes

Base path: `/api/zoom`

Direct integration with the Zoom API for creating and managing meetings.

**POST /api/zoom/create-meeting** — requires token (mentor only)

Creates a Zoom meeting and sends invitation emails to all project team members.

Request body:
```json
{
  "title": "Sprint Planning Meeting",
  "startTime": "2024-01-22T10:00:00Z",
  "projectId": "65a1b2c3d4e5f6"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "zoomMeetingLink": "https://zoom.us/j/123456789",
    "meetingId": "123456789",
    "startTime": "2024-01-22T10:00:00Z",
    "duration": 60,
    "emailsSent": 4
  }
}
```

**GET /api/zoom/meeting/:meetingId** — requires token

Gets Zoom meeting details from the Zoom API.

**GET /api/zoom/meeting/:meetingId/participants** — requires token

Lists who joined the Zoom meeting.

**POST /api/zoom/meeting/:meetingId/registrant** — requires token

Registers someone for a Zoom meeting.

Request body:
```json
{
  "firstName": "Hari",
  "lastName": "Patel",
  "email": "hari@college.edu"
}
```

**DELETE /api/zoom/meeting/:meetingId** — requires token (mentor only)

Deletes a Zoom meeting.

---

## Notification Routes

Base path: `/api/notifications`

In-app notifications for events like meetings, feedback, and task assignments. Each notification has a type, title, and message.

**GET /api/notifications** — requires token

Gets the latest 50 notifications for the current user, newest first.

**PATCH /api/notifications/:notificationId/read** — requires token

Marks a single notification as read.

**PATCH /api/notifications/mark-all/read** — requires token

Marks all of the user's notifications as read at once.

**GET /api/notifications/unread/count** — requires token

Returns just the unread count. Useful for badge displays.

Response:
```json
{ "unreadCount": 7 }
```

**DELETE /api/notifications/:notificationId** — requires token

Deletes a notification. Only the recipient can delete it.

Notification types that the system generates:
- `meeting_created` — when a mentor schedules a meeting
- `meeting_joined` — when someone joins a meeting
- `meeting_started` — when a meeting begins
- `feedback_received` — when feedback is given
- `task_assigned` — when a task is assigned
- `milestone_reviewed` — when a milestone is approved or rejected

---

## Admin Routes

Base path: `/api/admin`

All admin routes require both authentication and the Admin role. These handle system-wide management.

### User Management

**GET /api/admin/users** — gets all users (passwords excluded)

**PUT /api/admin/users/:id/role** — changes a user's role
```json
{ "role": "Mentor" }
```

**PUT /api/admin/users/:id** — updates user details (name, email, role, bio)

**DELETE /api/admin/users/:id** — deletes a user account

**PUT /api/admin/users/:id/change-password** — resets a user's password
```json
{ "password": "newpassword123" }
```

### Project Management

**GET /api/admin/projects** — gets all projects with populated details

**DELETE /api/admin/projects/:id** — deletes a project and all its associated tasks

### Analytics

**GET /api/admin/analytics** — returns comprehensive system analytics

The response includes:
- Overview stats (total users, projects, tasks, completion rates)
- User role distribution
- Project status distribution
- Top mentors by project count
- Monthly project and user growth trends
- Recent activity counts

### System Settings

**GET /api/admin/settings** — gets current system settings

**PUT /api/admin/settings** — updates system settings

Available settings:

```json
{
  "maintenanceMode": false,
  "allowRegistration": true,
  "emailNotifications": true,
  "backupFrequency": "daily",
  "logRetention": 30,
  "sessionTimeout": 60,
  "maxFileUploadSize": 10,
  "rateLimiting": 100,
  "cacheExpiration": 24,
  "services": {
    "apiServer": true,
    "database": true,
    "emailService": true,
    "fileStorage": true,
    "githubIntegration": true
  }
}
```

- `backupFrequency` options: "hourly", "daily", "weekly", "monthly"
- `logRetention` is in days
- `sessionTimeout` is in minutes
- `maxFileUploadSize` is in MB
- `rateLimiting` is requests per rate window
- `cacheExpiration` is in hours

### Backup Management

**POST /api/admin/backup/trigger** — triggers a manual database backup

**GET /api/admin/backups** — lists all available backup files

**GET /api/admin/backup/download/:filename** — downloads a specific backup file

**DELETE /api/admin/backup/:filename** — deletes a backup file

### System Monitoring

**GET /api/admin/health** — checks system health (memory usage, uptime, service status)

Response:
```json
{
  "status": "healthy",
  "uptime": 3600,
  "memory": { "used": 50, "total": 200, "percentage": 25 },
  "services": { "apiServer": true, "database": true },
  "lastCheck": "2024-01-15T10:00:00Z"
}
```

**GET /api/admin/logs** — retrieves system logs

**POST /api/admin/logs/clear** — clears all system logs

**GET /api/admin/alerts** — gets security-related events from the last 24 hours (failed logins, deletions, permission denials)

---

## Audit Routes

Base path: `/api/audit`

**GET /api/audit** — requires token (admin only)

Returns the last 100 audit log entries. Each entry records who did what and when.

Things that get logged: user login, failed logins, project creation/deletion, sprint operations, rubric creation, evaluations, role changes, permission denied events, and backup operations.

---

## Mentor Routes

Base path: `/api/mentors`

**GET /api/mentors** — requires token

Gets all mentor profiles with their user info, expertise, and availability status.

**PUT /api/mentors/upload-resume** — requires token

Uploads a mentor's resume to Cloudinary. Send as `multipart/form-data` with field name `resume`.

Response:
```json
{ "msg": "Resume uploaded", "resume": "https://res.cloudinary.com/..." }
```

---

## Middleware

The app uses several middleware functions:

- **auth** — validates the JWT token from the `x-auth-token` header
- **adminAuth** — checks that the authenticated user has the Admin role
- **mentorOrAdmin** — allows access for Mentors and Admins
- **mentorOnly** — restricts access to Mentors only
- **checkFileStorageEnabled** — blocks file uploads if storage is turned off in settings
- **checkGitHubEnabled** — blocks GitHub operations if integration is disabled
- **cacheService.middleware(ttl)** — caches GET responses for the specified duration

## Route Caching

Some routes have response caching enabled to improve performance:

- `/api/tasks` — cached for 60 seconds
- `/api/feedback` — cached for 5 minutes (doesn't change often)
- `/api/mentors` — cached for 5 minutes
- `/api/milestones` — cached for 60 seconds
- `/api/projects` — no cache (data is user-specific, caching would leak data between users)
- `/api/meetings`, `/api/notifications` — no cache (needs to be real-time)
- `/api/github`, `/api/zoom`, `/api/ai` — no cache (external API calls or dynamic content)

## Error Handling

All error responses follow this format:

```json
{ "msg": "Description of what went wrong" }
```

Common status codes:
- **200** — everything worked
- **201** — resource was created
- **400** — something wrong with your request (missing fields, invalid data)
- **401** — you're not authenticated (missing or invalid token)
- **403** — you don't have permission (wrong role)
- **404** — the thing you're looking for doesn't exist
- **500** — something broke on our end
- **503** — service is temporarily unavailable (maintenance mode or disabled feature)
