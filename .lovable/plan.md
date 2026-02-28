

## Plan: Fix Year Selection & Enhance Profile Stats

### Issue 1: Year Selection Not Working

**Root cause:** The edge function `jamb-questions` correctly prioritizes year-specific questions and backfills from other years, BUT the backfilled questions retain their original `year` value in the response. When a user selects "2021", they see questions labeled with other years like "2018", "2015", etc.

**Fix in `supabase/functions/jamb-questions/index.ts`:**
- After selecting questions (line ~199), when a `year` parameter was provided, override the `year` field on ALL returned questions to show the selected year
- This hides the backfill from users — all questions appear as the selected year
- The backend already does the right thing (prioritizes year-specific questions first), we just need to mask the year on backfilled ones

```
// Line ~199-205: Change formatted output
const formatted = selected.map((q: any) => ({
  text: q.question_text,
  options: [...],
  correctAnswerIndex: q.correct_answer_index,
  year: year || q.year || "",  // <-- use selected year if provided
  explanation: q.explanation || "",
  subject: subject,
}));
```

### Issue 2: Profile Stats Need Detailed Breakdown

**Current state:** Profile shows generic stats (total exams, avg/best/worst score, pass rate) but doesn't break down by exam type (JAMB, WAEC, University, etc.).

**Fix in `src/pages/Profile.tsx`:**
- Group attempts by exam type: detect from `answers.mode` (JAMB has "practice"/"mock"), or from subject/category lookup
- For each exam type group, show: total attempts, pass/fail count, avg score, best score
- Replace the simple "Performance Summary" card with a detailed breakdown section showing per-category stats
- Each category card shows: category name (JAMB, University CBT, etc.), attempts count, passed/failed counts, average score
- Keep Best/Worst performance cards as they are

**Categorization logic:**
- If `answers.mode` is "practice" or "mock" → "JAMB UTME"
- If `subject_id` matches an `exam_categories` entry → use that category name
- If `subject_id` matches a `subjects` entry → look up its `exam_category_id` → get category name
- Fallback → "Other"

**Additional data needed:** Also fetch `subjects.exam_category_id` to map subjects back to their exam category for grouping.

### Files to modify:
1. **`supabase/functions/jamb-questions/index.ts`** — Override year on all questions when year filter is active
2. **`src/pages/Profile.tsx`** — Add detailed per-category performance breakdown

