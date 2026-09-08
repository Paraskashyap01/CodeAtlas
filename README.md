# 🎯 CodeAtlas – Competitive Programming Intelligence Platform

A full-stack analytics and growth intelligence platform for competitive programmers. CodeAtlas aggregates practice data from **Codeforces** and **LeetCode**, computes detailed performance metrics, visualizes problem-solving patterns, and delivers **AI-powered personalized practice recommendations** based on your weakest topics.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue?style=flat-square)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.5+-green?style=flat-square)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## 🚀 Quick Start

Get up and running in **5 minutes**:

```bash
# Clone and navigate
git clone <repo-url> && cd CodeAtlas

# Terminal 1: Backend (port 5000)
cd server
npm install
cp .env.example .env  # Configure your keys
npm run dev

# Terminal 2: Frontend (port 5173)
cd client
npm install
npm run dev
```

Visit **http://localhost:5173** → Register → Add your Codeforces handle → View live analytics!

---

## ✨ Core Features

### 📊 **Real-Time Analytics Dashboard**
- **Rating History Chart** – Visualize your Codeforces rating progression over time with interactive line charts
- **Problem Solver Summary** – Quick stat cards showing total problems solved on each platform
- **Consistency Heatmap** – GitHub-style daily activity heatmap showing your submission streaks across both platforms
- **Difficulty Breakdown** – Bar charts categorizing solved problems by Easy/Medium/Hard tiers
- **Weak Topic Detection** – Automatic accuracy analysis per problem tag (DP, greedy, graphs, etc.) to identify learning gaps
- **Merged Activity View** – Combined submission calendar from both Codeforces and LeetCode for full-platform visibility

### 🤖 **AI-Powered Problem Recommendations**
- **Smart Practice Queue** – Analyzes your weak topics and uses **OpenAI GPT-4o** to recommend 5 targeted problems with difficulty, platform, and reasoning
- **Daily Caching** – Recommendations cached per user per day to optimize API usage
- **Graceful Degradation** – Clear error messaging if AI key is not configured (recommendations still available via fallback)

### 🏆 **Goal Tracking**
- Set weekly problem-solving targets (e.g., "Solve 7 DP problems this week")
- Real-time progress syncing from both Codeforces submissions and LeetCode calendar data
- Visual progress indicators and completion tracking

### 📝 **Personal Problem Notes**
- Save quick notes on challenging problems
- Mark problems for revisit and organize learnings
- Lightweight, fast note storage

### 🌐 **Shareable Public Profiles**
- Share your progress publicly via `/u/:username`
- Display name, problem counts, rating, and platform achievements
- Perfect for portfolio building and competition tracking

### 👥 **Friends & Leaderboard**
- Add friends and view their stats side-by-side
- Platform-agnostic leaderboard showing both Codeforces ratings and LeetCode solved counts
- Compare progress and stay motivated

---

## 🏗️ Architecture Overview

### **Frontend (React + Vite)**
```
client/
├── src/
│   ├── pages/         # Route components (Dashboard, LeetCode, Codeforces, etc.)
│   ├── components/    # Reusable UI components (AppShell, navigation)
│   ├── api/           # Axios API clients for each service
│   ├── context/       # React Context for auth state
│   ├── App.jsx        # Main routing
│   └── main.jsx       # Entry point
```

**Key Libraries:**
- **React Router v6** – Client-side routing with protected routes
- **Recharts** – Beautiful, responsive data visualizations
- **React Calendar Heatmap** – GitHub-style contribution graphs
- **Tailwind CSS** – Utility-first styling
- **Axios** – Promise-based HTTP client

### **Backend (Express.js + MongoDB)**
```
server/
├── index.js           # App initialization
├── controllers/       # Route handlers (auth, stats, recommendations)
├── services/          # Business logic (data fetching, caching, AI)
├── models/            # Mongoose schemas (User, Goal, Note, etc.)
├── routes/            # Express route definitions
├── middleware/        # Auth, rate limiting
├── config/            # Redis, database configuration
└── utils/             # Helpers (validation, stats computation)
```

**Key Libraries:**
- **Express.js** – Lightweight HTTP framework
- **Mongoose** – MongoDB ODM with schema validation
- **Redis** – In-memory cache for API responses (30-min TTL)
- **JWT** – Stateless authentication
- **bcryptjs** – Password hashing
- **express-validator** – Request validation
- **express-rate-limit** – DDoS protection

### **Database Layer**
- **MongoDB** – Stores users, goals, notes, cached recommendations, public profiles
- **Redis** – Caches Codeforces and LeetCode stats (30-minute TTL) to minimize external API calls

### **External APIs**
- **Codeforces REST API** – User info, rating history, submission details
- **LeetCode Vercel API** – User stats, contest data, submission calendar
- **OpenAI Chat Completions** – GPT-4o problem recommendations (optional)

---

## ⚙️ Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | React | 18.3+ |
| **Build Tool** | Vite | 5.4+ |
| **Styling** | Tailwind CSS | 3.4+ |
| **HTTP Client** | Axios | 1.6+ |
| **Charts** | Recharts | 2.11+ |
| **Backend** | Express.js | 4.18+ |
| **Runtime** | Node.js | 18+ |
| **ORM** | Mongoose | 7.5+ |
| **Database** | MongoDB | 7.5+ |
| **Cache** | Redis | 6.2+ |
| **Auth** | JWT + bcryptjs | - |
| **AI** | OpenAI API | GPT-4o-mini |

---

## 📋 Installation & Configuration

### **Prerequisites**
- Node.js v18 or higher
- npm or yarn
- MongoDB Atlas account (free tier works)
- Redis instance (local or cloud)
- OpenAI API key (optional, for AI recommendations)

### **1️⃣ Backend Setup**

```bash
cd server
npm install
```

Create `.env` file:
```env
# Core Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codeatlas
REDIS_URL=redis://localhost:6379
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# OpenAI (Optional – for AI recommendations)
OPENAI_API_KEY=sk-...your-key...
OPENAI_MODEL=gpt-4o-mini

# External APIs (Auto-configured, no keys needed)
CF_API_BASE=https://codeforces.com/api
LC_API_BASE=https://leetcode-api-pied.vercel.app
```

**Start development server:**
```bash
npm run dev        # Watch mode with nodemon
npm run start      # Production
```

### **2️⃣ Frontend Setup**

```bash
cd client
npm install
```

Create `.env` file:
```env
VITE_API_BASE=http://localhost:5000/api
```

**Start development server:**
```bash
npm run dev        # Vite dev server on http://localhost:5173
npm run build      # Production build
npm run preview    # Preview built app
```

---

## 🔌 API Endpoints

### **Authentication**
- `POST /api/auth/register` – Create account
- `POST /api/auth/login` – Get JWT token
- `POST /api/auth/logout` – Clear session

### **User Stats**
- `GET /api/codeforces/stats` – User's Codeforces analytics (auth required)
- `GET /api/leetcode/stats` – User's LeetCode analytics (auth required)
- `GET /api/profile/public/:username` – Public profile view (no auth)

### **Recommendations**
- `GET /api/recommendations` – Get AI-powered problem recommendations (auth required)

### **Goals**
- `POST /api/goals/create` – Create weekly goal
- `GET /api/goals/current` – Fetch current week's goal
- `PUT /api/goals/:id` – Update goal progress

### **Notes**
- `POST /api/notes/create` – Save problem note
- `GET /api/notes` – Fetch user's notes
- `DELETE /api/notes/:id` – Delete note

### **Friends**
- `GET /api/friends/leaderboard` – Global leaderboard (both platforms)
- `POST /api/friends/add` – Add user as friend

---

## 🗄️ Caching & Performance

### **Redis Strategy**
- Profile stats cached for **30 minutes** per user
- Cache key format: `cf:user:{userId}`, `lc:user:{userId}`
- Automatic cache refresh on TTL expiry
- Recommendations cached per user per day in MongoDB

### **Database Indexes**
- MongoDB indexes on `userId`, `cacheDate`, `email` for fast lookups
- Compound indexes on time-series queries

---

## 🔐 Security Features

- **JWT Authentication** – Stateless, expiry-based tokens
- **Password Hashing** – bcryptjs with salt rounds = 10
- **Rate Limiting** – 100 requests/15 minutes per IP
- **Input Validation** – express-validator schemas on all endpoints
- **CORS** – Configured for localhost dev, restricted for production
- **Environment Secrets** – Never commit `.env` files

---

## 🚀 Deployment

### **Backend (Heroku / Railway / Render)**
```bash
# Ensure Procfile exists
echo "web: node index.js" > server/Procfile

# Set environment variables on platform dashboard
# Then deploy
git push heroku main
```

### **Frontend (Vercel / Netlify)**
```bash
# Build
cd client && npm run build

# Deploy dist/ folder
# Or connect repo directly to Vercel/Netlify for auto-deploy
```

### **Database**
- Use **MongoDB Atlas** (free tier available)
- Use **Redis Cloud** or **Upstash** for Redis hosting

---

## 📚 Project Structure Deep Dive

```
CodeAtlas/
├── server/
│   ├── config/
│   │   ├── env.js          # Environment config loader
│   │   └── redis.js        # Redis connection
│   ├── controllers/        # Request handlers
│   │   ├── authController.js
│   │   ├── cfController.js
│   │   ├── lcController.js
│   │   ├── recommendationsController.js
│   │   ├── goalsController.js
│   │   └── ...
│   ├── services/           # Business logic
│   │   ├── codeforcesService.js      # CF data + caching
│   │   ├── leetcodeService.js        # LC data + caching
│   │   └── recommendationService.js  # AI prompt + parsing
│   ├── models/             # MongoDB schemas
│   │   ├── user.js
│   │   ├── Goal.js
│   │   ├── Note.js
│   │   ├── RecommendationCache.js
│   │   └── ...
│   ├── routes/             # API routes
│   ├── middleware/         # Auth, rate limiting
│   ├── utils/              # Helpers
│   └── tests/              # Test suite
│
├── client/
│   ├── src/
│   │   ├── pages/          # Full-page components
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── CodeforcesPage.jsx
│   │   │   ├── LeetCodePage.jsx
│   │   │   ├── PublicProfilePage.jsx
│   │   │   └── ...
│   │   ├── components/     # Reusable UI
│   │   │   └── AppShell.jsx
│   │   ├── api/            # Axios clients
│   │   │   ├── auth.js
│   │   │   ├── cf.js
│   │   │   ├── lc.js
│   │   │   └── ...
│   │   ├── context/        # React Context
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx         # Main router
│   │   └── main.jsx        # Entry
│   ├── index.html
│   └── tailwind.config.js
│
├── README.md              # This file
└── package.json
```

---

## 🧪 Testing

Run backend tests:
```bash
cd server
npm test
```

Frontend testing (add Jest/Vitest):
```bash
cd client
npm test
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check MongoDB connection
# Check Redis is running: redis-cli ping
# Check PORT 5000 is free: lsof -i :5000
```

### Frontend can't connect to backend
```bash
# Verify VITE_API_BASE in client/.env
# Check backend is running on http://localhost:5000
# Check CORS is enabled
```

### Recommendations not working
```bash
# Check OPENAI_API_KEY in server/.env
# Check API key is valid and has quota
# Check error logs in browser console
```

### Stats not refreshing
```bash
# Clear Redis cache: redis-cli FLUSHDB
# Manually set handle again in settings
# Check Codeforces/LeetCode API status
```

---

## 📖 How It Works

### **User Registration & Auth Flow**
1. User registers with email + password
2. Password hashed with bcryptjs, stored in MongoDB
3. On login, JWT token issued (valid for session)
4. Token stored in browser, sent with every API request
5. Backend validates JWT before processing

### **Stats Fetching Pipeline**
1. User requests dashboard
2. Backend checks Redis cache (key: `cf:user:{userId}`)
3. If **fresh** (< 30 min old) → return cached data immediately
4. If **stale** → Fetch from external API (Codeforces/LeetCode)
5. Parse response, extract key metrics (rating, problems solved, tags, accuracy)
6. Store in Redis + MongoDB, return to frontend
7. Frontend renders real-time charts and stats

### **AI Recommendation Flow**
1. User navigates to Recommendations page
2. Backend fetches user's weak topics from Codeforces stats
3. Checks MongoDB for today's cached recommendations
4. If not found → Call OpenAI API with prompt
5. Parse JSON response, extract problem details (title, platform, URL, reasoning)
6. Cache result in DB, return to frontend
7. Frontend displays practice queue

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/cool-feature`
3. Commit changes: `git commit -m "Add cool feature"`
4. Push: `git push origin feature/cool-feature`
5. Open Pull Request

### Code Style
- Use ES6+ syntax
- Format with Prettier (if added)
- Keep components small and reusable
- Add comments for complex logic

---

## 📄 License

This project is licensed under the **MIT License** – see [LICENSE](LICENSE) file for details.

---

## 🙌 Acknowledgments

- **Codeforces** – For comprehensive competitive programming platform and open API
- **LeetCode** – For curated problem sets and learning analytics
- **OpenAI** – For powerful AI problem recommendations
- **React & Vite teams** – For blazing-fast dev experience
- **MongoDB & Redis communities** – For robust, scalable databases

---

## 📞 Support & Feedback

Have questions or found a bug?
- Open an issue on GitHub
- Check existing discussions
- Share feedback via email

Happy coding! 🚀 Track your growth, master your weak points, and ace your next competition!
