

# Plan: Massive Question Bank Population via ALOC API + Missing Subjects

## Current State
- Only **1,304 total questions** in the bank (most subjects have 4-5 questions)
- Single source: Veezee API (unreliable, limited returns)
- 6 subjects missing entirely: Igbo, Yoruba, Hausa, French/Arabic, Fine Art, Technical Drawing

## Discovery
I found the **ALOC API** (questions.aloc.com.ng) -- a free, open-source Nigerian past questions database with **20,000+ verified questions** covering JAMB UTME, WAEC, and NECO from 2001-2020+. This will be the primary source.

ALOC supports 17 subjects: English, Mathematics, Commerce, Accounting, Biology, Physics, Chemistry, Literature in English, Government, CRK, IRK, Geography, Economics, Civic Education, Insurance, Current Affairs, History.

## What Needs to Happen

### 1. Get ALOC API Access Token (requires your action)
You need to create a free account at **https://questions.aloc.com.ng** and retrieve your Access Token (looks like `ALOC-78bfe77b49fb3e407bf8`). I will then store it as a secret for the edge functions to use.

### 2. New Edge Function: `bulk-fetch-questions`
A dedicated function that:
- Iterates through every subject and every year (2001-2024) for both UTME and WASSCE exam types
- Fetches questions from ALOC API first (primary source)
- Falls back to Veezee API for any subjects ALOC doesn't cover
- Upserts all questions into `cached_api_questions` with deduplication
- Returns progress/results for each subject

ALOC API format:
```
GET https://questions.aloc.com.ng/api/v2/q/40?subject=chemistry&year=2010&type=utme
Headers: { AccessToken: "ALOC-xxx" }
```

### 3. Add Missing Subjects
Add to the JAMB subject list in both `JambExam.tsx` and `sync-questions`:
- Igbo Language
- Yoruba Language  
- Hausa Language
- French
- Arabic
- Fine Arts
- Technical Drawing

These will be fetched from Veezee API (ALOC doesn't have them). If Veezee doesn't have them either, the admin can manually import questions via the existing bulk import tool.

### 4. Update `sync-questions` Edge Function
- Add ALOC as primary fetch source (try ALOC first, then Veezee)
- For each subject, iterate through years 2001-2024
- Fetch up to 40 questions per year per subject (ALOC's max per call)
- Target: **500+ questions per major subject**, 100+ for minor subjects

### 5. Update Admin Q-Bank UI
- Add a "Bulk Fetch All" button that triggers the full population job
- Show estimated time (may take several minutes for all subjects x all years)
- Add the new subjects to the stats display

### Technical Details

**ALOC subject mapping:**
```text
Our Subject Name     → ALOC query param
─────────────────────────────────────────
Use of English       → english
Mathematics          → mathematics
Physics              → physics
Chemistry            → chemistry
Biology              → biology
Economics            → economics
Commerce             → commerce
Accounting           → accounting
Government           → government
Literature in English → englishlit
CRK                  → crk
IRK                  → irk
History              → history
Geography            → geography
Civic Education      → civiledu
Agricultural Science → (Veezee fallback)
Computer Studies     → (Veezee fallback)
```

**ALOC response format:**
```json
{
  "subject": "chemistry",
  "status": 200,
  "data": {
    "id": 123,
    "question": "Which of the following...",
    "option": { "a": "...", "b": "...", "c": "...", "d": "..." },
    "answer": "a",
    "section": "utme",
    "examtype": "utme",
    "examyear": "2010"
  }
}
```

**Fetch strategy per subject:**
```text
For each subject:
  For each year (2001..2024):
    Fetch 40 questions from ALOC (utme type)
    Fetch 40 questions from ALOC (wassce type)
    Upsert to cached_api_questions (deduplicate)
  If total < 50:
    Fetch 1000 from Veezee API as fallback
```

## Files to Create/Modify
- **`supabase/functions/bulk-fetch-questions/index.ts`** -- New edge function for ALOC + Veezee bulk fetch
- **`supabase/functions/sync-questions/index.ts`** -- Add ALOC as primary source, add missing subjects
- **`src/pages/JambExam.tsx`** -- Add missing subjects to JAMB_SUBJECTS array
- **`src/components/admin/QuestionBankSync.tsx`** -- Add "Bulk Fetch All" button

## Prerequisite
Before implementation, you need to provide the **ALOC API Access Token**. Please:
1. Go to https://questions.aloc.com.ng
2. Create a free account
3. Copy your Access Token from the dashboard
4. Share it here so I can store it as a secret

