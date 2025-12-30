# FinTrack Pro - Financial Expense Tracker

A Progressive Web App for tracking credit card bills and medical expenses with AI-powered insights.

---

## 🚀 Your App is Live!

**Deployed URLs:**
- **GitHub Pages:** https://someshwaran01.github.io/Fin-Track/
- **Vercel:** Check your Vercel dashboard

---

## 📱 Features

✅ Credit Card Bill Tracking  
✅ Medical Expense Management  
✅ AI Financial Insights (Gemini API)  
✅ Offline Support (PWA)  
✅ CSV Export  
✅ Interactive Dashboard

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+ (download from https://nodejs.org/)

### Run Locally
### Run Locally

```powershell
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit: http://localhost:3000

---

## 🌐 Deployment

### GitHub Pages (Automatic)
- Push code to main branch → Auto-deploys
- URL: https://someshwaran01.github.io/Fin-Track/

### Vercel (Automatic)
- Connected to GitHub → Auto-deploys on push
- Check Vercel dashboard for URL

---

## 📱 Create Mobile APK

### Option 1: PWABuilder (Recommended - No Android Studio)

1. Use your **Vercel URL** (not GitHub Pages)
2. Go to: https://www.pwabuilder.com/
3. Enter Vercel URL → Start
4. Package for Stores → Android
5. Configure:
   - Start URL: `/`
   - Scope: `/`
   - Display: `standalone`
6. Download APK

### Option 2: Capacitor (Requires Android Studio)

```powershell
# Add Android platform
npx cap add android

# Sync files
npx cap sync

# Open in Android Studio
npx cap open android

# Build → Build APK in Android Studio
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🔧 Configuration

### API Key (For AI Features)
Edit `.env.local`:
```
GEMINI_API_KEY=your_actual_key_here
```

Then rebuild and push to deploy.

---

## 📁 Project Structure

```
fintrack-pro/
├── components/          # React components
├── services/           # Storage service
├── .github/workflows/  # Auto-deployment
├── App.tsx            # Main app
├── types.ts           # TypeScript definitions
├── vite.config.ts     # Build config
└── package.json       # Dependencies
```

---

## 🔄 Update Your App

```powershell
# Make changes, then:
git add .
git commit -m "Your update"
git push

# Auto-deploys to GitHub Pages & Vercel!
```

---

## 💡 Usage

**Track Bills:** Bills tab → Add credit card payments & EMIs  
**Track Medical:** Medical tab → Add healthcare expenses  
**AI Insights:** Click ✨ icon for financial tips  
**Export Data:** Click export icon for CSV

---

## 🐛 Troubleshooting

**Blank page?** Hard refresh: `Ctrl + Shift + R`  
**Build fails?** Delete `node_modules` → `npm install` → retry  
**APK opens browser?** Use Vercel URL in PWABuilder, not GitHub Pages

---

## 📊 Tech Stack

React 19 • TypeScript • Vite • TailwindCSS • Recharts • Gemini AI • PWA

---

**Ready to use! Visit your deployed URL! 🎉**

