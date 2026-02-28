

## Plan: Fix Profile Stats & Redesign Exam Header

### Problem 1: Profile stats not showing for JAMB/API exams
JAMB exams insert `exam_category_id` (from `exam_categories` table) as `subject_id`, not a real `subjects` table ID. The Profile page only looks up names from `subjects`, so JAMB attempts show "Unknown Subject". Also, API exams (WAEC/NECO/NABTEB) via `submit-exam` use the actual `subject_id` from `subjects` table, which should work. Need to also check `exam_categories` table for fallback name resolution.

**Fix in `src/pages/Profile.tsx`:**
- Also fetch `exam_categories` alongside `subjects`
- Build a combined name map: first check subjects, then check exam_categories, then check `answers.subjects` JSON field
- This ensures JAMB attempts show the category name (e.g., "JAMB UTME") or the subjects string from the answers JSON

### Problem 2: Remove Logout button from Exam header, replace with motivational content
Currently the exam page header (`src/pages/Exam.tsx` lines 384-395) shows a Logout button next to "Back to Categories".

**Fix in `src/pages/Exam.tsx`:**
- Remove the Logout button entirely from the header
- Fetch user's best exam performance on load (query `exam_attempts` for their highest score percentage)
- Display either:
  - If they have past attempts: "Your best score: X% — Can you beat it?" with a trophy icon
  - If no past attempts: A random motivational quote from a predefined array (changes on each visit)
- Show this below the "Welcome, username" line in the header

### Files to modify:
1. **`src/pages/Profile.tsx`** — Fix subject name resolution to handle JAMB category IDs and answers JSON
2. **`src/pages/Exam.tsx`** — Remove Logout button, add motivational quote or best performance display

