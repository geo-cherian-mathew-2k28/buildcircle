# BuildCircle

## Overview

BuildCircle is a premium community platform for builders. It brings discovery, topic-based communities, real-time-style conversations, project sharing, events, event passes, a personal calendar, and an AI-curated daily digest into one focused workspace.

## Problem Statement

Builders often split their attention across chat apps, event tools, social feeds, project boards, and calendars. Important questions, useful introductions, project feedback, and event reminders are easy to miss; meanwhile, noisy feeds make it difficult to decide what deserves attention today.

## Solution

BuildCircle combines community discussion, events, and personal planning in one product. Each community has focused channels, threads, live rooms, private messages, file/image/voice sharing, moderation controls, and a Pulse workspace. The Daily Digest turns current community, project, and event signals into a concise three-step action plan, while still offering the complete update list for people who want detail.

## Features

- **Community workspaces:** Discover, join, and switch between public or approval-based communities with community-specific member totals, channels, announcements, administration settings, and member directories.
- **Useful conversations:** Send messages, replies, reactions, images, files, voice notes, projects, and direct messages; manage sent messages and mark channel updates as read.
- **Community Pulse:** Join focus sprints, earn BuildTokens, track a weekly quest, and see the next community event in a focused side workspace.
- **Events and calendar:** Browse events, register, receive a QR event pass, track registrations and wishlisted events in a dedicated calendar, and view events by date.
- **AI Daily Digest:** Receive an OpenAI-curated Quick Brief with a summary and three clear actions, or switch to the full detailed update view. A safe local snapshot remains available if the AI service is unavailable.
- **Event Operations Agent:** Generate reviewable community, email, and in-app drafts for event registrations and schedule changes.
- **Search and notifications:** Search communities, discussions, people, tags, and events from one place; notification counts clear after updates are read.
- **Premium responsive UI:** Urbanist typography, responsive desktop/mobile layouts, accessible controls, and cohesive visual states across the platform.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, CSS
- **Backend:** Next.js Route Handlers
- **Database:** Supabase (community, project, and event signals)
- **APIs / Services:** OpenAI Responses API, Supabase, QRCode
- **Hosting / Deployment:** Ready for deployment on Vercel or another Node.js-compatible platform
- **Other Tools:** Git/GitHub, npm, ESLint/TypeScript checks

## Codex / OpenAI Usage

Codex and OpenAI were used as active build partners throughout the hackathon:

- **Ideation and architecture:** Helped shape BuildCircle around the high-signal builder-community workflow: communities, conversations, projects, events, and personal planning.
- **Code generation and integration:** Assisted with Next.js/React components, Supabase-backed signal retrieval, QR pass generation, and OpenAI Responses API route handlers.
- **AI product features:** The Daily Digest and Event Operations Agent use structured OpenAI responses to produce safe, actionable summaries and communication drafts from supplied platform context.
- **Debugging and reliability:** Helped trace the Daily Digest fallback, tune the model request for concise low-reasoning output, and preserve a useful local fallback.
- **UI/UX development:** Assisted with responsive layout improvements, the Community Pulse workspace, interaction states, accessibility labels, and visual polish.
- **Testing and documentation:** Used for production-build verification, browser-based interaction checks, and this project documentation.

AI accelerated implementation and validation; product decisions, data boundaries, and final feature direction remained deliberately scoped to BuildCircle's builder-community use case.

## Demo

### Live Demo

Not deployed yet. Add the deployed BuildCircle URL here when available.

### Demo / Pitch Video

Not recorded yet. Add a demo or pitch video link here before submission.

**A short demo/pitch video is strongly recommended.** Show the Daily Digest Quick Brief, a community workspace, messaging, an event registration/pass, and the calendar in one end-to-end flow.

## Screenshots

Add project screenshots here before submission. Recommended captures:

- Home dashboard and Today’s Digest Quick Brief
- Community workspace with Pulse and channel read state
- Event registration and QR pass
- Calendar with registered and wishlisted events

## How to Run Locally

### Prerequisites

- Node.js 20+
- A Supabase project (optional for seeded fallback data)
- An OpenAI API key (optional for AI-curated Daily Digest and Event Operations Agent)

### Setup

```bash
git clone https://github.com/geo-cherian-mathew-2k28/buildcircle.git
cd buildcircle
npm install
```

Create a `.env` file in the project root. Never commit this file or expose its values.

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SECRET_KEY=your_supabase_secret_key
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini
```

Then start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). For a production check, run:

```bash
npm run build
npm run start
```

## Additional Notes

- The app is designed to remain usable without external credentials: seeded community/event content and deterministic digest fallbacks keep the demo functional.
- OpenAI-generated content is constrained to supplied platform signals and is presented as an assistive summary or a draft for review.
- External email delivery is intentionally staged for host approval; connecting a verified transactional email provider is a planned production step.
- Future work includes Supabase Auth, persistent chat/media storage, real-time presence, moderator approval workflows backed by database policies, notification delivery, and a deployed public demo with screenshots and a pitch video.
