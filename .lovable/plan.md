
# Fix: Bulk-Populate Question Cache via Repeated API Calls

## Problem
The Veezee Academy API only returns ~5 unique questions per API call, regardless of the `count` parameter. With only 4-14 questions cached per subject, JAMB Mock UTME (which needs 180 questions: 60 English + 40 x 3 others) is only showing 22 questions.

## Root Cause
The `sync-questions` function makes **one** API call per subject. Since each call returns only ~5 questions, the cache never grows beyond a handful.

## Solution
Modify the `sync-questions` edge function to make **multiple iterative calls** per subject until we reach a target cache size or hit diminishing returns.

### Changes to `supabase/functions/sync-questions/index.ts`

1. **Iterative fetching loop** -- For each subject, call the API up to **30 times** (with a 500ms delay between calls) to accumulate unique questions via upsert deduplication
2. **Target threshold** -- Stop early if the cache reaches the target (e.g., 80 questions for English, 60 for others) or if 3 consecutive calls return 0 new unique questions
3. **Progress logging** -- Log how many new unique questions each iteration adds

### Technical approach

```
For each level/subject:
  target = (English ? 80 : 60)
  maxIterations = 30
  zeroNewCount = 0
  
  for i in 1..maxIterations:
    call API
    upsert results (deduplicates on exam_level + subject + question_text)
    check new count vs previous count
    if no new questions added: zeroNewCount++
    if zeroNewCount >= 3: break (API exhausted)
    if count >= target: break (enough questions)
    wait 500ms
```

### No frontend changes needed
The `jamb-questions` function and `JambExam.tsx` already serve from cache correctly. Once the cache is populated with enough questions, the 180-question mock will work automatically.

### After deployment
We will trigger a full sync for key JAMB subjects (English, Mathematics, Physics, Chemistry, Biology, etc.) to populate the cache. The cron job will continue to top it up every 6 hours.

## Files to modify
- **`supabase/functions/sync-questions/index.ts`** -- Add iterative multi-call fetching loop with early termination
