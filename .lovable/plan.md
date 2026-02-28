

## Plan: Instant Profile Update After Exam & Refresh Button

### Problem
After submitting an exam, users must manually navigate to their profile and the data may not appear immediately. There's no refresh mechanism on the profile page.

### Changes

#### 1. Add refresh button to Profile page (`src/pages/Profile.tsx`)
- Add a `RefreshCw` icon button next to the "Exam History" card header
- Clicking it re-fetches all profile data (attempts, subjects, categories) and rebuilds stats
- Extract the data-loading logic into a reusable `loadProfileData()` function called both on mount and on refresh
- Show a spinning animation on the refresh icon while loading

#### 2. Navigate to Profile after JAMB exam submission (`src/pages/JambExam.tsx`)
- After successful exam save, show a toast with a "View Profile" action button
- Add a "View My Profile" button on the results screen that navigates to `/profile`

#### 3. Navigate to Profile after University exam submission (`src/pages/ExamResults.tsx`)
- Already has a "View My Profile" button from previous work — confirm it exists and works

#### 4. Auto-refresh profile on navigation (`src/pages/Profile.tsx`)
- The profile already loads data on mount via `useEffect`. Since React Router remounts or re-runs effects on navigation, visiting `/profile` after an exam will fetch the latest data automatically. No polling needed.

### Files to modify
1. `src/pages/Profile.tsx` — Add refresh button, extract load function
2. `src/pages/JambExam.tsx` — Add "View Profile" button on results screen

