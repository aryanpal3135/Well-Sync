# 🚀 WellSync Deployment Guide (Render + MongoDB Atlas)

This guide provides step-by-step instructions to deploy your **WellSync** backend and database to fulfill Assessment 2 Guidelines:
- **Guideline 3:** *Backend Deployment: Deploy your backend and ensure that all required APIs are working properly.*
- **Guideline 5:** *Frontend Integration: Replace the local backend URL with the deployed API URL and use MongoDB for data storage.*

---

## 🍃 Step 1: MongoDB Atlas Database Setup (Free M0 Cluster)

1. Log into your [MongoDB Atlas](https://cloud.mongodb.com/) dashboard.
2. Ensure your Database User is created:
   - Go to **Security** → **Database Access**.
   - Verify your user (e.g., `firstuUser`) has **Read and write to any database** privileges.
3. Enable Network Access from Anywhere:
   - Go to **Security** → **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`).
   - Click **Confirm**. *(This allows your Render cloud server to connect to MongoDB).*
4. Copy your Connection String:
   ```text
   mongodb+srv://firstuUser:1234@cluster0.2ckks8t.mongodb.net/wellsync?retryWrites=true&w=majority
   ```

---

## 🐙 Step 2: Push Changes to Your GitHub Repository

Guideline 6 & 7: *"Continue using the same GitHub repository link. Ensure both frontend and backend folders are present."*

In your terminal / PowerShell at project root:
```bash
git add .
git commit -m "Assessment 2: Added MVC Node/Express backend, MongoDB models, JWT auth, and Postman tests"
git push origin main
```

---

## ☁️ Step 3: Deploy Backend on Render (Free Web Service)

1. Go to [render.com](https://render.com) and click **Sign In** (use your GitHub account).
2. On your Render Dashboard, click **New +** → **Web Service**.
3. Select **"Build and deploy from a Git repository"** and choose your `WellSync` repository.
4. Configure the Web Service settings:
   - **Name:** `wellsync-backend` *(or any unique name, e.g. `wellsync-ayush`)*
   - **Region:** Singapore / Oregon / Frankfurt *(choose nearest)*
   - **Branch:** `main`
   - **Root Directory:** `backend` *(crucial!)*
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
5. Add **Environment Variables** (click *Advanced* or *Environment*):
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGO_URI` | `mongodb+srv://firstuUser:1234@cluster0.2ckks8t.mongodb.net/wellsync?retryWrites=true&w=majority` |
   | `JWT_SECRET` | `wellsync_secret_jwt_auth_key_2026_aiml_chitkara` |
   | `JWT_EXPIRE` | `7d` |
6. Click **Create Web Service**.
7. Wait 2–3 minutes for the build to finish. Render will generate a live URL, for example:
   ```text
   https://wellsync-backend.onrender.com
   ```

---

## 🔗 Step 4: Test Live Deployed Health Endpoint

Open your browser or Postman and visit:
```text
https://wellsync-backend.onrender.com/api/health
```
You should see:
```json
{
  "success": true,
  "message": "🌿 WellSync Backend API is running smoothly",
  "timestamp": "2026-10-25T...",
  "environment": "production",
  "version": "1.0.0"
}
```

---

## 🎯 Step 5: Connect Frontend to Deployed Backend URL

Open `frontend/js/apiConfig.js` and paste your deployed Render URL into `DEPLOYED_URL`:
```javascript
const API_CONFIG = {
  LOCAL_URL: 'http://localhost:5000/api',

  // Paste your live Render URL here:
  DEPLOYED_URL: 'https://wellsync-backend.onrender.com/api',
  ...
};
```
Commit and push this change to GitHub.

> **💡 Bonus Feature:** Because our Express server also serves the static frontend (`express.static(frontendPath)`), you can also simply visit:
> `https://wellsync-backend.onrender.com/`
> and your entire full-stack application will load and work seamlessly in production!

---

## 🧪 Step 6: Test Deployed APIs with Postman / Thunder Client

1. In Postman, open the collection:
   `postman/WellSync.postman_collection.json`
2. Change the collection variable `baseUrl` from `http://localhost:5000` to:
   `https://wellsync-backend.onrender.com`
3. Run the requests:
   - `01. Health Check` -> **200 OK**
   - `02. Register User` -> **201 Created**
   - `02. Login User` -> **200 OK** (automatically updates `token` variable)
   - `03. Create Profile` -> **201 Created**
   - `04. Log Health Metrics` -> **201 Created**
4. Take a screenshot of Postman with green 200/201 responses to show the evaluation panel!
