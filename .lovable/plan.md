

## Plan

### 1. Grant admin role to robinsonwealth1@gmail.com
- Insert `admin` role for `user_id = 4dc286b3-1d17-4688-9683-18fd8d877483` into `user_roles` table (they currently only have `student`).

### 2. Add Study Material section to JAMB exam page
- Add a "Study Materials" tab/section accessible from the JAMB mode selection screen.
- For each JAMB subject, show topic summaries, key formulas, and tips sourced from `cached_api_questions` explanations (aggregate explanations per subject as study notes).
- Alternatively, create a simple static study material page with curated JAMB topic outlines per subject, accessible via a "Study Material" button on the mode selection screen.
- New page: `src/pages/JambStudyMaterial.tsx` with subject selector, showing grouped topic content.
- Add route `/jamb-study` in `App.tsx`.
- Add a "Study Material" card on the JAMB mode selection screen linking to it.

### 3. Add Results button to JAMB exam page
- Add a "My Results" button/card on the JAMB mode selection screen.
- Query `exam_attempts` table filtered by `user_id` to show past JAMB exam results (score, total, date, time taken).
- Display as a list/history within a dialog or dedicated section on the mode selection screen.
- Also save JAMB exam results to `exam_attempts` table on finalize (currently results are only shown in-page and not persisted for JAMB mode).

### 4. Add Search button to JAMB exam page
- Add a "Search Questions" button on the JAMB mode selection screen.
- Opens a search dialog/page where students can search through `cached_api_questions` by keyword, subject, or year.
- Shows matching questions with their options and explanations for self-study.

### Files to create/modify
- **Create** `src/pages/JambStudyMaterial.tsx` - Study material page with subject-based content
- **Modify** `src/pages/JambExam.tsx` - Add Study Material, Results, and Search buttons to mode selection; save results to `exam_attempts` on finalize
- **Modify** `src/App.tsx` - Add `/jamb-study` route
- **Database** - Insert admin role for the specified user

### Technical details
- Study materials will pull explanations from `cached_api_questions` grouped by subject, providing a "learn from explanations" approach. A fallback static outline per subject will also be included.
- Results history queries `exam_attempts` with a new insert on JAMB exam finalization using the existing table schema (`user_id`, `subject_id`, `score`, `total_questions`, `time_taken_seconds`, `answers`).
- Search uses a client-side `ilike` query on `cached_api_questions.question_text` filtered by subject.
- The three new features appear as cards on the JAMB mode selection screen alongside Practice and Mock cards.

