# GuardXLens Vercel Deployment Guide

Follow these steps to host your MERN-stack exam proctoring platform on Vercel for free.

## 1. Prerequisites
- A [GitHub](https://github.com/) account.
- A [Vercel](https://vercel.com/) account (sign up with GitHub).
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (for the free database).
- A [Google Gemini API Key](https://aistudio.google.com/app/apikey) (for AI features).

## 2. Prepare Your Repository
1. Push your local project to a new private GitHub repository.
2. Ensure `vercel.json` exists in the root directory.

## 3. Deployment on Vercel
1. Log in to Vercel and click **"Add New"** > **"Project"**.
2. Import your GitHub repository.
3. **Configure Project Settings**:
   - **Framework Preset**: Other (Vercel will detect the settings from `vercel.json`).
   - **Root Directory**: `.` (Keep as default).

## 4. Environment Variables
In the Vercel project dashboard, go to **Settings > Environment Variables** and add the following:

| Variable | Value |
| :--- | :--- |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string for security |
| `GEMINI_API_KEY` | Your Google Gemini API Key |
| `EMAIL_USER` | Your email (e.g., Gmail) |
| `EMAIL_PASS` | Your App Password (not your regular password) |
| `NODE_ENV` | `production` |
| `VITE_API_URL` | Leave empty (defaults to `/api` in production) |

## 5. Build and Deploy
1. Click **Deploy**.
2. Vercel will build your React frontend and set up your Node.js backend as serverless functions.
3. Once finished, you will get a production URL (e.g., `guardxlens.vercel.app`).

## 6. Post-Deployment
- Access your domain! The first institution account is automatically created by the system.
- Log in and start creating exams.

> [!TIP]
> If you encounter issues with "Cold Starts" (initial delay on first load), this is normal for free-tier serverless functions. Vercel is much faster than Render in this regard.
