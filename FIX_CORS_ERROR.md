# Fix CORS Error - Apps Script Deployment

## The Problem
You're getting a CORS error because the Google Apps Script deployment settings are incorrect or the deployment is outdated.

## Solution: Redeploy Apps Script with Correct Settings

### Step 1: Open Apps Script
1. Go to your Google Sheet: https://docs.google.com/spreadsheets/d/1v6mUZqe1AXW3D5b1PUjWKzdvDkAD45uTEXl5nWnEwrw
2. Click **Extensions** → **Apps Script**

### Step 2: Verify Your Code
Make sure your Apps Script has this exact code (copy if needed):

```javascript
// Google Apps Script - Somu Fin Tracker Backend API
const SHEET_ID = '1v6mUZqe1AXW3D5b1PUjWKzdvDkAD45uTEXl5nWnEwrw';

function doGet(e) {
  const action = e.parameter.action;
  const sheet = e.parameter.sheet;
  
  if (action === 'get' && sheet) {
    return getData(sheet);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid request' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const sheetName = data.sheet;
    const values = data.values;
    
    if (action === 'save' && sheetName && values) {
      return saveData(sheetName, values);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: 'Invalid request' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getData(sheetName) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'Sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    
    return ContentService.createTextOutput(JSON.stringify({ data: data, success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveData(sheetName, values) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    sheet.clear();
    
    if (values.length > 0) {
      sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Step 3: Create NEW Deployment (CRITICAL!)

**Important: Don't update the old deployment - create a BRAND NEW one!**

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Select **Web app**
4. Fill in these settings **EXACTLY**:
   - **Description:** `Somu Fin Tracker API v2`
   - **Execute as:** **Me (your-email@gmail.com)** ← MUST be "Me"
   - **Who has access:** **Anyone** ← MUST be "Anyone"
5. Click **Deploy**
6. If asked to authorize:
   - Click **Authorize access**
   - Choose your Google account
   - Click **Advanced**
   - Click **Go to Somu Fin Tracker (unsafe)**
   - Click **Allow**
7. **COPY THE NEW WEB APP URL** - it will look like:
   ```
   https://script.google.com/macros/s/DIFFERENT_ID_HERE/exec
   ```

### Step 4: Update Your App Code

1. Open `services/googleSheets.ts` in your code
2. Find line 5 that says:
   ```typescript
   const SCRIPT_URL = 'https://script.google.com/macros/s/...';
   ```
3. Replace it with your NEW deployment URL from Step 3
4. Save the file

### Step 5: Test the Fix

1. **Rebuild your app:** Run `npm run dev` in terminal
2. Open your app in browser
3. Open browser console (F12)
4. Click the **Manual Sync button** (rotate icon)
5. Check console for logs

**You should now see:**
- ✅ `Bills saved to Google Sheets`
- ✅ `Medical expenses saved to Google Sheets`
- ✅ `Home expenses saved to Google Sheets`

**No more CORS errors!**

### Why This Happens

CORS errors with Google Apps Script occur when:
- ❌ Deployment is set to "Execute as: User accessing the web app" (WRONG)
- ❌ "Who has access" is set to "Only myself" (WRONG)
- ❌ Using an old/outdated deployment URL
- ❌ The deployment was never properly authorized

### Verify It's Working

1. Add a new expense in your app (e.g., ₹100 for Groceries)
2. Click Manual Sync button
3. Open your Google Sheet
4. Refresh the page
5. The new data should appear!

### Still Getting CORS Error?

**Double-check:**
1. The Apps Script deployment is set to "Execute as: Me"
2. "Who has access" is "Anyone"
3. You copied the ENTIRE URL including `/exec` at the end
4. You created a NEW deployment (not updated old one)
5. You authorized the script when prompted

**Advanced Debug:**
1. Open browser console
2. Look for the exact URL being called in the Network tab
3. Make sure it matches your SCRIPT_URL

### Alternative: Test Direct Access

Open this URL in your browser (replace with YOUR script URL):
```
https://script.google.com/macros/s/YOUR_ID_HERE/exec?action=get&sheet=Home
```

**Expected response:** JSON data like `{"data":[["ID","Date","Amount"...]],"success":true}`

If you get a blank page or download prompt, the deployment is working. If you get an error page, redeploy.
