# Debug Sync Issues - Step by Step Guide

## Current Issues to Debug:
1. **Manual Sync**: Shows "some data failed to sync"
2. **CC Bills Tab**: Not working

---

## Step 1: Check Browser Console for Detailed Errors

1. **Open your app**
2. **Press F12** to open Developer Tools
3. **Click on Console tab**
4. **Click the Manual Sync button** (rotate icon)

### What to Look For:

**Expected Console Output:**
```
🔄 Manual sync started...
Data to sync - Bills: X, Medical: X, Home: X
📤 Saving X bills to Google Sheets...
📤 Saving X medical expenses to Google Sheets...
📤 Saving X home expenses to Google Sheets...
✅ Bills saved to Google Sheets: {success: true}
✅ Medical expenses saved to Google Sheets: {success: true}
✅ Home expenses saved to Google Sheets: {success: true}
Sync results: {bills: true, medical: true, home: true}
✅ Manual sync completed successfully
```

**Common Error Patterns:**

### Error 1: CORS Error
```
Access to fetch at 'https://script.google.com/...' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```
**Fix:** Apps Script deployment issue
- Go to Apps Script → Deploy → Manage deployments
- Make sure "Who has access" is set to **Anyone**
- Redeploy if needed

### Error 2: 403 Forbidden
```
❌ Failed to save bills. Status: 403 Forbidden
```
**Fix:** Permission issue
- The Apps Script doesn't have permission to write to the sheet
- Reauthorize the Apps Script

### Error 3: Wrong URL
```
❌ Error saving bills: TypeError: Failed to fetch
```
**Fix:** Check the URL in `services/googleSheets.ts` line 5
- Make sure it matches your deployed Apps Script URL
- URL should end with `/exec` not `/dev`

### Error 4: Empty Response
```
❌ Failed to save bills. Status: 200 OK
Error details: <HTML error page>
```
**Fix:** Apps Script code issue
- The script returned HTML instead of JSON
- Check Apps Script logs for errors

---

## Step 2: Check CC Bills Tab Issue

### Test 1: Check if bills exist
In browser console, type:
```javascript
localStorage.getItem('bills')
```

**Expected:** Should show JSON array of bills
**If null:** No bills stored

### Test 2: Check for JavaScript errors
1. Click on **CC Bills** tab
2. Look at console for red error messages
3. Common errors:
   - `Cannot read property 'map' of undefined`
   - `bills is not defined`

### Fix: Clear and Reload
If CC Bills tab is broken:
```javascript
// In browser console
localStorage.clear();
location.reload();
```

---

## Step 3: Verify Apps Script is Working

### Test the Apps Script Directly:

1. Open: https://script.google.com/home
2. Find your "Somu Fin Tracker" project
3. Click **Run** → Select `addTestData`
4. Check Execution Log

**Should see:** `✅ Test data added successfully!`

### Test GET Request:
In browser, open new tab and go to:
```
YOUR_SCRIPT_URL?action=get&sheet=Home
```

**Replace YOUR_SCRIPT_URL** with the URL from line 5 of `googleSheets.ts`

**Expected:** JSON response like:
```json
{
  "data": [
    ["ID", "Date", "Amount", "Payment Method", "Category", "Description"],
    ["123", "2026-01-03", 80, "UPI", "Groceries", "Test"]
  ],
  "success": true
}
```

**If you see HTML:** Wrong URL or deployment issue

---

## Step 4: Force Fresh Sync

### Option A: Re-enable Cloud Sync
1. Click cloud icon
2. Click "Disable Sync"
3. Wait 2 seconds
4. Click "Enable Google Sheets Sync"
5. Check console for sync messages

### Option B: Manual Data Entry Test
1. **Disable Cloud Sync**
2. Add ₹100 Groceries in Home tab
3. Open console
4. **Enable Cloud Sync**
5. Click Manual Sync
6. Watch console for specific errors

---

## Step 5: Check Google Sheet Directly

1. Open: https://docs.google.com/spreadsheets/d/1v6mUZqe1AXW3D5b1PUjWKzdvDkAD45uTEXl5nWnEwrw
2. Check if tabs exist: **Bills**, **Medical**, **Home**
3. Check if test data is there (from addTestData function)

**If tabs missing:** Run `addTestData()` in Apps Script

---

## Quick Fixes Checklist

### For "Some data failed to sync":
- [ ] Check which specific data failed (console shows: "Failed to sync: Bills, Medical")
- [ ] Verify Apps Script URL is correct
- [ ] Check Apps Script deployment settings (Anyone can access)
- [ ] Check network tab for HTTP status codes
- [ ] Verify sheet tabs are named exactly: Bills, Medical, Home

### For "CC Bills tab not working":
- [ ] Check console for errors when clicking tab
- [ ] Verify bills data exists in localStorage
- [ ] Try clearing localStorage and reloading
- [ ] Check if default cards are being created

---

## Advanced Debugging

### Enable Verbose Logging:
Add this in browser console:
```javascript
localStorage.setItem('debugMode', 'true');
```

### Check Network Requests:
1. Open DevTools → Network tab
2. Click Manual Sync
3. Filter by "Fetch/XHR"
4. Look for requests to `script.google.com`
5. Click on each request to see:
   - **Headers**: Request URL and method
   - **Payload**: Data being sent
   - **Response**: What came back

### Common Response Issues:
- **Response is HTML not JSON**: Deployment issue
- **Response is empty**: Apps Script error
- **Response has error field**: Check error message

---

## Contact Information

If still having issues, provide:
1. Console error messages (copy/paste)
2. Network tab screenshot
3. Apps Script execution log
4. Which specific tab/feature is failing

