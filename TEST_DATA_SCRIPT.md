# Test Data Script for Google Sheets

## Add Test Data to Your Google Sheet

### Step 1: Open Apps Script
1. Go to your Google Sheet: https://docs.google.com/spreadsheets/d/1v6mUZqe1AXW3D5b1PUjWKzdvDkAD45uTEXl5nWnEwrw
2. Click **Extensions** → **Apps Script**
3. You'll see your existing sync code

### Step 2: Add This Test Function
Add this function at the bottom of your Apps Script code:

```javascript
function addTestData() {
  const ss = SpreadsheetApp.openById('1v6mUZqe1AXW3D5b1PUjWKzdvDkAD45uTEXl5nWnEwrw');
  
  // Add test data to Bills sheet
  let billsSheet = ss.getSheetByName('Bills');
  if (!billsSheet) {
    billsSheet = ss.insertSheet('Bills');
  }
  billsSheet.clear();
  billsSheet.getRange('A1:M3').setValues([
    ['ID', 'Card Name', 'Category', 'Due Date', 'Month', 'Is EMI', 'EMI Details', 'Total Amount', 'Tenure', 'Monthly Amount', 'Paid Amount', 'Last Payment Date', 'Payments'],
    ['1735956000001', 'HDFC Credit Card', 'Shopping', '15', 'Jan-26', 'No', '', 5000, '', 5000, 0, '', '[]'],
    ['1735956000002', 'ICICI Credit Card', 'Shopping', '10', 'Jan-26', 'No', '', 3500, '', 3500, 1500, '2026-01-03', '[{"id":"p1","amount":1500,"date":"2026-01-03","note":"Partial payment"}]']
  ]);
  
  // Add test data to Medical sheet
  let medicalSheet = ss.getSheetByName('Medical');
  if (!medicalSheet) {
    medicalSheet = ss.insertSheet('Medical');
  }
  medicalSheet.clear();
  medicalSheet.getRange('A1:E3').setValues([
    ['ID', 'Date', 'Amount', 'Payment Method', 'Description'],
    ['1735956000003', '2026-01-02', 500, 'Card', 'Medicine for fever'],
    ['1735956000004', '2026-01-01', 1200, 'UPI', 'Doctor consultation']
  ]);
  
  // Add test data to Home sheet
  let homeSheet = ss.getSheetByName('Home');
  if (!homeSheet) {
    homeSheet = ss.insertSheet('Home');
  }
  homeSheet.clear();
  homeSheet.getRange('A1:F5').setValues([
    ['ID', 'Date', 'Amount', 'Payment Method', 'Category', 'Description'],
    ['1735956000005', '2026-01-03', 80, 'UPI', 'Groceries', 'Vegetables and fruits'],
    ['1735956000006', '2026-01-02', 2500, 'Card', 'Rent', 'Monthly rent payment'],
    ['1735956000007', '2026-01-01', 150, 'Cash', 'Groceries', 'Milk and eggs'],
    ['1735956000008', '2025-12-31', 800, 'UPI', 'Electricity', 'Monthly electricity bill']
  ]);
  
  Logger.log('✅ Test data added successfully! Check your app now.');
  return '✅ Test data added successfully! Check your app now.';
}
```

### Step 3: Run the Test Function
1. In the Apps Script editor, select `addTestData` from the function dropdown at the top
2. Click the **Run** button (▶️)
3. Wait a few seconds
4. Check the "Execution log" at the bottom - you should see "✅ Test data added successfully!"
5. Go back to your Google Sheet and refresh the page to see the data

### Step 4: Check Your App
1. Open your app (make sure Cloud Sync is enabled)
2. Within 30 seconds, you should see:
   - **CC Bills**: 2 test bills (HDFC ₹5000, ICICI ₹3500)
   - **Medical**: 2 test expenses (₹500, ₹1200)
   - **Home**: 4 test expenses including your ₹80 Groceries
3. The app will sync this data to your local device

### Verify Two-Way Sync

**Test 1: Sheet → App**
1. Run the `addTestData()` function
2. Open your app
3. Wait 30 seconds
4. Data should appear in your app

**Test 2: App → Sheet**
1. Add a new expense in your app (e.g., ₹200 for Groceries)
2. Go to your Google Sheet
3. Refresh the page
4. The new data should be at the bottom of the Home sheet

### Troubleshooting

**Data not syncing to sheet?**
1. Check browser console (F12) for errors
2. Make sure Cloud Sync is enabled (purple cloud icon)
3. Check the Apps Script URL in `services/googleSheets.ts`
4. Verify the deployment is set to "Anyone" has access

**Data not syncing from sheet?**
1. Wait 30 seconds (auto-sync interval)
2. Refresh the app page
3. Check browser console for sync errors
4. Try disabling and re-enabling Cloud Sync

### Debug Logs
Open browser console (F12) to see sync logs:
- ✅ Bills saved to Google Sheets
- ✅ Bills synced from Google Sheets
- ⚠️ Failed to save bills to Google Sheets
- ❌ Error syncing from Google Sheets

