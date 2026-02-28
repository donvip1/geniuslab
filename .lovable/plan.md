

## Plan: Fix Exam Stats Not Recording & Enhance Profile

### Root Cause Analysis

The JAMB exam result save in `JambExam.tsx` (line 599) does NOT check the Supabase error response. Supabase client returns `{ data, error }` but never throws — so the `try/catch` silently swallows failures. This means JAMB exam results may fail to save without any user notification.

Confirmed: Only 2 exam attempts exist in the entire database across all users.

### Changes

#### 1. Fix JAMB exam result saving (`src/pages/JambExam.tsx`)
- Destructure `{ error }` from the insert call and check it
- Show a toast error if saving fails so users know
- Log the actual error for debugging

#### 2. Fix University exam result saving (`src/pages/ExamTaking.tsx`)
- Add a toast notification confirming successful save, or showing error
- Currently if the edge function fails, user gets a generic "Failed to submit" but the actual insert error inside the edge function is hidden

#### 3. Enhance Profile page (`src/pages/Profile.tsx`)
- Add **Total Questions Answered** stat alongside existing stats
- Add **subject-level breakdown** within each category (not just category-level) showing per-subject attempts, avg score, pass/fail
- Add **pass/fail badge** on each exam history entry (green "Passed" or red "Failed" chip)
- Add **score as fraction AND percentage** in history entries
- Add a **"View Profile"** link from the ExamResults page so students know where to find their stats
- Show an **empty state prompt** encouraging users to take exams when no history exists

#### 4. Link to Profile from Exam Results (`src/pages/ExamResults.tsx`)
- Add a "View My Profile" button alongside the existing action buttons so users discover the profile stats page after completing an exam

### Files to modify
1. `src/pages/JambExam.tsx` — Fix silent insert failure
2. `src/pages/ExamTaking.tsx` — Add success/error feedback
3. `src/pages/Profile.tsx` — Enhanced detailed stats with subject breakdown
4. `src/pages/ExamResults.tsx` — Add profile link button

