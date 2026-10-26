# 🌿 WellSync – Family Healthcare & Wellness Recommendation System

> **Academic Project Submission**  
> **Course:** Back End Engineering (24CAI0303)  
> **Department:** Computer Science & Engineering (AI & ML) — 5th Semester  
> **Institution:** Chitkara University  
> **Evaluation Phase:** Continuous Assessment 2 (Full-Stack MERN Architecture)

---

## 📖 Overview

**WellSync** is a full-stack, family-focused healthcare and wellness recommendation system designed to empower users to manage their family's health and lifestyle decisions. 

Following the completion of the Frontend in Assessment 1, **Assessment 2** introduces a complete, production-ready backend built with **Node.js**, **Express.js**, and **MongoDB Atlas**, structured strictly using the **MVC (Model-View-Controller)** architecture.

---

## ✨ Features

- 🔐 **JWT Authentication & Security** — User signup/login with `bcryptjs` password hashing and protected API routes.
- 👨‍👩‍👧‍👦 **Family Profile Management** — Dynamic CRUD management for self and family members with automatic BMI calculation.
- 📊 **Daily Health Logging & Stats** — Track water intake, sleep hours, workout minutes, calories burned, and mood.
- 🌸 **Menstrual Health Tracking** — Log cycle dates, duration, symptoms, and get phase-specific wellness guidance.
- 🥗 **Personalized Wellness Recommendations** — Algorithmic diet, exercise, and yoga recommendations tailored to user age, gender, BMI, and goals.
- 📁 **Multer File Uploads** — Profile avatar and image upload endpoint with MIME type validation.
- 🧪 **API Testing Collections** — Complete **Postman** and **Thunder Client** collections with automated token capture.
- 🚀 **Cloud Deployment Ready** — Ready for one-click deployment on **Render** / **Railway** with MongoDB Atlas.

---

## 🏗️ Project Architecture & Directory Structure

```text
WellSync/
├── frontend/                          # Client-side web interface
│   ├── index.html                     # Landing page
│   ├── login.html                     # User authentication
│   ├── signup.html                    # Account registration
│   ├── dashboard.html                 # Personalized wellness dashboard
│   ├── profile.html                   # Family profile manager
│   ├── progress.html                  # Progress analytics & logs
│   ├── recommendations.html           # Food, exercise & yoga suggestions
│   ├── menstrual.html                 # Menstrual cycle tracker
│   ├── css/                           # Stylesheets (style, auth, dashboard, responsive)
│   ├── js/
│   │   ├── apiConfig.js               # Toggle between localhost and deployed URL
│   │   ├── api.js                     # REST API client with JWT interceptor
│   │   ├── auth.js                    # Auth methods and session management
│   │   ├── storage.js                 # API-first storage with MongoDB sync
│   │   ├── dashboard.js               # Dashboard metrics and greeting
│   │   ├── profile.js                 # Profile form handling
│   │   ├── progress.js                # Health log charting
│   │   ├── menstrual.js               # Cycle phase calculations
│   │   └── recommendationEngine.js   # Rule-based wellness recommendations
│   └── data/                          # Recommendation datasets (foods, exercises, yoga)
│
├── backend/                           # Node.js & Express.js REST API (MVC)
│   ├── config/
│   │   └── db.js                      # MongoDB Atlas Mongoose connection
│   ├── models/                        # Mongoose Schemas (M in MVC)
│   │   ├── User.js                    # User schema with bcrypt hooks
│   │   ├── Profile.js                 # Family profile schema & BMI calculation
│   │   ├── HealthLog.js               # Daily wellness logs
│   │   ├── CycleLog.js                # Menstrual cycle logs
│   │   └── Recommendation.js          # Wellness items schema
│   ├── controllers/                   # Controller Logic (C in MVC)
│   │   ├── authController.js          # Auth, registration, login, profile updates
│   │   ├── profileController.js       # Profile CRUD & cascade deletion
│   │   ├── logController.js           # Health logging & statistics
│   │   ├── cycleController.js         # Menstrual cycle logging & updates
│   │   ├── recommendationController.js# Algorithmic plan & item queries
│   │   └── uploadController.js        # Multer image upload
│   ├── routes/                        # Express API Routes
│   │   ├── authRoutes.js              # /api/auth
│   │   ├── profileRoutes.js           # /api/profiles
│   │   ├── logRoutes.js               # /api/logs
│   │   ├── cycleRoutes.js             # /api/cycle
│   │   ├── recommendationRoutes.js    # /api/recommendations
│   │   └── uploadRoutes.js            # /api/upload
│   ├── middleware/                    # Express Middlewares
│   │   ├── authMiddleware.js          # JWT protection
│   │   ├── errorMiddleware.js         # Centralized error handling
│   │   └── uploadMiddleware.js        # Multer disk storage
│   ├── uploads/                       # Uploaded avatars destination
│   ├── server.js                      # Express server entry point
│   ├── seed.js                        # Database population script
│   ├── test-api.js                    # Automated CLI test suite
│   ├── package.json                   # Dependencies
│   └── .env.example                   # Environment variable template
│
├── postman/                           # API testing collections
│   └── WellSync.postman_collection.json
│
├── thunder-client/                    # Thunder Client for VS Code
│   └── thunder-collection_WellSync.json
│
├── docs/                              # Project documentation
│   ├── DEPLOYMENT_GUIDE.md            # Step-by-step Render + Atlas deployment
│   └── VIVA_PREPARATION.md            # 5th sem syllabus Viva Q&A cheat sheet
│
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Fetch API
- **Backend Runtime:** Node.js (v18+)
- **Backend Framework:** Express.js (v4.19+)
- **Database:** MongoDB Atlas (Cloud NoSQL)
- **Object Data Modeling:** Mongoose (v8.3+)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **File Upload:** `multer`
- **API Testing:** Postman, Thunder Client

---

## 🚀 How to Run Locally

### 1. Install Backend Dependencies
Open your terminal in the `backend` folder:
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create or verify `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/wellsync?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
```

### 3. Seed Database (Optional)
Populate MongoDB Atlas with food, exercise, and yoga recommendations:
```bash
npm run seed
```

### 4. Start Server
```bash
npm start
# OR with auto-reload:
npm run dev
```
The server will start at `http://localhost:5000` and also serve the frontend directly!

### 5. Run Automated API Tests
```bash
npm test
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Service health status check | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login user & receive JWT token | No |
| `GET` | `/api/auth/me` | Get currently logged-in user profile | **Yes (Bearer)** |
| `GET` | `/api/profiles` | Get all family profiles for user | **Yes (Bearer)** |
| `POST` | `/api/profiles` | Create new family profile | **Yes (Bearer)** |
| `GET` | `/api/profiles/:id` | Get specific profile by ID | **Yes (Bearer)** |
| `PUT` | `/api/profiles/:id` | Update profile information | **Yes (Bearer)** |
| `DELETE` | `/api/profiles/:id` | Delete profile and cascaded logs | **Yes (Bearer)** |
| `GET` | `/api/logs` | Retrieve daily health logs | **Yes (Bearer)** |
| `POST` | `/api/logs` | Log daily wellness metrics | **Yes (Bearer)** |
| `GET` | `/api/logs/stats` | Get 7-day average health metrics | **Yes (Bearer)** |
| `GET` | `/api/cycle` | Get menstrual cycle records | **Yes (Bearer)** |
| `POST` | `/api/cycle` | Record new menstrual cycle period | **Yes (Bearer)** |
| `GET` | `/api/recommendations/foods` | Fetch nutritional food recommendations | No |
| `GET` | `/api/recommendations/exercises` | Fetch exercise routines | No |
| `GET` | `/api/recommendations/yoga` | Fetch yoga practices | No |
| `POST` | `/api/recommendations/plan` | Generate personalized algorithmic plan | **Yes (Bearer)** |
| `POST` | `/api/upload` | Upload avatar/file using Multer | **Yes (Bearer)** |

---

## 🧪 Testing with Postman & Thunder Client

1. **Postman**: Import `postman/WellSync.postman_collection.json`. When you run `Login User`, the response test script automatically captures the JWT token and applies it to subsequent protected requests.
2. **Thunder Client**: Open VS Code → Thunder Client extension → Collections → Import `thunder-client/thunder-collection_WellSync.json`.

---



## ⚠️ Disclaimer

*WellSync is an educational, project-based wellness platform. Its recommendations are for general lifestyle and educational purposes and do not substitute for professional medical advice, diagnosis, or treatment.*
