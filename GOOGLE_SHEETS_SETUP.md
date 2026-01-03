# Google Sheets Cloud Sync Setup Guide

## 🎯 Overview
Use Google Sheets as a free cloud database for family data sharing. No quota limits!

## 📋 Step-by-Step Setup

### Step 1: Create Google Sheet
1. Go to https://sheets.google.com
2. Click **"+ Blank"** to create new sheet
3. Name it: **"Somu Fin Tracker Data"**
4. Create 3 sheets (tabs at bottom):
   - Rename "Sheet1" to **"Bills"**
   - Click **+** to add new sheet, name it **"Medical"**
   - Click **+** to add new sheet, name it **"Home"**

5. **Copy the Sheet ID** from URL:
   ```
   https://docs.google.com/spreadsheets/d/COPY_THIS_PART/edit
   ```
   Example: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms1v6mUZqe1AXW3D5b1PUjWKzdvDkAD45uTEXl5nWnEwrw`

### Step 2: Make Sheet Public (Simplest Method)

1. Click **"Share"** button (top right)
2. Click **"Change to anyone with the link"**
3. Set permission to **"Viewer"** (read-only for public, app will write)
4. Click **"Done"**

⚠️ **Note**: This makes the sheet publicly viewable but only your app can write to it.

### Step 3: Get Google Sheets API Key

1. Go to https://console.cloud.google.com/
2. Click **"Select a project"** → **"NEW PROJECT"**
3. Name: **"Somu Fin Tracker"** → Click **"Create"**
4. Wait 30 seconds, then select the new project

5. **Enable Google Sheets API:**
   - Search for "Google Sheets API" in the search bar
   - Click **"Google Sheets API"**
   - Click **"ENABLE"**

6. **Create API Key:**
   - Click **"Credentials"** in left menu
   - Click **"+ CREATE CREDENTIALS"**
   - Choose **"API key"**
   - Copy the API key (looks like: `AIzaSyBWPZpXDan8iApBLnQ6xd5CkmWAFUAT1fw`)
   - Click **"RESTRICT KEY"** (recommended)
   - Under "API restrictions", select **"Restrict key"**
   - Check **"Google Sheets API"**
   - Click **"Save"**

### Step 4: Update App Configuration

Open `services/googleSheets.ts` and replace:

```typescript
const SHEET_ID = 'YOUR_SHEET_ID_HERE'; // Paste your Sheet ID
const API_KEY = 'YOUR_API_KEY_HERE';   // Paste your API key
```

Example:
```typescript
const SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
const API_KEY = 'AIzaSyDp8kW-0oOo4UfS8_tCtIjklC7iyn0slXk';
```

### Step 5: Test the Integration

1. Run your app
2. Add an expense (bills, medical, or home)
3. Check your Google Sheet - data should appear!
4. Open app on another device
5. Should see the same data within 30 seconds

## ✅ How It Works

**When you add/edit/delete:**
- Data saves to Google Sheets immediately
- Other devices check for updates every 30 seconds
- You can also manually view/edit data in the Google Sheet!

**Advantages:**
- ✅ Unlimited free usage (no quota issues)
- ✅ View data in beautiful spreadsheet
- ✅ Can manually edit if needed
- ✅ Can export to Excel, PDF, etc.
- ✅ No bot attacks

**Limitations:**
- ⚠️ Not instant (30 second sync delay)
- ⚠️ Slightly slower than Firebase
- ⚠️ Sheet is publicly viewable (but data is safe)

## 🔒 Privacy

Your financial data is in a Google Sheet that:
- Only people with the link can view
- Your family doesn't need to share the link (app has it built-in)
- Data is as secure as any Google Drive file
- You can always make it fully private (requires OAuth setup)

## 🆘 Troubleshooting

### "Failed to sync to Google Sheets"
- Check if Sheet ID is correct
- Check if API key is correct
- Make sure sheet is shared "Anyone with link can view"
- Make sure Google Sheets API is enabled in Google Cloud Console

### Data not appearing on other device
- Wait 30-60 seconds (not instant like Firebase)
- Refresh the page
- Check internet connection
- Check browser console for errors

### Want faster sync?
- Can reduce polling interval from 30s to 10s (increases API calls)
- Or use Firebase with secure rules (better option)

## 💡 Pro Tip

You can open the Google Sheet anytime to:
- See all your family's financial data
- Create charts and graphs
- Export to Excel
- Share with accountant (view-only link)
- Backup data manually
