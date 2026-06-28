# 🚀 CP Growth Tracker — Quick Start Guide

## In 5 Minutes: Get Your Dashboard Running

### 1️⃣ Start Backend (Terminal 1)
```bash
cd server
npm run dev
```
→ Runs on `http://localhost:5000`  
→ Connects to MongoDB  
→ APIs ready

### 2️⃣ Start Frontend (Terminal 2)
```bash
cd client
npm run dev
```
→ Runs on `http://localhost:5173`  
→ Opens in browser

### 3️⃣ Register & Login
- Visit `http://localhost:5173`
- Register: `your-email@example.com` / `password123`
- Auto-redirects to dashboard

### 4️⃣ Add Your Handles
- **Codeforces**: Type your CF username (e.g., "tourist")
- **LeetCode**: Type your LC username (e.g., "neetcode")
- Click **Save**

### 5️⃣ Watch Data Load 🎉
- **Rating chart** shows your Codeforces rating progression
- **Stats cards** display problems solved, current rating, LC counts
- **Weak topics** list shows where to focus practice
- **Heatmap** shows your submission calendar

---

## 🎮 Try These Features

### 📊 Dashboard
- Displays real Codeforces & LeetCode stats
- Charts update automatically
- Click "Save" after changing handles to refresh

### 🤖 Recommendations
- Click **Recs** in navigation
- Shows 5 weak topics
- Recommends problems to solve
- Updates daily

### 🎯 Goals
- Click **Goals** in navigation
- Set weekly target: "Solve 5 graph problems"
- Click **+1 solved** to track progress
- Progress bar updates in real-time

### 📝 Notes
- Click **Notes** in navigation
- Add notes to problems you struggled with
- Tag as "Revisit" for later review
- All notes saved and searchable

### 👤 Public Profile
- Click **Public** in navigation
- Get shareable link for your profile
- No login required to view
- Perfect for resume/portfolio

---

## 🔧 Configuration

### Backend `.env`
**server/.env**
```env
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=your-random-secret-key
PORT=5000
ALLOWED_ORIGIN=http://localhost:5173
```

### Frontend `.env`
**client/.env**
```env
VITE_API_BASE=http://localhost:5000/api
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Cannot GET /api/..." | Backend not running → Run `npm run dev` in server/ |
| "Connection refused" | Check MongoDB Atlas connection string in .env |
| "Charts not showing" | Add CF handle to dashboard, click Save |
| "0 problems solved" | Your CF account might be new, or handle is wrong |
| "Recommendations loading..." | Ensure CF handle is set first |

---

## 📚 Project Files

### Important Files
- `client/src/pages/DashboardPage.jsx` - Main stats display
- `server/controllers/cfController.js` - Codeforces data fetching
- `server/services/codeforcesService.js` - CF API client
- `PROJECT_SUMMARY.md` - Full documentation
- `DEPLOYMENT.md` - How to deploy to production

---

## 🎓 What You've Built

✅ **Full-stack app** with React + Node.js + MongoDB  
✅ **Real API integration** (Codeforces REST, LeetCode GraphQL)  
✅ **Smart caching** (30-minute TTL)  
✅ **AI recommendations** (with LLM support)  
✅ **Goal tracking** with progress visualization  
✅ **Public shareable profiles** for your portfolio  
✅ **Production-ready code** with error handling  

---

## 🚀 Next: Deploy to Production

See **DEPLOYMENT.md** for:
- Backend → Render
- Frontend → Vercel  
- Database → MongoDB Atlas
- Optional LLM API keys

---

## 💡 Tips

- **First Time?** Use "tourist" as CF handle to see demo data
- **Your CF Account?** Add your own handle to see your real stats
- **Want LLM Recommendations?** Add OpenAI or Anthropic API key (see DEPLOYMENT.md)
- **Share Your Profile?** Copy the `/u/` link and put it in your resume
- **Impress Interviewers?** Demo with a live CF account showing 500+ problems solved

---

## 📞 Need Help?

1. Check browser console (F12) for errors
2. Check terminal output for backend errors  
3. Read VERIFICATION_REPORT.md for detailed testing info
4. Review PROJECT_SUMMARY.md for feature explanations

---

**Ready?** Open `http://localhost:5173` and start tracking your growth! 🎉
