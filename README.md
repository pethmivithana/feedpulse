# FeedPulse — AI-Powered Product Feedback Platform

FeedPulse is a full-stack internal tool that lets teams collect product feedback and feature requests, then uses **Google Gemini AI** to automatically categorise, prioritise, and summarise them — giving product teams instant clarity on what to build next.

![FeedPulse Dashboard](docs/screenshot-dashboard.png)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express, TypeScript |
| Database | MongoDB + Mongoose |
| AI | Google Gemini 1.5 Flash |
| Auth | JWT |

---

## Getting Started (Local)

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017 (or use Docker)
- A Google Gemini API key from [aistudio.google.com](https://aistudio.google.com)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/feedpulse.git
cd feedpulse
```

### 2. Set up the backend
```bash
cd backend
cp .env.example .env
# Edit .env and fill in your values
npm install
npm run dev
```

### 3. Set up the frontend
```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
```

### 4. Open the app
- **Feedback form**: http://localhost:3000
- **Admin dashboard**: http://localhost:3000/dashboard/login
  - Email: `admin@feedpulse.com`
  - Password: `admin123`

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/feedpulse
GEMINI_API_KEY=your_gemini_key_here
JWT_SECRET=your_secret_key_here
ADMIN_EMAIL=admin@feedpulse.com
ADMIN_PASSWORD=admin123
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

> **Note:** If `GEMINI_API_KEY` is left as `DUMMY_GEMINI_KEY` or blank, the app uses mock AI responses so you can still test all features without a real key.

---

## Running with Docker

```bash
# Copy and edit the env file
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Start everything
docker-compose up --build
```

App will be available at http://localhost:3000.

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | — | Admin login |
| POST | `/api/feedback` | — | Submit feedback (rate-limited: 5/hr) |
| GET | `/api/feedback` | ✅ | List all feedback (filters + pagination) |
| GET | `/api/feedback/stats` | ✅ | Dashboard stats |
| GET | `/api/feedback/summary` | ✅ | AI weekly summary |
| GET | `/api/feedback/:id` | ✅ | Get single item |
| PATCH | `/api/feedback/:id` | ✅ | Update status |
| POST | `/api/feedback/:id/reanalyze` | ✅ | Re-run AI analysis |
| DELETE | `/api/feedback/:id` | ✅ | Delete item |

All responses follow: `{ success, data, error, message }`

---

## Features

### Public Feedback Form
- Clean, accessible form with client-side validation
- Category selection (Bug / Feature Request / Improvement / Other)
- Character counter and minimum length enforcement
- Rate limiting (5 submissions/hour per IP)
- Clear success/error feedback states

### AI Analysis (Gemini 1.5 Flash)
- Automatic analysis triggered on every submission
- Returns: category, sentiment, priority score (1–10), summary, tags
- Feedback is always saved even if AI analysis fails
- Admin can manually re-trigger analysis on any item

### Admin Dashboard
- JWT-protected login
- Stats bar: total, open items, avg priority, top tag
- AI weekly summary (on-demand)
- Filter by category and status
- Sort by date, priority, or sentiment
- Keyword search (title + AI summary)
- Inline detail panel with full AI analysis
- One-click status updates (New → In Review → Resolved)
- Pagination (10 items per page)
- Delete feedback items

---

## What I'd Build Next

Given more time, I would add:
- **Email notifications** — notify submitters when their feedback status changes
- **Upvoting** — let users vote on existing feedback to boost priority signals
- **Analytics charts** — visual breakdowns of categories, sentiment trends over time
- **Webhook support** — post to Slack/Teams when high-priority feedback arrives
- **Full auth system** — multiple admin users with role-based access
- **Feedback threads** — allow admins to add internal notes and discussion to items

---

## Project Structure

```
feedpulse/
├── frontend/               # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # Public feedback form
│       │   └── dashboard/
│       │       ├── page.tsx          # Admin dashboard
│       │       └── login/page.tsx    # Login
│       └── lib/api.ts               # API client
│
├── backend/                # Node.js + Express API
│   └── src/
│       ├── index.ts
│       ├── config/database.ts
│       ├── models/feedback.model.ts
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   └── feedback.controller.ts
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   └── feedback.routes.ts
│       ├── middleware/auth.middleware.ts
│       └── services/gemini.service.ts
│
├── docker-compose.yml
└── README.md
```
