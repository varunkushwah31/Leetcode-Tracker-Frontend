# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Coding bootcamp instructors, mentors, university educators, competitive programming coaches, and students practicing algorithmic problem solving across LeetCode and Codeforces.

## Product Purpose

MentorSync is an educational operating system and automated progress tracking platform designed for coding bootcamps, academies, and universities. It automates submission verification, eliminates manual spreadsheet tracking, monitors dual-platform contest ratings and solve counts, and drives student consistency through live cohort leaderboards and visual heatmaps.

## Positioning

Unlike generic learning management systems or manual Google Sheets trackers, MentorSync connects directly with competitive programming platforms (LeetCode and Codeforces) to verify student submissions automatically in real time without student self-reporting errors or spreadsheet maintenance.

## Operating Context

Used during daily classroom standups, coding bootcamps, placement preparation batches, and weekly programming contests. Instructors manage multiple student cohorts simultaneously, post problem assignments, track submission deadlines, and analyze student weakness areas.

## Capabilities and Constraints

- Automated profile synchronization and submission verification for LeetCode and Codeforces.
- Dual-platform tracking: solved problem counts, contest ratings, ranking percentiles, and activity heatmaps.
- Cohort and classroom management: assignment tracking, completion matrices, and automated URL validation.
- OAuth2 authentication (Google, GitHub) alongside secure credentials with email OTP verification.
- Real-time Redis-backed caching and WebSocket live contest and classroom updates.
- Strictly zero emojis across the entire codebase and interface.

## Brand Commitments

- Name: MentorSync
- Primary brand accent: Indigo (#5b4fff / #4338ca)
- Modern dark/light interface with clean typography (Inter / font-sans)
- Clean, utilitarian, high-craft aesthetic without decorative visual noise or cartoonish elements

## Evidence on Hand

- Frontend codebase: React 19, TypeScript, Vite, Tailwind CSS v4, Radix UI primitives, Phosphor Icons.
- Live backend deployed on Render (https://leettracker-backend-nq7r.onrender.com).
- Live frontend deployed on Vercel (https://mentorssync.vercel.app/).

## Product Principles

1. Automatic Truth Over Self-Reporting: Verify submissions directly against source platforms.
2. Low Cognitive Overhead: Immediate clarity for mentors managing large cohorts.
3. Motivating Visibility: Transparent cohort leaderboards and streak consistency.
4. Professional Engineering Craft: Zero emojis, accessible contrasts, responsive touch targets, and production stability.
