# 🎪 Kids Event Finder

An AI-powered web app that finds and displays kids' events in nearby cities, built with **Next.js**, **SQLite**, and two custom **DeployAI agents**.

## Features
- 🔍 Browse kids' events by city, age range, category, and date
- 🤖 **Event Curator Agent** — automatically fetches, filters, and normalises events from Ticketmaster API
- 💬 **Parent Assistant Agent** — conversational chatbot powered by RAG + LLM
- 📍 Geolocation-assisted city detection
- ⚡ In-memory caching with TTL

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes |
| Database | SQLite (better-sqlite3) |
| Cache | In-memory TTL cache |
| AI Agents | DeployAI (GPT-4o) |
| Events API | Ticketmaster Discovery API |

## Getting Started

```bash
npm install
cp .env.local.example .env.local  # fill in your credentials
npm run dev
```

## Environment Variables
```env
CLIENT_ID=            # DeployAI client ID
CLIENT_SECRET=        # DeployAI client secret
ORG_ID=               # DeployAI org ID
EVENTS_API_KEY=       # Ticketmaster API key (optional — mock data used if absent)
```
