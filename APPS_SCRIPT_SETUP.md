# Google Apps Script Setup Guide
## Complete Solution for Google Sheets Read/Write Access

### Step 1: Open Your Google Sheet
1. Go to your sheet: https://docs.google.com/spreadsheets/d/1v6mUZqe1AXW3D5b1PUjWKzdvDkAD45uTEXl5nWnEwrw
2. Click **Extensions** → **Apps Script**
3. Delete any existing code

### Step 2: Copy This Apps Script Code

```javascript
// Google Apps Script - Somu Fin Tracker Backend API
// Deploy this as a Web App to get read/write access

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
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Clear existing data
    sheet.clear();
    
    // Write new data
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

### Step 3: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ → Select **Web app**
3. Fill in:
   - **Description:** Somu Fin Tracker API
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone
4. Click **Deploy**
5. Click **Authorize access** → Choose your Google account
6. Click **Advanced** → **Go to Somu Fin Tracker (unsafe)** → **Allow**
7. **COPY THE WEB APP URL** (looks like: https://script.google.com/macros/s/ABC123.../exec)

### Step 4: Update Your App

Open `services/googleSheets.ts` and replace the `SCRIPT_URL` with your web app URL:

```typescript
const SCRIPT_URL = 'YOUR_WEB_APP_URL_HERE';
```

### That's It! ✅

Now your app has full read/write access to Google Sheets:
- ✅ Data saves automatically to sheet
- ✅ All 3 devices sync within 30 seconds
- ✅ Works offline (saves locally, syncs when online)
- ✅ 100% free forever
- ✅ No backend server needed

### Troubleshooting

**"Authorization required"**
- Redeploy and authorize again
- Make sure "Who has access" is set to "Anyone"

**"Sheet not found"**
- Make sure tabs are named exactly: Bills, Medical, Home

**"Script execution failed"**
- Check the Apps Script logs (View → Execution log)
