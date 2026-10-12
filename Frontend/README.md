# ⚡ MentorSync Frontend (React 19 + TypeScript + Vite)

The modern, responsive web application for **MentorSync (LeetCode LMS)** — built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**. It delivers real-time dashboards for students, mentors, and administrators with gamified tracking, live WebSocket updates, and competitive programming analytics.

---

## ✨ Features & Dashboards

### 👨‍🎓 Student Dashboard
- **Daily Problem of the Day (POTD)**: Displays today's official LeetCode Daily Challenge with topic tags, difficulty badges, and a collaborative classroom ticker (*"3 of 5 students in TEST solved today's POTD!"*).
- **Upcoming Contests Tracker**: Live schedule of LeetCode (Weekly/Biweekly) and Codeforces contests with dynamic countdown timers, platform filtering, and direct one-click registration.
- **Dual-Platform Statistics**: Activity heatmap calendar, problem breakdown by difficulty (Easy, Medium, Hard), and unified contest rating progress across LeetCode and Codeforces.
- **One-Click Assignment Verification**: Auto-validates completed homework against the student's LeetCode profile without manual screenshot submissions.

### 👩‍🏫 Mentor Dashboard
- **Classroom Hub**: Create classrooms, manage enrolled students, and bulk-import students via CSV.
- **Auto-Detect Assignment Creator**: Mentors paste any LeetCode problem URL, and the system automatically fetches the problem title, slug, and difficulty.
- **Live Leaderboard**: Real-time rankings sorted by streaks, contest ratings, solved counts, or pending tasks.
- **Engagement Tools**: Automated email nudges for students falling behind on assignments.
- **Reporting**: Export student performance and assignment completion metrics directly to CSV.

### 🛡️ Super Admin Dashboard
- **System Overview**: High-level platform health metrics, user distributions, and system telemetry.
- **Global Data Sync**: Trigger background synchronization of all student profiles across external APIs.
- **Redis Cache Control**: Inspect Redis cache memory, view hit/miss statistics, flush individual caches, or manually run the Cache Warming Worker.

---

## 🛠 Tech Stack

| Technology | Purpose | Version |
|---|---|---|
| **React** | Component-driven UI library | `19.2.4` |
| **TypeScript** | Type-safe development | `5.9.3` |
| **Vite** | Next-generation build tool & dev server | `8.0.1` |
| **Tailwind CSS** | Utility-first CSS styling | `v4.2.2` |
| **Radix UI / Shadcn** | Accessible headless UI primitives | Latest |
| **@phosphor-icons/react** | Iconography | `2.1.10` |
| **@stomp/stompjs** | Real-time WebSocket STOMP client | `7.3.0` |
| **Axios** | HTTP client with JWT interceptors | `1.20.0` |
| **React Router** | Client-side routing | `7.13.2` |
| **Vitest** | Unit and component testing | `5.0.3` |

---

## 📂 Project Structure

```
Frontend/src/
├── assets/                  # Static assets and brand logos
├── components/
│   ├── auth/                # ProtectedRoute and authentication guards
│   ├── dashboard/
│   │   ├── admin/           # Admin overview, user management, cache controls
│   │   ├── mentor/          # Classroom hub, assignment dialogs, nudges
│   │   └── student/         # DailyChallengeCard, UpcomingContestsCard,
│   │                        # HeatmapCalendar, UnifiedContestHistory
│   ├── layout/              # Navbar, Sidebar, App Shell
│   └── ui/                  # Button, Card, Badge, Dialog, ScrollArea, Tabs
├── context/                 # AuthContext and state providers
├── hooks/                   # Custom hooks (useAuth, useClassroomWebSocket)
├── pages/                   # Login, Register, StudentDashboard, MentorDashboard, etc.
├── services/                # Axios API modules (api.ts, challengeService.ts, etc.)
└── tests/                   # Vitest unit test suites
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

```bash
# 1. Navigate to the frontend directory
cd Frontend

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env # (or create .env with variables below)

# 4. Start development server
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## ⚙️ Environment Variables

Create a `.env` file in the `Frontend/` root:

```env
# Base API URL pointing to the Spring Boot backend
VITE_API_BASE_URL=http://localhost:8080/api

# Base WebSocket URL
VITE_WS_URL=http://localhost:8080/ws-endpoint
```

---

## 🧪 Testing & Quality

```bash
# Run unit tests
npm test

# Run tests with coverage report
npm run test:coverage

# Lint source files
npm run lint

# Production build check
npm run build
```

---

## 🎨 UI & Design Principles
- **Aesthetic Rhythm**: Built on solid brand colors (`#5b4fff` primary purple) paired with dark slate card surfaces (`#121824`, `#1e293b`), avoiding noisy multi-color gradients.
- **Responsive Layout**: Designed for seamless usage across desktop displays, tablets, and mobile screens.
- **Accessibility**: ARIA-compliant primitives via Radix UI, high contrast typography, and custom sleek scrollbars.
