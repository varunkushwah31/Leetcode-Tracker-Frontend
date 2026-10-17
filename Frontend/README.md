# MentorSync Frontend (React 19 + TypeScript + Vite)

[![Live Web App](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://mentorssync.vercel.app/)
![React 19](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?logo=typescript&logoColor=white)
![Vite 8](https://img.shields.io/badge/Vite-8.3.1-646C9F?logo=vite&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.2.2-38B2AC?logo=tailwindcss&logoColor=white)
![Vitest Tests](https://img.shields.io/badge/Vitest-99%20Passed-success)

The modern, responsive web application for **MentorSync** — built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**. Deployed live on **[Vercel](https://mentorssync.vercel.app/)**, it connects seamlessly to the Spring Boot backend on **[Render](https://leettracker-backend-nq7r.onrender.com)**.

---

## Live Deployment

* **URL**: [https://mentorssync.vercel.app/](https://mentorssync.vercel.app/)
* **Platform**: Vercel
* **SPA Routing**: Configured via [`vercel.json`](vercel.json)

---

## Features & Dashboards

### 1. Authentication & Social OAuth 2.0
- **Google & GitHub Social Login**: One-click authentication with real-time feedback and state management.
- **Handshake Redirect Handler** (`/oauth2/redirect`): Extracts access tokens from callback query parameters and securely initializes the authentication session.
- **Onboarding Prompt**: Automatic welcome notification for new OAuth signups to connect their LeetCode and Codeforces usernames.

### 2. Student Dashboard
- **Daily Problem of the Day (POTD)**: Displays today's official LeetCode Daily Challenge with topic tags, difficulty badges, and a collaborative classroom participation ticker.
- **Upcoming Contests Tracker**: Live schedule of LeetCode (Weekly/Biweekly) and Codeforces contests with dynamic countdown timers, platform filtering, and direct one-click registration.
- **Dual-Platform Statistics**: Activity heatmap calendar, difficulty breakdown (Easy, Medium, Hard), and unified contest rating progress across LeetCode and Codeforces.
- **One-Click Assignment Verification**: Auto-validates completed homework against the student's LeetCode profile without manual screenshot submissions.

### 3. Mentor Dashboard
- **Classroom Hub**: Create classrooms, manage enrolled students, and bulk-import students via CSV.
- **Auto-Detect Assignment Creator**: Mentors paste any LeetCode problem URL, and the system automatically extracts problem details.
- **Live Leaderboard**: Real-time rankings sorted by streaks, contest ratings, solved counts, or pending tasks.
- **Engagement Tools**: Automated email nudges for students falling behind on assignments.
- **Reporting**: Export student performance and assignment completion metrics directly to CSV.

### 4. Contact & Support Portal
- **Interactive Form**: Validation, quick topic chips, and direct inquiry submission to mentors and administrators.

---

## Tech Stack

| Technology | Purpose | Version |
|---|---|---|
| **React** | Component-driven UI library | `19.2.4` |
| **TypeScript** | Type-safe development | `5.9.3` |
| **Vite** | Next-generation build tool & dev server | `8.3.1` |
| **Tailwind CSS** | Utility-first CSS styling | `v4.2.2` |
| **Radix UI** | Accessible headless UI primitives | Latest |
| **@phosphor-icons/react** | Iconography | `2.1.10` |
| **@stomp/stompjs** | Real-time WebSocket STOMP client | `7.3.0` |
| **Axios** | HTTP client with automatic token refresh | `1.20.0` |
| **React Router** | Client-side routing | `7.13.2` |
| **Vitest** | Unit and component testing (99 tests passed) | `5.0.3` |

---

## Environment Variables

| Variable | Description | Local Dev | Production (Vercel) |
|---|---|---|---|
| `VITE_API_BASE_URL` | Base URL for REST API endpoints | `/api` | `https://leettracker-backend-nq7r.onrender.com/api` |
| `VITE_OAUTH_BASE_URL` | Base origin for OAuth handshakes | *omitted* | `https://leettracker-backend-nq7r.onrender.com` |

---

## Development & Verification

```bash
# Install dependencies
npm install

# Run Vitest test suite (99 tests across 19 suites)
npm test

# Build production bundle
npm run build

# Start local development server
npm run dev
```
