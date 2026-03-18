

## Problem Root Cause

**Zero questions have `image_url` populated** across the entire 16,000+ question database. The `image_url` column was added recently, but:

1. All existing questions were inserted **before** the column existed
2. The upsert with `onConflict` only inserts new rows — it does NOT update existing rows with the new `image_url` field because the matching rows already exist
3. The ALOC API **does** return an `image` field for diagram questions, but re-syncs skip them since the question text already exists
4. English comprehension: ALOC returns individual questions referencing passages, but the passage text itself is NOT included — the questions are orphaned fragments

## Plan

### 1. Force-update existing cached questions with image data from ALOC

Create a new edge function `backfill-images` that:
- For each science subject (Physics, Chemistry, Biology, Mathematics, Economics), queries ALOC year-by-year
- For each returned question that HAS an `image` field, does an `UPDATE` (not upsert) on `cached_api_questions` matching by `question_text` to set `image_url`
- This patches the 500+ diagram-referencing questions already in the cache

### 2. Fix upsert logic so future syncs preserve images

In `sync-questions/index.ts`, `bulk-fetch-questions/index.ts`, and `jamb-questions/index.ts`:
- Change upsert calls to use `{ onConflict: "exam_level,subject,question_text" }` **without** `ignoreDuplicates` (already done in sync-questions but verify bulk-fetch)
- This ensures re-syncs update `image_url` on existing rows

### 3. Handle English comprehension properly

Since ALOC doesn't embed passage text in individual questions, the quality filter in `jamb-questions/index.ts` already filters these out (line 327). This is correct behavior — orphaned passage questions should not be served.

For comprehension to work, we need questions with embedded passages. The AI extraction (PDF upload) tool is the right path for these. No code change needed — the filter is working as designed.

### 4. Verify image rendering in frontend

The frontend already has image rendering code at JambExam.tsx line 1427-1436. Once images are populated in the DB, they'll display automatically. No frontend changes needed.

### Technical Steps

1. **Create `backfill-images` edge function** — Iterates ALOC API for Physics, Chemistry, Biology, Mathematics, Economics across all years. For each question with an `image` field, updates the matching `cached_api_questions` row's `image_url` using service role key
2. **Fix `bulk-fetch-questions/index.ts`** — Remove `ignoreDuplicates: true` from its upsert call (line ~322 in extract-past-questions too) so future syncs update image fields
3. **Deploy and invoke** the backfill function to populate images for existing questions
4. **Add admin UI button** in Q-Bank tab to trigger the backfill manually

### Files to modify
- `supabase/functions/backfill-images/index.ts` (new)
- `supabase/functions/extract-past-questions/index.ts` (remove `ignoreDuplicates`)
- `src/components/admin/QuestionBankSync.tsx` (add backfill button)

