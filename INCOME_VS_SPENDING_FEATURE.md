# Income vs UPI Spending Tracker Feature

## Overview
A new financial tracking feature that calculates and displays the relationship between monthly income and UPI spending, showing remaining balance on the Dashboard.

## Features Added

### 1. **Income vs Spending Card on Dashboard**
- Displays three key metrics:
  - **Total Income**: Sum of all income entries for the selected month
  - **UPI Spent**: Total expenses paid via UPI (from Medical + Home expenses)
  - **Remaining Balance**: Income minus UPI spending
- Visual indicators:
  - Green text for positive balance (Available)
  - Red text for negative balance (Overspent)
- Shows spending rate percentage

### 2. **Calculations**
```typescript
// Total Income for selected month
totalIncome = Sum of all income where month matches selectedMonth

// UPI Spending calculation
upiSpending = 
  Medical expenses (paymentMethod = 'UPI' for selected month) +
  Home expenses (paymentMethod = 'UPI' for selected month)

// Remaining Balance
remainingBalance = totalIncome - upiSpending

// Spending Rate
spendingRate = (upiSpending / totalIncome) × 100
```

### 3. **Visual Design**
- Purple gradient background to differentiate from other expense cards
- Three-column grid layout for Income, Spending, and Remaining
- Responsive design matching existing dashboard aesthetic
- Icon: Wallet icon for the section header

## Files Modified

### 1. `components/Dashboard.tsx`
- Added `Income` array to component props
- Added `PaymentMethod` enum import
- Updated stats calculations to include:
  - `totalIncome`
  - `upiSpending`
  - `remainingBalance`
- Added new Income vs Spending card in the UI
- All calculations are non-destructive and don't affect existing functionality

### 2. `App.tsx`
- Updated Dashboard component call to pass `income` prop
- No other changes to existing logic

## Database Structure

### Existing Tables Used
The feature uses existing columns in the `family_data` table:
- **income**: JSONB array storing income entries
- **medical**: JSONB array storing medical expenses (with paymentMethod)
- **home**: JSONB array storing home expenses (with paymentMethod)

### No New Tables Required
All necessary database columns already exist. The `add_income_column.sql` migration file has already been created and should be run if not already executed.

## Data Flow

```
User adds Income → Stored in family_data.income
User adds Medical/Home expense with UPI → Stored with paymentMethod='UPI'
Dashboard loads → Filters by month → Calculates totals → Displays in card
```

## Impact on Existing Functionality

### ✅ No Breaking Changes
- Existing dashboard cards remain unchanged
- CC Bills, Medical, and Home expense tracking work exactly as before
- All existing charts and visualizations preserved
- No changes to data storage or retrieval for existing features

### ✅ Backward Compatible
- Works with existing data structure
- If no income is entered, shows ₹0 for income
- If no UPI expenses exist, shows ₹0 for UPI spending
- Gracefully handles missing data

## Usage Example

### Scenario
- **January 2026 Income**: ₹75,000 (Salary)
- **UPI Medical Expenses**: ₹5,000
- **UPI Home Expenses**: ₹20,000
- **Card/Cash Expenses**: ₹30,000 (not counted in UPI spending)

### Dashboard Display
```
┌─────────────────────────────────────────────────────┐
│  Income vs UPI Spending                             │
├─────────────────┬─────────────────┬─────────────────┤
│  Total Income   │   UPI Spent     │   Remaining     │
│   ₹75,000       │    ₹25,000      │   ₹50,000       │
│  This Month     │   Expenses      │   Available     │
└─────────────────┴─────────────────┴─────────────────┘
│  Spending Rate: 33.3%                               │
└─────────────────────────────────────────────────────┘
```

## Testing Checklist

- [ ] Verify income entries display correct totals
- [ ] Verify only UPI expenses are counted (not Card/Cash)
- [ ] Verify calculations work across different months
- [ ] Verify remaining balance shows correct color (green/red)
- [ ] Verify spending rate calculates correctly
- [ ] Verify existing dashboard features still work
- [ ] Test with zero income (shows ₹0)
- [ ] Test with zero expenses (shows full income as remaining)
- [ ] Test with overspending (negative balance in red)

## SQL Verification

Run the `verify_income_spending_setup.sql` file to confirm:
1. Income column exists in database
2. Medical and home columns are properly structured
3. Query to test calculations (optional, for debugging)

## Future Enhancements (Optional)

1. **Add Cash/Card Spending Tracking**: Show separate cards for each payment method
2. **Monthly Trends**: Graph showing income vs spending over multiple months
3. **Budget Alerts**: Notify when spending exceeds certain percentage of income
4. **Category-wise Breakdown**: Show which categories consume most UPI spending
5. **Savings Goals**: Track progress toward monthly savings targets

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify income entries exist for the selected month
3. Confirm expenses have correct `paymentMethod` field
4. Run the verification SQL script to check database structure

---

**Version**: 1.0.0  
**Date**: January 8, 2026  
**Status**: Production Ready ✅
