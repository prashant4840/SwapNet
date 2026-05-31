# ⚡ SwapNet

> A production-ready, peer-to-peer skill-sharing SaaS platform that connects ambitious builders to trade skills directly — **completely free and without money**.

[![Build Status](https://github.com/prashant4840/SwapNet/actions/workflows/ci.yml/badge.svg)](https://github.com/prashant4840/SwapNet/actions)
[![Unit Tests](https://img.shields.io/badge/Tests-140%20Passed-emerald.svg?style=flat-square)](#)
[![Security Status](https://img.shields.io/badge/Security-Audited-brightgreen.svg?style=flat-square)](#)
[![React 19](https://img.shields.io/badge/React-19.2-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-Deployment-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

---

## 🚀 Quick Start & Live Demo

* 🌐 **Live Demo**: [skillbridge-mu-green.vercel.app](https://skillbridge-mu-green.vercel.app)
* 🔑 **Hassle-Free Test Credentials**: 
  * **Email**: `ava@swapnet.app`
  * **Password**: `demo-pass`
* 📦 **Zero-Configuration Sandbox**: Clone the repo and run `npm run dev` instantly. No Supabase or database setups required to explore all pages locally!

> [!NOTE]
> *Rebranding Notice*: SwapNet is the official rebranded version of the SkillBridge repository. All code references and Vercel hosting points have been consolidated to this deployment.

---

## 📌 Table of Contents

* [Project Overview & Core Value Proposition](#project-overview--core-value-proposition)
* [System Architecture](#system-architecture)
* [Core Features](#core-features)
* [Offline Sandbox Demo Mode](#offline-sandbox-demo-mode)
* [UI Showcase](#ui-showcase)
* [Production Hardening & Optimization](#production-hardening--optimization)
* [Local Setup & Directory Structure](#local-setup--directory-structure)
* [Testing & E2E Verification](#testing--e2e-verification)
* [Roadmap & Future Scope](#roadmap--future-scope)
* [License & Contact](#license--contact)

---

## Project Overview & Core Value Proposition

### What SwapNet Is
SwapNet is a modern, collaborative platform designed for builders, developers, creators, and lifelong learners. Instead of paying for tutorial sites or bootcamps, users swap their expertise. You teach what you know, and learn what you need in return.

### The Problem It Solves
Access to premium learning is locked behind expensive subscription fees, paywalls, or rigid curriculums. Meanwhile, experienced builders have valuable skills but lack structured, trust-based networks to exchange knowledge directly with peers.

### Key Value Proposition
* **Reciprocity-First Matching**: A proprietary scoring algorithm finds optimal compatibility pairs based on what you teach and what you want to learn.
* **Reputation System**: Completed swaps, reviews, and badges build community trust.
* **SaaS-Grade Features**: High-priority transactional email delivery, progressive pagination, database rate-limiting, and error-trace visibility.

---

## System Architecture

SwapNet leverages a modern serverless, event-driven architecture designed to minimize latency and ensure data resilience.

```mermaid
graph TD
    User([User Client]) -->|HTTPS / WSS| Vercel[Vercel CDN / Frontend]
    User -->|API Calls / Realtime| Supabase[Supabase API Gateway]
    Supabase -->|Database Queries| PostgreSQL[(PostgreSQL Database)]
    Supabase -->|Trigger Actions| EdgeFunctions[Supabase Edge Functions]
    EdgeFunctions -->|Send Emails| Resend[Resend SMTP Service]
    User -.->|Error Logging| Sentry[Sentry Tracing]
    User -.->|Telemetry| PostHog[PostHog Analytics]
```

### Flow Breakdown
1. **Frontend App**: Single-page application built with React 19 + TypeScript + Tailwind CSS, optimized with code-splitting and deployed on Vercel's global edge network.
2. **Supabase Gateway**: Handles JWT user session management, row-level security (RLS) policies, and handles PostgreSQL WebSocket subscriptions for real-time messaging.
3. **Database Layer (PostgreSQL)**: Manages optimized relational schemas, index-supported searches, database-level rate-limiting triggers, and automated audits.
4. **Edge Processing**: Deno Edge Functions process outbound email delivery using Resend, handling failures with built-in retry queues and exponential backoffs.

---

## Core Features

* 🔐 **Secure Authentication**: Built-in signups, password resets, and session recovery backed by Supabase Auth.
* 🔍 **Skill Discovery Feed**: Fast, search-optimized catalog filtering members by compatibility, city location, rating, and mode.
* ✉️ **Interactive Swap Requests**: Send structured exchange requests outlining exactly which skills you offer to swap.
* 💬 **Real-time Chat & Inbox**: Instant messaging with websocket support to coordinate sessions, featuring automatic email alerts for unread messages.
* ⭐ **Trust Reviews**: Submit ratings and feedback upon swap completion to build profile status badges (e.g., "Top Rated").
* 🛡️ **Abuse Control & Moderation**: Admin diagnostics console to manage reported profiles, ban users, and inspect server logs.
* 📈 **Analytics & Performance Tracking**: Live conversions monitored in Sentry, Vercel, and PostHog.

---

## Offline Sandbox Demo Mode

To eliminate setup friction, SwapNet is built with a **resilient client-side fallback layer**. 

If database environment variables are omitted or empty, the application automatically enters **Offline Sandbox Demo Mode**:
* **Mock Authentication**: Log in with any email and password instantly (or use `ava@swapnet.app` / `demo-pass`).
* **Seeded In-Memory Data**: Pages are populated with rich mock profiles, reviews, swap requests, and message histories.
* **Fully Functional Features**: Search, filter, send request actions, profile edits, settings updates, and message logs work completely locally by writing to `localStorage`.

This makes it incredibly easy for hiring managers and recruiters to test the application instantly without setting up a database.

---

## UI Showcase

E2E browser snapshots demonstrating the visual consistency and responsiveness of the user interface:

| Page / Interface | View Snapshot |
| --- | --- |
| **Landing Frame** <br> *Marketing copy and live metrics* | ![Landing Page](public/screenshots/landing.png) |
| **User Discovery** <br> *Compatibility grid and unified filters* | ![Explore Feed](public/screenshots/explore.png) |
| **Direct Messaging** <br> *Realtime WebSocket chat threads* | ![Chat Window](public/screenshots/chat.png) |
| **User Dashboard** <br> *Swap tracking, analytics charts, and requests* | ![User Dashboard](public/screenshots/dashboard.png) |
| **Member Profile** <br> *Public resume, reviews, and endorsements* | ![Member Profile](public/screenshots/profile.png) |
| **Mobile Adaptability** <br> *Responsive viewport stack (390px)* | ![Mobile Feed](public/screenshots/mobile-explore.png) |

---

## Production Hardening & Optimization

SwapNet includes features that elevate it from a simple MVP to a secure, enterprise-ready SaaS application:

* **Progressive Range Pagination**: Discovery feeds, message inboxes, and notification lists use range limits instead of fetching whole tables, keeping Supabase API consumption optimal.
* **Database Rate-Limiting**: PostgreSQL database triggers (`enforce_rate_limits`) restrict insert flooding (e.g., maximum 3 chat messages per 5 seconds, 30 seconds delay between posts) to prevent spam.
* **Exponential Backoff Email Queue**: Outbound transactional emails are persisted to `public.email_queue` and processed asynchronously. Failed attempts recalculate a backoff timeline ($2^{n}$ minutes) up to 5 times before moving to a Dead Letter Queue (DLQ).
* **Strict Content Security Policy (CSP)**: `vercel.json` enforces secure HTTP headers (`X-Frame-Options: DENY`, `Strict-Transport-Security`) and CSP rules restricting script executions.
* **System Log Trace Inspector**: Frontend and Edge Function errors are logged directly to `public.error_logs` with unique correlation IDs, allowing administrators to debug trace stacks instantly from the Admin Page.
* **Bundle Splitting**: Heavy modules like Recharts and Framer Motion are compiled into separate lazy chunks, dropping the dashboard bundle footprint from **356.50 kB to 16.94 kB**.
* **Defensive Error Resilience**: Date formatting (`formatRelativeTime`) and image loads are wrapped in safety boundary fallbacks, preventing client-side page crashes when incomplete data resides in client storage.

---

## Local Setup & Directory Structure

### Directory Structure Map
```
├── .github/                # GitHub templates and CI build workflows
├── public/                 # Static assets and browser screenshots
├── scripts/                # E2E browser verification script (Playwright)
├── src/
│   ├── components/         # Reusable design components (Badges, Buttons, Selects)
│   ├── context/            # Authentication, Chat, and App State providers
│   ├── data/               # Seed states and skill classifications
│   ├── hooks/              # Custom React hooks (realtime subscriptions, endorsements)
│   ├── lib/                # Supabase API client configurations
│   ├── pages/              # Page route screens (Dashboard, Settings, Profile)
│   ├── services/           # Analytics, monitoring, and error-captures
│   └── utils/              # Data mappings, rating math, and safety formatters
├── supabase/
│   ├── migrations/         # PostgreSQL database schemas, rate-limiting SQL
│   └── functions/          # Deno Deploy transactional email edge routines
└── tsconfig.json           # Compiler rules
```

### Installation Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/prashant4840/SwapNet.git
   cd SwapNet
   ```
2. **Install package dependencies**:
   ```bash
   npm install
   ```
3. **Configure environment variables (Optional)**:
   Create a `.env` file in the project root if you want to connect to a live database. If left blank, the app runs in **Offline Sandbox Mode**.
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_SENTRY_DSN=your-optional-sentry-dsn
   ```
4. **Start the local development server**:
   ```bash
   npm run dev
   ```
5. **Build for production**:
   ```bash
   npm run build
   ```

---

## Testing & E2E Verification

* **Unit Testing**:
  Verify state hooks and contextual utilities using Vitest:
  ```bash
  npm run test -- --run
  ```
* **Browser Verification Suite**:
  Run Playwright to simulate logins, check layout responsiveness, and capture automated snapshots of all primary views:
  ```bash
  npm run verify:browser
  ```

---

## Roadmap & Future Scope

- [ ] **AI-Powered Skill Matcher**: Analyze user bios and profiles to suggest high-compatibility learning paths automatically.
- [ ] **Native Mobile Application**: Build iOS and Android versions using React Native.
- [ ] **Interactive Video Rooms**: Audio/Video integrations to host live classes directly within the SwapNet app (Whereby WebRTC).
- [ ] **Community Class Events**: Support one-to-many workshops and group learning boards.

---

## License & Contact

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

**Developer / Maintainer**: Prashant Sharma  
**Email**: [prashantsharma4840@outlook.com](mailto:prashantsharma4840@outlook.com)  

Feel free to reach out if you have questions, feedback, or collaboration opportunities!
