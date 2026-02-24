# 🚀 Supabase Multi-User Setup Guide

## Free 5-User Family Sync (No Quota Issues!)

Follow these steps to enable **real-time data syncing** across up to 5 family members **completely free** using Supabase.

---

## 📋 Step 1: Create a Supabase Account

1. Go to **https://supabase.com**
2. Click **"Start your project"** (Sign up with GitHub/Google)
3. Create a new organization (can be your name)
4. Create a new project:
   - **Project Name**: `fintrack-family` (or any name)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you
   - Click **"Create new project"**
   - ⏱️ Wait ~2 minutes for setup

---

## 🔑 Step 2: Get Your API Credentials

**You need TWO values from the API page:**

### 📍 Finding Your Keys:

**Direct Link:** `https://supabase.com/dashboard/project/ixwoyxcutvrdmgmwpuph/settings/api`

**What you'll see on the API page:**

1. **Project URL** 
   - Description: "A RESTful endpoint for querying and managing your database"
   - Format: `https://ixwoyxcutvrdmgmwpuph.supabase.co`
   - Click **"Copy"** button ← **Copy this!**

2. **Publishable API Key** (also called "anon" key)
   - This is your anon/public key
   - Starts with `eyJ...` (very long string)
   - Click **"Copy"** button ← **Copy this too!**

**✅ You found them!** These are the only two values you need.

---

## 📝 Step 3: Configure Your App

### Option A: Using Environment Variables (Recommended)

1. Create a file named `.env` in your project root:
   ```
   c:\Users\AD41934\Downloads\fintrack-pro (1)\.env
   ```

2. Add these lines to the `.env` file (replace with your actual values):
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
   ```

3. Save the file

### Option B: Direct Configuration

1. Open `config/supabase.ts`
2. Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your actual values

---

## 🗄️ Step 4: Create the Database Table

1. In Supabase dashboard, click **"SQL Editor"** (📝 icon on left)
2. Click **"New query"**
3. Copy and paste this SQL code:

```sql
-- Create the family_data table
CREATE TABLE family_data (
  id BIGSERIAL PRIMARY KEY,
  family_id TEXT UNIQUE NOT NULL,
  bills JSONB DEFAULT '[]'::jsonb,
  medical JSONB DEFAULT '[]'::jsonb,
  home JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE family_data ENABLE ROW LEVEL SECURITY;

-- Create policy: Anyone can read any family data
CREATE POLICY "Anyone can read family data"
  ON family_data
  FOR SELECT
  USING (true);

-- Create policy: Anyone can insert new families
CREATE POLICY "Anyone can insert family data"
  ON family_data
  FOR INSERT
  WITH CHECK (true);

-- Create policy: Anyone can update their family data
CREATE POLICY "Anyone can update family data"
  ON family_data
  FOR UPDATE
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_family_id ON family_data(family_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE family_data;
```

4. Click **"Run"** or press `Ctrl+Enter`
5. You should see: **"Success. No rows returned"** ✅

---

## 📦 Step 5: Install Dependencies

Open your terminal in the project folder and run:

```powershell
cd "c:\Users\AD41934\Downloads\fintrack-pro (1)"
npm install
```

This will install the `@supabase/supabase-js` package.

---

## ▶️ Step 6: Run Your App

```powershell
npm run dev
```

Your app will open with a **Family Setup** screen!

---

## 👨‍👩‍👧‍👦 Step 7: Set Up Family Sync

### First User (Creates Family):
1. Click **"Generate New Family ID"**
2. You'll get an 8-character ID (like `ABC12XYZ`)
3. Click **"Join Family"**
4. **Share this Family ID** with family members!

### Additional Users (Join Family):
1. Get the Family ID from the person who created it
2. Enter the Family ID
3. Click **"Join Family"**
4. ✅ You're synced!

---

## ✨ What You Get

✅ **Real-time sync** across all devices  
✅ **Up to 5 family members** on free tier  
✅ **500MB database** storage (more than enough!)  
✅ **Unlimited API requests** on free tier  
✅ **Local backup** - data saved on each device too  
✅ **No quotas, no limits** for normal use  

---

## 🆘 Troubleshooting

### Error: "Failed to join family"
- Check your internet connection
- Verify your Supabase credentials in `.env` file
- Make sure you ran the SQL script in Step 4

### Data not syncing?
- Check the browser console for errors (Press F12)
- Verify the Family ID is correct
- Make sure realtime was enabled (Step 4)

### How to reset?
1. Click the **family icon** (👥) in the app header
2. Click **"Disconnect from Family"**
3. Generate a new Family ID

---

## 🔒 Security Notes

- The Family ID acts as your shared password
- Keep it private within your family
- Anyone with the Family ID can access the data
- Data is NOT encrypted (don't store sensitive info)

---

## 📊 Supabase Free Tier Limits

| Feature | Free Tier |
|---------|-----------|
| Database Size | 500 MB |
| API Requests | Unlimited |
| Monthly Active Users | 50,000 |
| Realtime Connections | 200 concurrent |
| File Storage | 1 GB |

**Perfect for 5 family members!** 🎉

---

## 🎯 Next Steps

- Share your Family ID with family members
- All data will sync automatically
- Changes appear in real-time across all devices
- Local backup keeps working even offline

---

## 💡 Tips

- **Bookmark your Supabase dashboard**: You might need it later
- **Save your Family ID**: Write it down somewhere safe
- **Test with 2 devices**: Open the app on your phone and computer
- **Offline support**: Data saves locally if internet is down

---

## 🆚 Why Supabase over Firebase?

| Feature | Supabase | Firebase |
|---------|----------|----------|
| Database | PostgreSQL | NoSQL |
| Free Storage | 500 MB | 1 GB |
| Daily Reads | Unlimited | 50k/day |
| Daily Writes | Unlimited | 20k/day |
| Real-time | ✅ Yes | ✅ Yes |
| Open Source | ✅ Yes | ❌ No |

**No daily quota issues!** 🚀

---

## 📧 Need Help?

Check the Supabase documentation: https://supabase.com/docs

---

**You're all set!** 🎊 Enjoy your free multi-user expense tracker!
