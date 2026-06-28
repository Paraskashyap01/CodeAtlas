# CP Growth Tracker (CodeAtlas)

**Status**: ✅ **FULLY FUNCTIONAL & PRODUCTION-READY**

A premium, full-stack competitive programming analytics and growth platform. CP Growth Tracker aggregates your practice data from Codeforces and LeetCode, computes detailed topic/difficulty metrics, and delivers personalized daily problem recommendations via AI based on your weakest concepts.

---

## 📋 Documentation

- **🚀 [QUICKSTART.md](QUICKSTART.md)** — Get running in 5 minutes
- **📚 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** — Complete feature documentation & architecture
- **🔍 [VERIFICATION_REPORT.md](VERIFICATION_REPORT.md)** — Testing results & tech specs
- **🌐 [DEPLOYMENT.md](DEPLOYMENT.md)** — Production deployment guide (Vercel + Render)

---

## 🎯 Current Status

All 9 build steps **complete and tested**:

| Step | Feature | Status |
|------|---------|--------|
| 1 | MongoDB Setup | ✅ Working |
| 2 | Auth Backend | ✅ Tested |
| 3 | Auth Frontend | ✅ Tested |
| 4 | Codeforces API | ✅ Live Data |
| 5 | LeetCode GraphQL | ✅ Working |
| 6 | Dashboard UI | ✅ Charts Rendering |
| 7 | AI Recommendations | ✅ Generating |
| 8 | Goals + Notes | ✅ Persisting |
| 9 | Public Profile | ✅ Shareable |

---

## ⚡ Quick Start (5 Minutes)

```bash
# Terminal 1: Start Backend
cd server
npm run dev

# Terminal 2: Start Frontend
cd client
npm run dev
```

Then visit `http://localhost:5173` and:
1. Register with any email/password
2. Add your Codeforces handle (e.g., "tourist")
3. Watch dashboard load with real stats!

👉 **For detailed setup**: See [QUICKSTART.md](QUICKSTART.md)

---

## 🎯 Features

### 📊 Deep Analytics Dashboard
- **Rating History:** Interactive line chart showing your Codeforces rating journey over time.
- **Problem Solver Volume:** Quick-glance cards summarizing problems solved across platforms.
- **Consistent Heatmap:** A GitHub-style calendar heatmap displaying daily accepted submissions.
- **Difficulty Distribution:** Beautiful bar charts categorizing solved problems into Easy, Medium, and Hard buckets.
- **Weak Topic Identification:** Automatical accuracy computation per tag (e.g., dynamic programming, greedy, graphs) based on historical submission status.

### 🤖 AI-Powered Practice Queue
- **Targeted Practice:** Analyzes your identified weak topics and prompts an LLM (OpenAI or Anthropic) to recommend 5 high-yield practice problems with customized explanations.
- **Graceful Fallbacks:** Built-in offline recommendation logic if LLM keys are not configured.
- **Daily Caching:** Recommendations are generated and cached once per user per day to prevent API quota strain.

### 🎯 Goal Tracking & Streaks
- **Weekly Objectives:** Set custom weekly goals (e.g., "Solve 5 DP problems") and track progress dynamically.
- **Lightweight Progress Bar:** Visual completion indicators.
- **Streak & Reminders:** Integrates with `node-cron` and `Nodemailer` for optional daily nudge emails.

### 📝 Personal Problem Notes
- Keep lightweight notes on challenging problems.
- Demarcate which problems require a revisit.

### 🌐 Shareable Public Profiles
- Share your progress publicly at `/u/:username` featuring your name, solved count, rating, and difficulty distribution.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React (Vite), React Router v6, Context API, Tailwind CSS, Recharts, `react-calendar-heatmap` |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Integrations** | Codeforces REST API, LeetCode GraphQL, OpenAI / Anthropic APIs |
| **Automation** | `nodemailer`, `node-cron` |

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas database URI

### 1. Backend Setup
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server/` directory:
   ```env
   MONGODB_URI=your_mongodb_atlas_uri
   PORT=5000
   JWT_SECRET=your_jwt_secret
   
   # Optional: AI Recommendations
   # Uncomment one of the sections below to enable real LLM recommendations
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4o-mini
   
   # OR Anthropic
   # ANTHROPIC_API_KEY=your_anthropic_api_key
   # ANTHROPIC_MODEL=claude-3-5-haiku-latest
   
   # OR Google Gemini
   # GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key
   # GOOGLE_GEMINI_MODEL=gemini-1.5
   
   # Optional: Email Nudges
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   EMAIL_FROM=CP Growth Tracker <your_email@gmail.com>
   ```
4. Start the server in development mode:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `client/` directory:
   ```env
   VITE_API_BASE=http://localhost:5000/api
   ```
4. Start the client dev server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

---

## 💾 Caching Strategy
To respect Codeforces and LeetCode API limits, profile stats are stored in the database. 
- API calls check for cached documents.
- If the cache is **fresh** (fetched less than 30 minutes ago), the cached data is returned immediately.
- Otherwise, a new request is made to the platform, and the database cache is updated.

---

## 📄 License
This project is licensed under the MIT License.
