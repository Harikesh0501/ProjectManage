# Deployment Guide

This covers how we deploy the Student Project Tracker. Frontend is hosted on Vercel, backend on Render — both free tier.

## What you need before starting

- GitHub repo with the code pushed
- MongoDB Atlas cluster (free M0 works fine)
- Cloudinary account
- Gmail with App Password (not your regular password)
- Optional: GitHub token, Zoom credentials, Gemini API key

## Database Setup (MongoDB Atlas)

Go to [mongodb.com/atlas](https://www.mongodb.com/atlas), create an account, spin up a free M0 cluster.

Once the cluster is ready:
1. Create a database user under Database Access — pick a username and password
2. Under Network Access, whitelist `0.0.0.0/0` (this lets Render connect to it)
3. Hit Connect on your cluster, grab the connection string
4. Swap out `<password>` with the password you just set

It'll look something like:
```
mongodb+srv://myuser:mypass@cluster0.abc123.mongodb.net/studenttracker?retryWrites=true&w=majority
```

## Cloudinary

Sign up at [cloudinary.com](https://cloudinary.com). From the dashboard you'll see three things you need: Cloud Name, API Key, API Secret. Copy them somewhere — you'll need them for the backend env variables.

We use Cloudinary for profile photos, task screenshots, and mentor resumes.

## Gmail App Password

Regular Gmail passwords won't work with Nodemailer. You need an App Password.

Go to your Google Account settings → Security → 2-Step Verification (enable it if you haven't) → App Passwords. Create one for "Mail". You'll get a 16-character password like `defp hssw ngrf rbog`. That's what goes into the `EMAIL_PASSWORD` env var.

## Deploying the Backend (Render)

1. Go to [render.com](https://render.com), sign in with GitHub
2. New → Web Service → Connect your repo
3. Fill in the settings:

| Field | What to put |
|:------|:------------|
| Name | whatever you want |
| Branch | main |
| Root Directory | server |
| Runtime | Node |
| Build Command | npm install |
| Start Command | node server.js |
| Plan | Free |

4. Add environment variables (see the full list below)
5. Hit Create Web Service
6. Wait for it to build — takes a few minutes
7. Copy the URL it gives you (you'll need it for the frontend)

One thing to know: free Render instances go to sleep after 15 minutes of no traffic. First request after that takes about 30-50 seconds to wake up. That's just how the free tier works.

## Deploying the Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com), sign in with GitHub
2. Add New → Project → Import your repo
3. Settings:

| Field | What to put |
|:------|:------------|
| Framework | Vite |
| Root Directory | client |
| Build Command | npm run build |
| Output Directory | dist |

4. Add one environment variable:
```
VITE_API_URL=https://your-render-url.onrender.com/api
```

5. Deploy

The `vercel.json` we have in the client folder handles routing — it redirects everything to `index.html` so React Router works properly on Vercel. That's already set up, you don't need to touch it.

## All the Environment Variables

These go into Render (backend). The frontend only needs `VITE_API_URL`.

**Required — app won't work without these:**

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=some_random_string_make_it_long
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
NODE_ENV=production
```

**Optional — features won't work without these but the app still runs:**

```env
# GitHub integration
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_CLIENT_ID=your_oauth_client_id
GITHUB_CLIENT_SECRET=your_oauth_client_secret

# Zoom meetings
ZOOM_ACCOUNT_ID=your_account_id
ZOOM_CLIENT_ID=your_client_id
ZOOM_CLIENT_SECRET=your_client_secret
ZOOM_SECRET_TOKEN=your_secret_token
USE_MOCK_MODE=false

# AI features (Gemini)
GEMINI_API_KEY=your_gemini_key

# Email display name
EMAIL_FROM=noreply@yourapp.com
```

## Running Locally

Two terminals:

```bash
# Terminal 1 — backend (port 5000)
cd server
npm install
npm run dev
```

```bash
# Terminal 2 — frontend (port 5173)
cd client
npm install
npm run dev
```

Or just run `npm run dev` from the root — it uses concurrently to start both.

Make sure you have a `.env` file inside the `server/` folder with at least the required variables.

## Troubleshooting

**Can't connect to MongoDB from Render**
You probably forgot to whitelist all IPs. Go to MongoDB Atlas → Network Access → Add `0.0.0.0/0`.

**Frontend loads but API calls fail**
Check the `VITE_API_URL` in Vercel. Should be your Render URL ending with `/api`. No trailing slash.

**Photos/files won't upload**
Double check the Cloudinary credentials. Also make sure file storage is turned on in the admin settings panel.

**Emails not going out**
You need a Gmail App Password, not your normal password. Also check that email notifications are enabled in admin settings.

**First load is slow**
That's the free Render tier waking up. Nothing you can do about it without upgrading.

## Updating

Just push to `main`. Both Vercel and Render auto-deploy from GitHub.
