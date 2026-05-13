# PROJECT 1127

> A brutal, no-excuses commitment tracker. Sign a contract with yourself. Log every day. Never stop.

![Project 1127 — Dark Terminal UI](https://img.shields.io/badge/PWA-installable-00ff41?style=flat-square&logo=pwa)
![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwindcss)

---

## What is this?

**Project 1127** is a self-discipline tracker inspired by the idea that mastery requires 1,127 days of deliberate, consistent effort. You sign a contract with yourself, define your commitments, and log every single day — no exceptions, no editing, no excuses.

Every missed day is automatically logged as **"Nothing"**. There is no cheat mode.

> Choose your own duration: 365, 500, 730, 1000, 1127 days, or any custom number.

---

## Features

### 📋 Core Commitment System
- Sign a contract with yourself at onboarding — **locked in forever**
- Define 1–7 goals with priority levels (Critical / High / Medium / Low)
- Set projected study days per goal and track completion timelines
- Daily entries sealed permanently on submission — **no editing after the fact**
- Missed days auto-filled as "Nothing" via zero-skip enforcement

### ⏱ Focus Timer
- Pomodoro-style timer: 25 / 50 / 10 / 5 min modes
- Circular SVG progress display
- Goal selector — logs session to the goal you're working on
- Auto-saves focus sessions to IndexedDB
- XP earned for every completed session

### 📅 Calendar View
- Full month grid with color-coded completion rates
- Tap any day to see all entries and daily reflection
- Month stats: entries, perfect days, fill rate

### 📊 Ghost Mode (Stats)
- **Stats tab**: total entries, words, streak, focus hours, milestone projections, activity charts
- **Leaderboard tab**: goals ranked by performance grade with badges
- **Heatmaps tab**: full journey heatmaps per goal
- Mood trend chart (30 days)
- Per-goal word count stats

### 🏆 XP & Level System
- Level 1–50 with non-linear XP thresholds
- +10 XP per real entry sealed
- +125 XP per completed focus session (scaled by duration)
- +200 XP per milestone unlocked
- Animated XP bar on dashboard

### 📝 Per-Goal Notes Scratchpad
- Add/edit/delete/pin notes per goal
- Store resources, links, study reminders
- Pinned notes appear at top

### 📈 Progress Report Card
- A+ to F grade per goal based on completion rate, streak score, consistency
- Overall performance grade
- Export as PNG for sharing

### 🎯 Weekly Review & Challenge
- Auto-triggered on your chosen review day
- Auto-generated weekly challenge targeting your weakest goal
- Mood average, entries count, goal activity dots

### 🏅 Milestone Wall
- Dynamic milestones scaled to your chosen duration
- Snapshot stats captured at unlock: completion rate, streak, mood avg, per-goal data

### 🗂 Archive
- Browse all past entries by date
- Filter by goal, mood, priority, or text search

### ⚙️ Settings
- **4 Themes**: Dark Terminal (green) / Amber Retro / Blue Ice / Red Alert
- **Streak Freezes**: 3 emergency freeze tokens to protect your streak
- **Sound Effects**: Web Audio API synth sounds — seal, milestone, level up, focus
- **Daily Notifications**: Web Notifications API with custom reminder time
- **Backup & Restore**: Export full data as `.json`, restore on any device

### 📦 Backup System
- Full JSON backup includes all entries, goals, notes, focus sessions, settings
- Restore on new phone / after data loss — recommended every 2 weeks
- Also exports: Full PDF journal, per-goal PDF, CSV spreadsheet

### 🎯 Configurable Duration
- Choose at onboarding: 365 / 500 / 730 / 1000 / 1127 days or custom (30–3650)
- All milestones, projections, and heatmaps scale to chosen duration
- Cannot be changed after contract is signed

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5.5 |
| Build | Vite 5 |
| Styling | Tailwind CSS 3 + CSS custom properties |
| State | Zustand 5 |
| Storage | IndexedDB via `idb` (100% local, no backend) |
| Routing | React Router DOM 6 |
| Charts | Recharts 2 |
| PWA | vite-plugin-pwa + Workbox |
| PDF Export | jsPDF |
| PNG Export | html2canvas |
| Sound | Web Audio API (synthesized, no files) |
| Fonts | Orbitron + Share Tech Mono (Google Fonts) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Install & Run

```bash
git clone https://github.com/ishtiiyaka/project_1127.git
cd project_1127
npm install
npm run dev
```

Opens at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## Deployment (Vercel)

This project auto-deploys to Vercel on every `git push` to `main`.

### Manual deploy:
1. Push to GitHub
2. Import at [vercel.com](https://vercel.com) — Vite is auto-detected
3. `vercel.json` included for SPA routing

### Environment
No environment variables required. Everything runs locally in the browser.

---

## Install on Android as a PWA

1. Open deployed URL in **Chrome** on Android
2. Tap **⋮ menu** → **"Add to Home Screen"** or **"Install app"**
3. App installs with its own icon, runs fullscreen, works offline

---

## Data & Privacy

- **100% local storage** — all data stays on your device in IndexedDB
- No server, no database, no accounts, no telemetry
- No data is ever sent anywhere
- Clearing browser storage = data gone permanently → **use the Backup feature**

---

## Project Structure

```
src/
├── components/
│   ├── archive/        # Archive page — browse all past entries
│   ├── calendar/       # Calendar month view
│   ├── dashboard/      # Main dashboard, countdown header, goal cards
│   ├── entry/          # Entry modal (bottom sheet), goal history + notes
│   ├── export/         # PDF/CSV/JSON backup export
│   ├── focus/          # Pomodoro focus timer
│   ├── ghost/          # Stats / Ghost mode / heatmaps
│   ├── milestones/     # Milestone wall + celebration
│   ├── onboarding/     # Contract screen + goal configurator
│   ├── report/         # Report card + PNG export
│   ├── settings/       # Theme, notifications, streak freeze
│   ├── shared/         # Heatmap90 shared component
│   └── weekly/         # Weekly review + challenge
├── lib/
│   ├── autoSeal.ts     # Zero-skip enforcement
│   ├── dateUtils.ts    # Date helpers
│   ├── db.ts           # IndexedDB via idb
│   ├── installPrompt.ts# PWA install prompt
│   ├── notifications.ts# Web Notifications API
│   ├── projectionEngine.ts # Milestone projection math
│   ├── quotes.ts       # Daily quotes
│   ├── reportCard.ts   # Grade calculation + weekly challenge
│   ├── sounds.ts       # Web Audio API synth sounds
│   └── tips.ts         # Domain-specific daily tips
├── store/
│   └── useAppStore.ts  # Zustand store — all state + actions
└── types/
    └── index.ts        # All TypeScript interfaces and types
```

---

## Goals Pre-configured

The app comes with 5 default goals (editable before signing):

| Goal | Priority | Target Study Days |
|---|---|---|
| AI Engineering Full Masterclass | Critical | 600 |
| Chinese (HSK 4) | Critical | 500 |
| Finance for Business & Trading | Critical | 400 |
| Robotics | High | 550 |
| Embedded Systems | Medium | 350 |

---

## License

MIT — do whatever you want with it. If it helps you build something great, that's the point.

---

> *"The 1127-day commit separates dreamers from builders."*
