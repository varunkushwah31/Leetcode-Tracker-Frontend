# ☕ MentorSync Backend (Spring Boot 4)

The backend engine for **MentorSync (LeetCode LMS)** — an enterprise-grade platform that connects educators, mentors, and students. Built with **Spring Boot 4.0.5** and **Java 21**, it automates coding assignment tracking, synchronizes competitive programming stats across **LeetCode** and **Codeforces**, and powers real-time classroom leaderboards.

---

## 🏛 System Architecture

```
                  ┌─────────────────────────────────────────┐
                  │           React 19 Frontend             │
                  └─────────────┬───────────────────────────┘
                                │ HTTP / REST & WebSockets
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   MentorSync Spring Boot 4 Core                       │
│                                                                        │
│  ┌──────────────────┐  ┌─────────────────────┐  ┌───────────────────┐  │
│  │ Security Filter  │  │ Controller Layer    │  │ STOMP Broker      │  │
│  │ (JWT & RBAC)     │  │ (REST Endpoints)    │  │ (WebSocket /ws)   │  │
│  └────────┬─────────┘  └──────────┬──────────┘  └─────────┬─────────┘  │
│           │                       │                       │            │
│  ┌────────▼───────────────────────▼───────────────────────▼─────────┐  │
│  │                        Service Layer                             │  │
│  │  - ClassroomService      - DailyChallengeService                 │  │
│  │  - StudentService        - ContestScheduleService                │  │
│  │  - AdminService          - CacheWarmingService                   │  │
│  │  - AuthService           - RedisWebSocketBridge                  │  │
│  └────────┬───────────────────────┬───────────────────────┬─────────┘  │
│           │                       │                       │            │
│  ┌────────▼──────────┐ ┌──────────▼──────────┐ ┌──────────▼─────────┐  │
│  │ Spring Data Mongo │ │ Resilience4j Engine │ │ Spring Data Redis  │  │
│  │ (Repositories)    │ │ (Circuit Breaker)   │ │ (Cache & Pub/Sub)  │  │
│  └────────┬──────────┘ └──────────┬──────────┘ └──────────┬─────────┘  │
└───────────┼───────────────────────┼───────────────────────┼────────────┘
            │                       │                       │
            ▼                       ▼                       ▼
      ┌───────────┐         ┌──────────────┐         ┌─────────────┐
      │  MongoDB  │         │ External API │         │    Redis    │
      │ (Cluster) │         │ (LC GraphQL  │         │  (Cache &   │
      │           │         │  & CF REST)  │         │   Pub/Sub)  │
      └───────────┘         └──────────────┘         └─────────────┘
```

---

## 🚀 Key Modules & Capabilities

### 1. 🎯 Official LeetCode POTD (`DailyChallengeService`)
- Integrates directly with LeetCode GraphQL endpoint (`activeDailyCodingChallengeQuestion`).
- Fetches problem title, difficulty (Easy, Medium, Hard), tags, description preview, hint, and problem URL.
- **Global Redis Caching (`global-potd`)**: Cached globally under `global-potd::today` with a 24-hour TTL. Because the problem of the day is identical across all users, it is shared globally, avoiding redundant external calls.
- Personal solve verification and collaborative classroom tickers are overlaid in-memory without re-querying LeetCode.

### 2. ⚔️ Live Upcoming Contests Tracker (`ContestScheduleService`)
- **LeetCode & Codeforces Aggregation**: Combines upcoming Weekly/Biweekly contests and Codeforces rounds with countdowns and direct registration URLs.
- **Global Redis Caching (`upcoming-contests`)**: Cached globally under `upcoming-contests` (`ALL`, `LEETCODE`, `CODEFORCES`) with a 30-minute TTL. Shared identically across all users.

### 3. ⚡ Redis Cache Warming Worker (`CacheWarmingService`)
- Automated background worker executing daily at **03:00 UTC** (`@Scheduled(cron = "0 0 3 * * *")`).
- Uses atomic Redis distributed lock (`lock:cache:warming`, 30 min TTL) to ensure single-node execution in clustered environments.
- Primes global caches (`global-potd`, `upcoming-contests`) and pre-warms student & classroom caches for 0ms morning response times.
- Manual administrative trigger endpoint: `POST /api/admin/cache/warm`.

### 4. 🔄 Real-Time Clustered WebSockets (`RedisWebSocketBridge`)
- Native STOMP broker over `/ws-endpoint` with fallback SockJS support.
- Redis Pub/Sub topic (`mentorsync:classroom:events`) bridges events across multi-instance clusters.
- Broadcasts real-time events for assignment submissions, score changes, deadline updates, and student enrollments to `/topic/classrooms/{classroomId}`.

### 5. 🛡️ Resilience & Fault Tolerance
- **Resilience4j Circuit Breaker**: Opens on 50% failure rate over 10 calls, immediately falling back to cached Redis data without crashing.
- **Exponential Backoff Retry**: 3 retry attempts with exponential delays (2s, 4s) to survive transient network timeouts.
- **Rate Limiting**: Throttles calls to 15 requests per 10 seconds to safeguard IP reputation with external providers.

---

## 🛠 Tech Stack

| Component | Technology | Version |
|---|---|---|
| **Framework** | Spring Boot | `4.0.5` |
| **Language** | Java (JDK) | `21` LTS |
| **Security** | Spring Security + JJWT | `0.12.6` |
| **Database** | MongoDB (Spring Data Mongo) | 6.0+ |
| **Cache & Pub/Sub** | Redis (Spring Data Redis / Jedis) | 7.0+ |
| **Fault Tolerance** | Resilience4j | `2.2.0` |
| **Real-time** | Spring WebSocket + STOMP Messaging | `4.0.5` |
| **Testing** | JUnit 5, Mockito, Spring Boot Test | — |

---

## 📋 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register mentor or admin |
| `POST` | `/api/auth/register/student` | Register student with LeetCode handle |
| `POST` | `/api/auth/login` | Authenticate user, receive JWT & HTTP-Only refresh cookie |
| `POST` | `/api/auth/refresh` | Rotate access token using HTTP-Only refresh cookie |
| `POST` | `/api/auth/logout` | Invalidate active refresh token |
| `POST` | `/api/auth/change-password` | Update account password |

### Challenges & Contests (`/api/challenges`, `/api/contests`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/challenges/daily` | Get today's LeetCode POTD with student solved status & classroom ticker |
| `GET` | `/api/challenges/daily/global` | Get pure globally cached LeetCode POTD (no user context, 0ms) |
| `GET` | `/api/contests/upcoming` | Get upcoming LeetCode & Codeforces contests (globally cached) |

### Classrooms (`/api/classrooms`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/classrooms` | Create a new classroom |
| `GET` | `/api/classrooms/{id}/dashboard` | Get comprehensive classroom dashboard |
| `POST` | `/api/classrooms/{id}/students` | Add student to classroom |
| `DELETE` | `/api/classrooms/{id}/students/{studentId}` | Remove student from classroom |
| `POST` | `/api/classrooms/{id}/students/bulk` | Bulk import students via CSV |
| `POST` | `/api/classrooms/{id}/assignments` | Create assignment (auto-fetches problem title) |
| `DELETE` | `/api/classrooms/{id}/assignments/{assignmentId}` | Delete assignment |
| `PUT` | `/api/classrooms/{id}/assignments/{assignmentId}/deadline` | Update assignment deadline |
| `GET` | `/api/classrooms/{id}/leaderboard` | Get classroom leaderboard |
| `GET` | `/api/classrooms/{id}/export` | Export classroom performance to CSV |
| `GET` | `/api/classrooms/{id}/export/assignments` | Export assignment completion to CSV |
| `POST` | `/api/classrooms/{id}/students/{studentId}/nudge` | Send reminder email for pending tasks |

### Students (`/api/students`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students/me/dashboard` | Get student dashboard stats, profile, & assignments |
| `POST` | `/api/students/me/sync` | Force profile sync across LeetCode & Codeforces |
| `PUT` | `/api/students/me/handles` | Update LeetCode / Codeforces handles |
| `POST` | `/api/students/me/classrooms/{cId}/assignments/{aId}/auto-validate` | Validate assignment directly against LeetCode API |
| `POST` | `/api/students/me/classrooms/{cId}/assignments/{aId}/validate` | Validate assignment via submission URL |
| `GET` | `/api/students/me/report` | Download personal performance CSV report |

### Admin (`/api/admin`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/overview` | Platform health, active counts, and resource stats |
| `GET` | `/api/admin/students` | Get summary of all registered students |
| `POST` | `/api/admin/students/{id}/sync` | Force-sync single student's platform data |
| `POST` | `/api/admin/sync-all` | Trigger full synchronization for all students |
| `GET` | `/api/admin/cache/stats` | Redis cache key counts, memory, and hit/miss stats |
| `POST` | `/api/admin/cache/clear` | Clear specific cache or flush all caches |
| `POST` | `/api/admin/cache/warm` | Manually run background cache warming worker |

---

## ⚙️ Environment Variables

Configure the following variables in your `.env` or IDE run configuration:

```properties
# Server
PORT=8080

# Database
MONGO_URI=mongodb://localhost:27017/LeetcodeTracker

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your-secure-256-bit-hex-secret-key-goes-here
JWT_EXPIRATION=86400000

# Mail Service (Optional - for nudges)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

---

## 🧪 Testing & Verification

Run the full backend test suite:

```bash
# Run all unit and integration tests
./mvnw clean test

# Run specific service test
./mvnw test -Dtest=DailyChallengeServiceTest
./mvnw test -Dtest=ContestScheduleServiceTest
./mvnw test -Dtest=CacheWarmingServiceTest
```

---

## 📚 Technical Documentation

- [Redis Caching & Warming Guide](docs/REDIS_CACHING_GUIDE.md)
- [Resilience4j Circuit Breaker & Rate Limiter Guide](docs/RESILIENCE4J_IMPLEMENTATION_GUIDE.md)
