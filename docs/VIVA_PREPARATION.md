# 🎓 WellSync Viva Preparation & Code Defense Guide
### Subject: Back End Engineering (Course Code: 24CAI0303)
### Department of Computer Science & Engineering (AI & ML) – Chitkara University

This guide is specifically designed to prepare you for your **Assessment 2 Project Viva & Evaluation**. It covers the theoretical concepts taught in class (Lectures 25–48) and explains exactly how they are implemented in the **WellSync** codebase.

---

## 🏛️ 1. Architecture of WellSync Backend

### Q1: What architectural pattern does your backend follow?
**Answer:**
WellSync strictly follows the **MVC (Model-View-Controller)** architectural pattern:
- **Models (`backend/models/`)**: Represent the data schemas and business rules using **Mongoose ODM** (`User.js`, `Profile.js`, `HealthLog.js`, `CycleLog.js`, `Recommendation.js`).
- **Controllers (`backend/controllers/`)**: Contain the core business logic, query the database, handle errors, and return JSON view responses (`authController.js`, `profileController.js`, `logController.js`, `cycleController.js`, etc.).
- **Views**: In a modern REST API architecture, the Controllers return structured JSON views (`{ success: true, data: ... }`), which are rendered by our client frontend (HTML/CSS/JS) or Postman. Additionally, Express serves the static frontend pages.
- **Routes (`backend/routes/`)**: Map incoming HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) and URIs to specific controller methods.

---

## ⚡ 2. Node.js Core Concepts (Lectures 31–36)

### Q2: What is Node.js, and why is it single-threaded yet non-blocking?
**Answer:**
- Node.js is an open-source, cross-platform JavaScript runtime environment built on Google Chrome's **V8 engine**.
- It operates on a **Single-Threaded Event Loop** model.
- It achieves **non-blocking asynchronous I/O** by offloading heavy system operations (file system I/O, network requests, database queries) to **libuv** and its underlying thread pool.
- When an asynchronous task completes, its callback or promise is pushed to the **Callback / Task Queue**, which the Event Loop pushes back to the Call Stack once the stack is clear.

### Q3: What is the Event Loop?
**Answer:**
The Event Loop continuously monitors the **Call Stack** and the **Callback/Task Queue**. If the Call Stack is empty, it dequeues the first pending callback from the queue and pushes it onto the Call Stack for execution. It has specific phases:
1. Timers (`setTimeout`, `setInterval`)
2. Pending callbacks (I/O callbacks)
3. Idle, prepare
4. Poll (retrieves new I/O events)
5. Check (`setImmediate`)
6. Close callbacks (`socket.on('close')`)

---

## 🚂 3. Express.js & Middleware (Lectures 37–40)

### Q4: What is Middleware in Express.js? How does `next()` work?
**Answer:**
- A middleware is a function that has access to the Request object (`req`), the Response object (`res`), and the `next` function in the application's request-response cycle.
- In WellSync, we use:
  1. **Built-in middleware**: `express.json()` to parse JSON request bodies.
  2. **Third-party middleware**: `cors()` to enable cross-origin requests, `morgan()` for request logging.
  3. **Custom middleware**:
     - `authMiddleware.js` (`protect`): Verifies JWT Bearer tokens before accessing private routes.
     - `errorMiddleware.js` (`errorHandler`): Centralized error-handling middleware that catches all unhandled exceptions and formats them as standard JSON.
     - `uploadMiddleware.js`: Multer disk-storage engine for file uploads.
- The `next()` function passes execution control to the next middleware in the pipeline. If `next()` is not called, the request hangs unless a response (`res.send()` / `res.json()`) is returned.

### Q5: How do you handle file uploads in Express?
**Answer:**
We use the **Multer** library (`multer`). Express cannot parse `multipart/form-data` natively.
1. We configure `multer.diskStorage` specifying destination (`backend/uploads/`) and a collision-free filename using timestamp: `avatar-${Date.now()}-${random}.ext`.
2. We apply a `fileFilter` to validate MIME types and file extensions (only allowing jpeg, png, webp, svg).
3. The uploaded file is accessible via `req.file` in `uploadController.js`.

---

## 🔐 4. Authentication, Security & JWT (Lectures 38–39)

### Q6: How does JWT authentication work in WellSync?
**Answer:**
1. When a user registers or logs in with their email and password:
   - The server validates credentials.
   - If valid, the server signs a **JSON Web Token (JWT)** using `jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })`.
2. The client receives the token and stores it in `localStorage` under `wellsync_jwt_token`.
3. For protected endpoints (e.g. `/api/profiles`, `/api/logs`), the client attaches the token in the HTTP header:
   ```text
   Authorization: Bearer <jwt_token>
   ```
4. Our `authMiddleware` intercepts the request:
   - Extracts the token from the header.
   - Verifies the signature using `jwt.verify(token, JWT_SECRET)`.
   - Fetches the user from MongoDB and attaches `req.user` to the request object.

### Q7: What are the three parts of a JWT?
**Answer:**
A JWT string consists of 3 Base64URL-encoded parts separated by dots (`.`):
1. **Header**: Contains the token type (`JWT`) and hashing algorithm (e.g., `HS256`).
2. **Payload**: Contains claims and user information (e.g., `id`, `iat`, `exp`).
3. **Signature**: Generated by hashing `Base64(Header) + "." + Base64(Payload)` using the secret key (`JWT_SECRET`). It prevents tampering.

### Q8: How is password security handled?
**Answer:**
- We NEVER store passwords in plain text.
- We use **bcryptjs** with a salt round of `10`.
- In our Mongoose `User.js` model, a `pre('save')` hook hashes the password before storing it.
- During login, `user.matchPassword(enteredPassword)` compares the hashed password with the plaintext candidate using `bcrypt.compare`.

---

## 🍃 5. MongoDB & Mongoose ODM (Lectures 41, 55–58)

### Q9: What is the difference between SQL and NoSQL (MongoDB)?
**Answer:**
- **SQL (Relational)**: Uses tables with fixed schemas, columns, rows, and foreign-key relational joins (`JOIN`).
- **MongoDB (NoSQL Document Store)**: Stores data in flexible, schema-less **BSON** (Binary JSON) documents organized into **Collections**. It scales horizontally and supports hierarchical nested documents and arrays (e.g. `allergies: [String]`, `conditions: [String]`).

### Q10: What is Mongoose and why do we use it?
**Answer:**
Mongoose is an **Object Data Modeling (ODM)** library for MongoDB in Node.js. It provides:
1. **Strict Schema Definitions**: Validates types, required fields, and default values.
2. **Built-in Validation**: Ensures email regex, minimum password lengths, and numeric limits (e.g., water intake, height/weight).
3. **Middleware / Hooks**: `pre('save')` hooks (e.g. auto-hashing passwords in `User.js` and auto-calculating BMI in `Profile.js`).
4. **Data References (`ObjectId`)**: Using `ref: 'User'` or `ref: 'Profile'` to link relational documents.

---

## 🌐 6. REST API Design & HTTP Protocols

### Q11: What makes an API "RESTful"?
**Answer:**
1. **Stateless**: Every HTTP request contains all information needed to process it; the server maintains no client session state in memory.
2. **Client-Server Architecture**: Separation of client concerns (HTML/CSS/JS frontend) and data/business logic concerns (Express/MongoDB backend).
3. **Standard HTTP Verbs**:
   - `GET`: Retrieve a resource (idempotent, safe).
   - `POST`: Create a new resource.
   - `PUT`: Update/replace an existing resource.
   - `DELETE`: Remove a resource.
4. **Standard HTTP Status Codes**:
   - `200 OK`: Successful retrieval or update.
   - `201 Created`: Resource successfully created (User, Profile, Log).
   - `400 Bad Request`: Missing required fields or validation failure.
   - `401 Unauthorized`: Missing or invalid JWT token.
   - `404 Not Found`: Resource does not exist.
   - `500 Internal Server Error`: Unhandled server exception.

---

## 🎯 7. Live Code Defense Checklist

Be ready to open and show the examiner these specific files in VS Code:
1. `backend/server.js`: Show CORS, express.json, static serving, and route mounting.
2. `backend/models/User.js`: Point out the bcrypt `pre('save')` hook and `select: false`.
3. `backend/middleware/authMiddleware.js`: Explain the `Bearer token` extraction and `jwt.verify`.
4. `backend/middleware/errorMiddleware.js`: Show how Mongoose duplicate key (`code 11000`) and cast errors are caught.
5. `backend/controllers/profileController.js`: Show how cascade deletion works (`deleteMany` on HealthLog and CycleLog).
6. `postman/WellSync.postman_collection.json`: Run a test request in Postman/Thunder Client and show the 200/201 response.
