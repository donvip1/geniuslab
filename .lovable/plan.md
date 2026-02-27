

## Plan: Add Year Selector + Update Practice Question Counts

### Changes Overview

**1. Update JAMB Practice question count**
- In `src/pages/JambExam.tsx`: Change `PRACTICE_QUESTIONS` from 20 to 40, and for English in practice mode use 60 questions
- Update practice duration from 30 min to 60 min to match the increased question count
- Update the practice mode card description to reflect new counts

**2. Create `src/components/YearSelector.tsx`**
- Reusable Select dropdown: "All Years (Random)" default + years 2025 down to 2010
- Props: `value: string | null`, `onChange: (year: string | null) => void`

**3. Add year selector to `src/pages/JambExam.tsx`**
- Add `selectedYear` state (default null)
- Place YearSelector in the subject selection screen (both practice and mock modes), between header and subject grid
- Pass `year` param to `supabase.functions.invoke("jamb-questions", { body: { ..., year } })`
- Save year in `SavedExamState` for session restore

**4. Add year selector to `src/pages/ApiExam.tsx`**
- Add `selectedYear` state
- Place YearSelector between track/subject selection and Start button
- Pass `year` param in edge function call

**5. Update `supabase/functions/jamb-questions/index.ts`**
- Accept optional `year` parameter from request body
- When year is provided:
  1. Query `cached_api_questions` filtered by `year`, `subject`, `exam_level`
  2. If fewer than needed, backfill from full pool (excluding already-selected question texts)
  3. Shuffle and return exact count
- When year is null/empty: current random behavior (no change)

### Technical Details

**Practice mode question logic:**
- English subject in practice: 60 questions (matches mock)
- All other subjects in practice: 40 questions
- Determined by checking `subId === "english"` in fetchQuestions

**Year-filtered query pseudocode (edge function):**
```text
if (year) {
  pool = SELECT * FROM cached_api_questions 
         WHERE year = :year AND subject = :subject AND exam_level = :level
  
  if (pool.length < needed) {
    backfill = SELECT * FROM cached_api_questions
               WHERE subject = :subject AND exam_level = :level
               AND question_text NOT IN (pool texts)
    pool = pool + shuffle(backfill).slice(0, deficit)
  }
} else {
  // existing behavior
}
```

No database changes needed — `cached_api_questions.year` column already exists with 2010-2025 data.

