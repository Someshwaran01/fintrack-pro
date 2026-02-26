# 🎯 Quick Start - Multi-User Sync

## What's Been Added?

Your FinTrack Pro now supports **FREE multi-user syncing for up to 5 family members** using Supabase!

## ⚡ Quick Setup (5 minutes)

### 1. Create Supabase Account
- Go to https://supabase.com
- Sign up (free)
- Create a new project (wait 2 min)

### 2. Get Credentials
- Go to Settings → API
- Copy **Project URL** and **anon public** key

### 3. Configure App
Create `.env` file in your project root:
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### 4. Create Database Table
- Open Supabase → SQL Editor
- Run this query:

```sql
CREATE TABLE family_data (
  id BIGSERIAL PRIMARY KEY,
  family_id TEXT UNIQUE NOT NULL,
  bills JSONB DEFAULT '[]'::jsonb,
  medical JSONB DEFAULT '[]'::jsonb,
  home JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE family_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read family data" ON family_data FOR SELECT USING (true);
CREATE POLICY "Anyone can insert family data" ON family_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update family data" ON family_data FOR UPDATE USING (true);

CREATE INDEX idx_family_id ON family_data(family_id);

ALTER PUBLICATION supabase_realtime ADD TABLE family_data;
```

### 5. Run Your App
```bash
npm run dev
```

### 6. Set Up Family
- Generate a Family ID
- Share it with family members (max 5)
- Everyone joins with the same Family ID
- ✅ Real-time sync active!

## 📖 Full Documentation

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions and troubleshooting.

## ✨ Features

- ✅ Real-time sync across devices
- ✅ Up to 5 users (free tier)
- ✅ Offline support with local backup
- ✅ No daily quotas or limits
- ✅ 500MB storage (plenty for expense tracking!)

## 🔄 How It Works

1. **First user** generates a Family ID
2. **Share** the ID with family (like a password)
3. **Everyone joins** with the same ID
4. **All changes sync** instantly across all devices
5. **Works offline** too - syncs when back online

## 🚀 Why Supabase?

Unlike Firebase:
- **No daily read/write limits**
- **No quota issues**
- **Unlimited API requests**
- **Open source**
- **Better free tier for small teams**

---

**Ready to sync with your family?** Follow the steps above! 🎊
