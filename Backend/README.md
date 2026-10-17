# MentorSync Backend (Spring Boot 4)

[![Live Backend](https://img.shields.io/badge/Deployed_on-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://leettracker-backend-nq7r.onrender.com)
![Java 21](https://img.shields.io/badge/Java-21-orange?logo=openjdk&logoColor=white)
![Spring Boot 4](https://img.shields.io/badge/Spring_Boot-4.0.5-6DB33F?logo=springboot&logoColor=white)
![Spring Security OAuth2](https://img.shields.io/badge/Spring_Security-OAuth2-6DB33F?logo=springsecurity&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7.0+-DC382D?logo=redis&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248?logo=mongodb&logoColor=white)
![Tests](https://img.shields.io/badge/Tests-139%20Passed-success)

The backend engine for **MentorSync** — an enterprise-grade platform connecting educators, mentors, and students. Built with **Spring Boot 4.0.5** and **Java 21**, deployed live on **[Render](https://leettracker-backend-nq7r.onrender.com)** to power real-time dashboards for **[Vercel](https://mentorssync.vercel.app/)**.

---

## Live Deployment

* **Base URL**: `https://leettracker-backend-nq7r.onrender.com`
* **API Prefix**: `/api` (or `/api/v1`)
* **OAuth2 Authorize**: `https://leettracker-backend-nq7r.onrender.com/oauth2/authorization/{google|github}`
* **WebSocket Endpoint**: `https://leettracker-backend-nq7r.onrender.com/ws-endpoint`

---

## Key Modules & Capabilities

### 1. OAuth 2.0 Social Authentication (`OAuth2LoginSuccessHandler`)
- Seamless social login with Google and GitHub.
- Extracts user attributes (`email`, `name`, `picture` / `avatar_url`, `login`).
- Links existing Student/Mentor records, or auto-registers first-time users as Students.
- Sets cross-domain `HttpOnly` refresh token cookies (`SameSite=None`, `Secure=true`) and redirects to `APP_OAUTH2_REDIRECT_URI` (`https://mentorssync.vercel.app/oauth2/redirect`).
- Fully supports cloud reverse-proxy SSL termination (`server.forward-headers-strategy=framework`).

### 2. Official LeetCode POTD (`DailyChallengeService`)
- Integrates directly with LeetCode GraphQL endpoint (`activeDailyCodingChallengeQuestion`).
- Fetches problem title, difficulty (Easy, Medium, Hard), tags, description preview, hint, and problem URL.
- **Global Redis Caching (`global-potd`)**: Cached globally under `global-potd::today` with automatic date-staleness validation.

### 3. Live Upcoming Contests Tracker (`ContestScheduleService`)
- **Dual-Platform Aggregation**: Combines upcoming Weekly/Biweekly contests and Codeforces rounds with countdowns and direct registration URLs.
- **Global Redis Caching (`upcoming-contests`)**: Cached globally under `upcoming-contests` (`ALL`, `LEETCODE`, `CODEFORCES`) with a 30-minute TTL.

### 4. Redis Cache Warming Worker (`CacheWarmingService`)
- Automated background worker executing daily at **6:00 AM IST** (`@Scheduled(cron = "0 0 6 * * ?", zone = "Asia/Kolkata")`).
- Uses atomic Redis distributed lock (`lock:cache-warming`, 30 min TTL) to ensure single-node execution in clustered environments.
- Primes global caches (`global-potd`, `upcoming-contests`) and pre-warms student & classroom caches for 0ms morning response times.
- Manual trigger: `POST /api/admin/cache/warm`.

### 5. Real-Time Clustered WebSockets (`RedisWebSocketBridge`)
- Native STOMP broker over `/ws-endpoint` with fallback SockJS support.
- Redis Pub/Sub topic (`mentorsync:classroom:events`) bridges events across multi-instance clusters.
- Broadcasts real-time events to `/topic/classrooms/{classroomId}`.

### 6. Resilience & Fault Tolerance
- **Resilience4j Circuit Breaker**: Opens on 50% failure rate over 10 calls, falling back to cached Redis data.
- **Exponential Backoff Retry**: 3 retry attempts with progressive delays (2s, 4s).
- **Rate Limiting**: Throttles calls to 15 requests per 10 seconds.

---

## Tech Stack

| Component | Technology | Version |
|---|---|---|
| **Framework** | Spring Boot | `4.0.5` |
| **Language** | Java (JDK) | `21` LTS |
| **Security** | Spring Security + Spring OAuth2 Client + JJWT | `0.12.6` |
| **Database** | MongoDB (Spring Data Mongo) | 6.0+ |
| **Cache & Pub/Sub** | Redis (Spring Data Redis / Jedis) | 7.0+ |
| **Fault Tolerance** | Resilience4j | `2.2.0` |
| **Real-time** | Spring WebSocket + STOMP Messaging | `4.0.5` |
| **Testing** | JUnit 5, Mockito (139 unit tests passed) | — |

---

## Production Environment Variables (Render)

| Variable | Value | Purpose |
|---|---|---|
| `APP_OAUTH2_REDIRECT_URI` | `https://mentorssync.vercel.app/oauth2/redirect` | Post-login redirect to frontend |
| `CORS_ALLOWED_ORIGINS` | `https://mentorssync.vercel.app,http://localhost:5173,http://localhost:3000` | Allowed CORS origins |
| `COOKIE_SECURE` | `true` | Secure HTTPS cookie flag |
| `COOKIE_SAME_SITE` | `None` | Cross-site cookie transmission between domains |
| `SERVER_FORWARD_HEADERS_STRATEGY` | `framework` | Reverse-proxy SSL header detection |
| `GOOGLE_CLIENT_ID` | `<your-google-client-id>` | Google OAuth ID |
| `GOOGLE_CLIENT_SECRET` | `<your-google-client-secret>` | Google OAuth Secret |
| `GITHUB_CLIENT_ID` | `<your-github-client-id>` | GitHub OAuth ID |
| `GITHUB_CLIENT_SECRET` | `<your-github-client-secret>` | GitHub OAuth Secret |
| `JWT_SECRET` | `<256-bit-hex-secret>` | Access token signature key |
| `MONGO_URI` | `mongodb+srv://...` | MongoDB cluster connection |
| `REDIS_HOST` | `<redis-host>` | Redis caching instance |

---

## Verification & Testing

```bash
# Run all 139 unit and integration tests
./mvnw clean test

# Run Spring Boot locally
./mvnw spring-boot:run
```
