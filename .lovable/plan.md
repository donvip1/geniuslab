
# Plan: Fix PIN List Sorting and Filtering

## Issues Identified

### Issue 1: Sorting - Used pins should appear first
Currently, pins are sorted only by `created_at` (newest first). You want used pins to appear at the top so admins can quickly see which pins are in use.

### Issue 2: Filter verification
I checked your database and found 2 active pins (JLJ2DBFY and KJPU543S). The "Active" filter logic looks correct, but let me verify it works after fixing the sorting.

---

## Solution

### Change 1: Sort pins with used ones first
After fetching pins from the database, sort them so:
1. Used pins come first (sorted by `used_at` date, most recent first)
2. Unused pins come after (sorted by `created_at` date, newest first)

### Change 2: Keep filter logic the same (it's correct)
The filter logic for "Active" status is:
- PIN must be used (`is_used = true`)
- PIN must have an expiry date
- Expiry date must be in the future

---

## Technical Changes

| File | Changes |
|------|---------|
| `src/components/admin/AccessPinManagement.tsx` | Update `getFilteredPins()` to sort used pins first |

### Code Change

**Before (line 554-582):**
```tsx
const getFilteredPins = () => {
  // ...filter logic...
  return pins.filter(pin => { ... });
};

const filteredPins = getFilteredPins();
```

**After:**
```tsx
const getFilteredPins = () => {
  const now = new Date();
  
  // First filter
  const filtered = pins.filter(pin => {
    // ...existing filter logic...
  });
  
  // Then sort: used pins first (by used_at desc), then unused (by created_at desc)
  return filtered.sort((a, b) => {
    // Used pins come first
    if (a.is_used && !b.is_used) return -1;
    if (!a.is_used && b.is_used) return 1;
    
    // Among used pins, sort by used_at (most recent first)
    if (a.is_used && b.is_used) {
      const aDate = a.used_at ? new Date(a.used_at).getTime() : 0;
      const bDate = b.used_at ? new Date(b.used_at).getTime() : 0;
      return bDate - aDate;
    }
    
    // Among unused pins, sort by created_at (most recent first)
    const aCreated = new Date(a.created_at).getTime();
    const bCreated = new Date(b.created_at).getTime();
    return bCreated - aCreated;
  });
};
```

---

## Result After Fix

| Default View (All Status) | Filtered View |
|---------------------------|---------------|
| ✅ JLJ2DBFY (Active) - top | Active filter shows 2 pins |
| ✅ KJPU543S (Active) | Expired filter shows 0 pins |
| 8KH45BLK (Unused) | Unused filter shows all unused |
| VDSPXEJY (Unused) | |
| ... more unused pins | |
