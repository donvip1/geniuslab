

# Fix: PIN Remains Valid After Toggling PIN Mode

## Problem

When an admin toggles the "Require PIN for Exam Access" setting off and back on, students who already activated a valid PIN are shown the PIN Entry Screen again. When they try to re-enter their PIN, they see "PIN Already Used" -- making it seem like their PIN is invalid, even though it should still be active.

## Root Cause

There are two contributing issues:

1. **Race condition on page load**: The exam settings check (`isPinRequired`) and subscription check (`hasActiveSubscription`) run as separate parallel async calls. The settings can resolve first (setting `isPinRequired = true`) while the subscription check hasn't finished yet -- briefly showing the PIN Entry Screen before the subscription is confirmed.

2. **PinEntryScreen doesn't recognize the user's own active PIN**: When a user with an already-active PIN sees the PIN Entry Screen (due to the race condition or a page refresh), and enters their same PIN again, the code shows "PIN Already Used" without checking whether it belongs to the current user. It should recognize this and grant access automatically.

## Solution

### Change 1: Ensure subscription is checked before rendering PIN gate (Exam.tsx)

Move the `isPinRequired` state into the same loading flow as subscription checking, so the PIN gate is never shown until BOTH the setting and subscription status are fully resolved.

### Change 2: Ensure subscription is checked before rendering PIN gate (ExamTaking.tsx)

Apply the same fix -- wait for both `isPinRequired` and `hasActiveSubscription` to be fully resolved before deciding to redirect.

### Change 3: Handle "own PIN re-entry" in PinEntryScreen

When a user enters a PIN that is already used, check if it was used by the current user and is still valid. If so, grant access instead of showing an error.

---

## Technical Details

### File: `src/pages/Exam.tsx`

- Add a `settingsChecked` state (default `false`) that gets set to `true` after `checkExamLock` completes
- Update loading condition (line 243) to also wait for `settingsChecked`
- This prevents rendering the PIN gate before both checks complete

### File: `src/pages/ExamTaking.tsx`

- Add a `settingsChecked` state (default `false`) that gets set to `true` after `fetchExamSettings` completes
- Update loading condition (line 386) to also wait for `settingsChecked`

### File: `src/components/PinEntryScreen.tsx`

- After finding a used PIN (line 109), check if `pinData.used_by === session.user.id`
- If it belongs to the current user AND `pinData.expires_at` is in the future, call `onSuccess()` instead of showing an error
- If it belongs to someone else OR is expired, show the current error message

---

## Summary of Changes

| File | What Changes |
|------|-------------|
| `src/pages/Exam.tsx` | Add `settingsChecked` guard so PIN gate only shows after both settings and subscription are loaded |
| `src/pages/ExamTaking.tsx` | Same `settingsChecked` guard to prevent premature redirect |
| `src/components/PinEntryScreen.tsx` | Recognize user's own active PIN and auto-grant access instead of showing "Already Used" error |

