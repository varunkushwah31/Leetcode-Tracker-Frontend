

# 🚀 LeetCode Tracker LMS

A robust, two-sided Learning Management System designed for educators and students to seamlessly track LeetCode progress, manage classroom assignments, and view dynamic leaderboards.

This platform automates the tracking of coding assignments by integrating directly with LeetCode APIs, eliminating manual grading while providing a gamified experience for students.

---

## ✨ Features

* **Role-Based Access Control**
  Distinct dashboards and permissions for Super Admins, Mentors, and Students.

* **Enterprise Security**
  Stateless JWT authentication with short-lived access tokens and secure HTTP-only refresh tokens.

* **Automated LeetCode & Codeforces Sync**
  Fetches solved problems, contest ratings, badges, and submissions instantly.

* **Classroom Management**
  Mentors can create classrooms, enroll students, and assign problems with deadlines.

* **Dynamic Leaderboards**
  Real-time rankings based on streaks, ratings, and assignments.

* **Submission Validation**
  Regex + API-based verification to ensure genuine submissions.

---

## 🛠 Tech Stack

### Backend

* Java 17+
* Spring Boot 3
* Spring Security (JWT)
* MongoDB (Spring Data MongoDB)
* Maven

### Frontend

* React 18
* TypeScript
* Vite (SWC)
* Tailwind CSS v4
* React Router DOM
* Axios

---

## ⚙️ Prerequisites

* Java Development Kit (JDK) 17 or higher
* Node.js (v18+) and npm
* MongoDB (local on port 27017 or Atlas URI)

---

## 🚀 Quick Start with Dev Containers (Recommended for macOS & Linux)

The easiest way to develop locally without manually installing Java, Maven, Node.js, MongoDB, or Redis is using **VS Code Dev Containers**:

1. Ensure **Docker** (Docker Desktop or OrbStack) and **VS Code** with the **Dev Containers** extension are installed.
2. Clone the repository and open it in VS Code:
   ```bash
   git clone https://github.com/varunkushwah31/Leetcode-Tracker-Frontend.git
   cd Leetcode-Tracker-Frontend
   code .
   ```
3. When prompted, click **"Reopen in Container"** (or press `Cmd+Shift+P` / `Ctrl+Shift+P` and select `Dev Containers: Reopen in Container`).
4. Everything is pre-configured! See [.devcontainer/README.md](.devcontainer/README.md) for full details.

---

## 🛠 Manual Local Setup & Installation

> Repository: [https://github.com/varunkushwah31/Leetcode-Tracker-Frontend](https://github.com/varunkushwah31/Leetcode-Tracker-Frontend)

```bash
git clone https://github.com/varunkushwah31/Leetcode-Tracker-Frontend.git
cd Leetcode-Tracker-Frontend
```

---

### Backend Setup

1. Navigate to backend:

   ```bash
   cd Backend
   ```

2. Configure environment variables:

   ```bash
   MONGO_URI=mongodb://localhost:27017/LeetcodeTracker
   JWT_SECRET=your_secret_key
   ```

3. Run backend:

   ```bash
   ./mvnw spring-boot:run
   ```

---

### Frontend Setup

1. Navigate to frontend:

   ```bash
   cd Frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run frontend:

   ```bash
   npm run dev
   ```

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch:

   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit changes:

   ```bash
   git commit -m "Add your feature"
   ```
4. Push:

   ```bash
   git push origin feature/your-feature-name
   ```
5. Open Pull Request

---
