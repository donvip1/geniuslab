

## Problem Analysis

There are three distinct issues:

1. **Missing images/diagrams**: 538 out of 16,155 JAMB questions reference "diagram" or "figure" (mainly Physics: 186, Math: 154, Biology: 129, Chemistry: 93). These questions say things like "From the diagram above..." but no image is stored or displayed. The `cached_api_questions` table has no `image_url` column, and none of the API sync functions capture image URLs from source APIs.

2. **Incomplete Use of English questions**: Only 4 out of 605 English questions reference passages/comprehension. JAMB Use of English heavily relies on comprehension passages, but the APIs don't provide passage context — questions are stored individually without their parent passages.

3. **Shuffling breaks question context**: Questions that reference shared context (comprehension passages, "the diagram above", "use the information below") get separated when shuffled, making them nonsensical.

## Root Cause

The ALOC API returns an `image` field with question image URLs, but our sync functions (`sync-questions`, `jamb-questions`) strip this field entirely. The Veezee API may also return image URLs. Without storing and rendering these, diagram-dependent questions are incomplete.

## Plan

### 1. Add `image_url` column to `cached_api_questions`
- Run a migration: `ALTER TABLE cached_api_questions ADD COLUMN image_url TEXT DEFAULT NULL;`

### 2. Capture image URLs from API sources
- **`sync-questions/index.ts`**: Update `mapAlocQuestion()` to capture `q?.image` field. Update `mapVeezeeQuestion()` to capture `q?.image` or `q?.image_url`.
- **`jamb-questions/index.ts`**: Include `image_url` in the question mapping when reading from cache and in the formatted output sent to frontend.
- **`extract-past-questions/index.ts`**: No change needed (AI-extracted questions from PDFs typically won't have separate image URLs).

### 3. Render images in exam UI
- **`JambExam.tsx`**: Add `image_url?: string` to `JambQuestion` interface. In question display (around line 1408), render an `<img>` tag when `currentQuestion.image_url` exists, placed between the question text and the options.
- **`ExamTaking.tsx`**: Same — add image rendering for university CBT questions if `image_url` is present.
- Also render images in the wrong answers review section and the search dialog.

### 4. Disable shuffling for Use of English
- **`jamb-questions/index.ts`** (line 217): Skip the `sort(() => Math.random() - 0.5)` shuffle when `subject === "Use of English"` — serve questions in their original order to preserve comprehension passage grouping.
- **`JambExam.tsx`**: The frontend doesn't shuffle (confirmed), so no frontend changes needed for this.

### 5. Filter out incomplete diagram-referencing questions (optional safety)
- In the quality filter in `jamb-questions/index.ts` (lines 203-214), add a check: if `question_text` contains "diagram above" or "figure above" but `image_url` is null, exclude the question from the pool. This prevents serving broken questions until images are populated.

### Technical Summary

```text
Migration:  +image_url column on cached_api_questions
Edge Funcs: sync-questions (capture image), jamb-questions (pass image + skip English shuffle + filter)
Frontend:   JambExam.tsx + ExamTaking.tsx (render <img> for image_url)
```

### Files to modify
- `supabase/functions/sync-questions/index.ts` — capture image URLs from ALOC/Veezee
- `supabase/functions/jamb-questions/index.ts` — pass image_url to frontend, skip English shuffle, filter incomplete questions
- `src/pages/JambExam.tsx` — render question images, update interface
- `src/pages/ExamTaking.tsx` — render question images
- Database migration for `image_url` column

