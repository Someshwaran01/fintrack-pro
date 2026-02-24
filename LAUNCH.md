# 🚀 Launch Instructions

## Your App is Already Live! ✅

**Visit these URLs:**
- GitHub Pages: https://someshwaran01.github.io/Fin-Track/
- Vercel: (Check your Vercel dashboard)

---

## 💻 Run Locally (Development)

```powershell
# Step 1: Install dependencies (first time only)
npm install

# Step 2: Start development server
npm run dev
```

**Open browser:** http://localhost:3000

---

## 📱 Get Mobile APK

### Use PWABuilder (Easiest - No Setup)

1. Go to: https://www.pwabuilder.com/
2. Enter your **Vercel URL** (not GitHub Pages!)
3. Click "Start"
4. Select "Package for Stores" → "Android"
5. Settings:
   - Start URL: `/`
   - Scope: `/`
   - Display: `standalone`
6. Download APK
7. Transfer to phone and install

---

## 🔄 Deploy Updates

```powershell
# After making changes:
git add .
git commit -m "Description of changes"
git push

# Automatically deploys to GitHub Pages & Vercel!
```

---

## ⚡ Quick Commands

```powershell
npm run dev       # Start local development
npm run build     # Build for production
npm run preview   # Preview production build
```

---

## 📁 Essential Files

- `App.tsx` - Main application
- `components/` - UI components
- `services/` - Data storage
- `types.ts` - TypeScript types
- `vite.config.ts` - Build configuration
- `.env.local` - API key (optional)

---

## 💡 Tips

- **Gemini API Key:** Edit `.env.local` for AI features
- **Data Storage:** All data saved in browser localStorage
- **Offline:** Works offline after first visit
- **Export:** CSV export available in app header

---

**That's it! App is ready to use! 🎉**

Check README.md for detailed documentation.
