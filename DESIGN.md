---
name: MentorSync
description: Educational operating system for coding bootcamps and competitive programming cohorts
colors:
  primary: "#5b4fff"
  primary-hover: "#4d40ef"
  primary-deep: "#4338ca"
  accent-cf: "#0284c7"
  accent-lc: "#ffa116"
  success: "#10b981"
  danger: "#f43f5e"
  neutral-bg-dark: "#0a0a0a"
  neutral-surface-dark: "#111111"
  neutral-card-dark: "#18181b"
  neutral-border-dark: "rgba(255, 255, 255, 0.08)"
  neutral-bg-light: "#f8fafc"
  neutral-surface-light: "#ffffff"
  neutral-card-light: "#f1f3f7"
  neutral-border-light: "rgba(0, 0, 0, 0.08)"
typography:
  display:
    fontFamily: "Inter Variable, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  heading-lg:
    fontFamily: "Inter Variable, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  heading-md:
    fontFamily: "Inter Variable, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter Variable, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.01em"
  body-sm:
    fontFamily: "Inter Variable, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter Variable, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

## Overview

MentorSync is a high-performance, dark-mode-first educational platform for mentors, educators, and students. Its visual design conveys engineering rigor, clarity, and reliability without generic SaaS tropes or decorative filler.

## Colors

- **Primary**: `#5b4fff` (Vibrant Indigo) — Primary calls to action, active indicators, and focus states.
- **Deep Accent**: `#4338ca` (Deep Indigo) — Gradient anchors and high-emphasis surfaces.
- **Platform Accents**:
  - LeetCode Gold: `#ffa116`
  - Codeforces Cyan: `#0284c7`
- **Semantic Signals**:
  - Success: `#10b981` (Emerald) for verified solutions and consistency streaks.
  - Danger: `#f43f5e` (Rose) for destructive actions and expired deadlines.
- **Neutrals**:
  - Dark Mode: `#0a0a0a` (Canvas), `#111111` (Surface), `#18181b` (Card/Elevated), `rgba(255, 255, 255, 0.08)` (Border).
  - Light Mode: `#f8fafc` (Canvas), `#ffffff` (Surface), `#f1f3f7` (Card/Elevated), `rgba(0, 0, 0, 0.08)` (Border).

## Typography

Primary typeface: `Inter Variable` across all weights (400, 500, 600, 700, 800).
- Headings use tight negative letter-spacing (`tracking-tight` / `-0.025em` to `-0.035em`) for punchy density.
- Prose paragraphs are capped at comfortable reading measures (45ch to 65ch max-width) to prevent eye fatigue.
- Monospace font is reserved strictly for code, URLs, API keys, and tabular tokens.

## Layout

- Fluid container widths (`max-w-7xl` for page boundaries, `max-w-4xl` for hero and long-form prose).
- 4-unit base grid with deliberate rhythm: tight groupings (4px-12px) for related content, generous separation (32px-64px) between sections.
- Refuse nested cards and identical icon-box rows. Prefer asymmetric layouts and live interactive demonstrations.

## Elevation & Depth

- Low-contrast, diffused shadows with vertical offsets (`shadow-sm`, `shadow-md`, `shadow-xl`).
- Subtle 1px border framing (`border-zinc-200/80 dark:border-zinc-800/80`) to define planes cleanly in both dark and light modes.
- Avoid flat, harsh neon halos or zero-offset color glow rings.

## Shapes

- Interactive buttons and badges: `rounded-xl` (12px).
- Surface containers and modals: `rounded-2xl` (16px) to `rounded-3xl` (24px).
- Pill chips and status badges: `rounded-full`.

## Components

- **Buttons**:
  - Primary: Solid brand indigo with subtle inset border and soft shadow. Minimum 44px touch height.
  - Secondary/Ghost: Tonal surface with hover elevation and crisp border.
- **Navigation Bar**:
  - Fixed floating dock with backdrop blur (`backdrop-blur-xl`), responsive mobile menu, and theme toggle.
- **Feature Showcases**:
  - Concrete interactive mockups reflecting real product UI (class cohorts, problem verification, streak heatmap, contest rating charts).

## Do's and Don'ts

### Do
- Maintain high contrast: body text >= 4.5:1, headers >= 3:1.
- Provide explicit keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-[#5b4fff]`).
- Design complete responsive layouts down to 320px mobile screens.
- Ensure touch targets meet the minimum 44x44px standard.

### Don't
- Never use emojis anywhere in code, markdown, comments, or UI text.
- Do not use redundant eyebrows/kickers above main headings.
- Do not use nested cards or duplicate icon grids.
- Do not use monospace fonts for UI headings or regular labels.
