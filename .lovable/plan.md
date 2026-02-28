

## Plan: JAMB Scoring, Leaderboard & Semester Management

### 1. JAMB-specific scoring in Profile (`src/pages/Profile.tsx`)
- Separate JAMB stats from other exam categories using the latest JAMB marking scheme: each correct answer = 2.5 marks (score * 2.5 for 40-question subjects, raw aggregate for mock mode with 180 questions = 400 marks total)
- Show JAMB stats card with "JAMB Score" (out of 400 for mock, out of 100 for single subject practice) alongside percentage
- Keep other exam categories using the existing fraction/percentage system

### 2. Leaderboard section on Profile page (`src/pages/Profile.tsx`)
- Add a "Leaderboard — Top 10" card below the exam history
- Query `exam_attempts` table joined with `profiles` table to get top 10 scores (highest percentage) across all users
- Display position, username/full_name, score, and exam subject
- Highlight the logged-in user's row with "You" label and different background color
- If user is not in top 10, show their rank separately below the table

### 3. Leaderboard RLS policy
- Database migration: Add a permissive SELECT policy on `exam_attempts` allowing all authenticated users to read all attempts (needed for leaderboard aggregation)
- Alternative: Create a database function `get_leaderboard()` that returns top 10 without exposing raw data — this is more secure

### 4. Semester selector in Admin subject creation (`src/pages/Admin.tsx`)
- Add `semester` state (default "first") to subject creation form
- Add semester dropdown ("1st Semester" / "2nd Semester") in the create subject form
- Pass `semester` field in the insert call (column already exists on `subjects` table)
- Add semester field to the edit subject form as well
- Show semester badge next to level badge in subject list

### 5. Semester selector in Admin question upload forms (`src/pages/Admin.tsx`)
- In "Add New Question" form: the subject selector already determines semester (since subjects have semester). No change needed here — questions inherit semester from their subject.
- In "Bulk Import" form: same — subject already carries semester info.

### 6. Semester selector in PastQuestionUpload (`src/components/admin/PastQuestionUpload.tsx`)
- This is for JAMB/WAEC/NECO uploads which don't use semesters — no change needed.

### 7. Admin ExamMode semester switch (`src/components/admin/ExamModeManagement.tsx`)
- The semester toggle already exists (allow_semester_selection). This controls whether students see the 1st/2nd semester toggle. No additional changes needed — admin already has this feature.

### Files to modify
1. `src/pages/Profile.tsx` — JAMB scoring scheme + leaderboard
2. `src/pages/Admin.tsx` — Add semester field to subject create/edit forms
3. Database migration — Create `get_leaderboard()` function for secure top-10 query

### Technical details
- JAMB marking: For practice mode (single subject, 40 questions), JAMB score = correctAnswers × 2.5 (out of 100). For mock mode (4 subjects, 180 questions), JAMB score = correctAnswers × (400/180) ≈ 2.22 per question (out of 400).
- Leaderboard function will use `SECURITY DEFINER` to bypass RLS and return only username, score, total_questions, and rank.
- The `subjects.semester` column already exists in the database schema (nullable text field), so no schema migration needed for that.

