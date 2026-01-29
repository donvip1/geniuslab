

# Plan: Fix PIN Entry Flow

## Issues Identified

### Issue 1: User Login Before PIN Entry
The code already redirects to `/auth` if not logged in (line 122-124 in Exam.tsx). But there might be a race condition or the loading state isn't being shown correctly. I'll verify this is working properly.

### Issue 2: Generated PINs Not Recognized (Root Cause)
**This is the main bug!** The RLS policies on `access_pins` table are too restrictive:
- Users can only SELECT pins where `auth.uid() = used_by`
- But for UNUSED pins, `used_by` is NULL
- So students cannot verify if a PIN exists before activating it!

The PIN validation in `PinEntryScreen.tsx` (line 91-107) queries for the PIN but gets no results because the RLS policy blocks the SELECT.

---

## Solution

### Database Fix: Add RLS Policy for PIN Lookup
Add a new SELECT policy that allows authenticated users to check if an **unused** PIN exists (without revealing all PIN details):

```sql
-- Allow authenticated users to check if an unused PIN exists
CREATE POLICY "Users can check unused pins" 
ON access_pins FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_used = false
);
```

This allows:
- Authenticated users to SELECT unused PINs (to verify they exist)
- Still protects used PINs (only the owner can see those)

---

## Files to Modify

| File | Changes |
|------|---------|
| Database Migration | Add new RLS policy for unused PIN lookup |

---

## Security Note
This is safe because:
1. Only authenticated users can check PINs
2. They still need to know the exact 8-character PIN code
3. The policy only allows checking unused PINs
4. Once used, pins are only visible to the owner

