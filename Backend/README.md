# LeetCode Tracker LMS

A robust, two-sided Learning Management System designed for educators and students to seamlessly track LeetCode progress, manage classroom assignments, and view dynamic leaderboards. 

This platform automates the tracking of coding assignments by integrating directly with LeetCode's external APIs, eliminating manual grading while providing a gamified experience for students.

## Features

* **Role-Based Access Control:** Distinct dashboards and permissions for Super Admins, Mentors, and Students.
* **Enterprise Security:** Stateless JWT authentication utilizing short-lived access tokens and secure, HTTP-Only refresh token rotation.
* **Automated Multi-Platform Synchronization:** Instantly fetches a student's total solved problems, contest ratings, badges, and recent submissions from LeetCode and Codeforces upon registration.
* **Classroom Management:** Mentors can create classrooms, enroll students, and assign specific problems with strict time windows.
* **Dynamic Leaderboards:** Real-time sorting based on consistency streaks, contest ratings, or pending assignments.
* **Submission Validation:** Automated regex and API-driven verification to ensure students actually completed the assigned problems.

## Tech Stack

**Backend Architecture**
* Java 17+
* Spring Boot 3
* Spring Security (JWT)
* MongoDB (Spring Data MongoDB)
* Maven

**Frontend Architecture**
* React 18
* TypeScript
* Vite (SWC Compiler)
* Tailwind CSS v4
* React Router DOM
* Axios

## Prerequisites

Before running this project locally, ensure you have the following installed:
* Java Development Kit (JDK) 17 or higher
* Node.js (v18+) and npm
* A local instance of MongoDB running on port 27017 (or a MongoDB Atlas URI)

## Local Setup & Installation

### 1. Backend Setup

1. Navigate to the backend directory.
2. Configure your environment variables. In your IDE run configurations, set the following variables:
   * `MONGO_URI`: Your MongoDB connection string (defaults to `mongodb://localhost:27017/LeetcodeTracker`)
   * `JWT_SECRET`: A secure 256-bit hex key for token generation
3. Build and run the Spring Boot application:
   ```bash
   ./mvnw spring-boot:run
