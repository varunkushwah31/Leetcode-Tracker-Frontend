---
description: Strict policy disallowing any emojis in code or UI
always_on: true
---

# Emoji Prohibition Policy

- **NEVER use emojis anywhere in the codebase.**
- Do not include emojis in source code, UI text, labels, buttons, badges, notifications, logs, comments, commits, test cases, or API responses.
- Always use clean SVG / Phosphor icons (from `@phosphor-icons/react` or equivalent icon libraries) or clean semantic text instead of emojis.
- For reactions, badges, podiums, and statuses, use semantic text tokens (e.g., `fire`, `rocket`, `kudos`, `heart`, `Rank 1`, `VICTORY`, `DRAW`, `IN_PROGRESS`) and render them with styled components or dedicated icons.
