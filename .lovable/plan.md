

# WAEC/NECO/NABTEB Course-Based Subject Selection + Trial Fix

## What's Changing

### 1. Course-Based Subject Selection for WAEC, NECO, NABTEB

Currently, subjects are listed in flat categories. We'll restructure to a Nigerian secondary school course-based selection:

**Step 1: Pick your course track**
- Science
- Commercial (Business Studies)
- Arts/Humanities

**Step 2: Pick a single subject from your track**

Each track shows relevant subjects:

| Science | Commercial | Arts |
|---------|-----------|------|
| Physics | Commerce | Government |
| Chemistry | Accounting | Literature in English |
| Biology | Economics | History |
| Agricultural Science | Business Methods | CRK/IRK |
| Further Mathematics | Insurance | Fine Arts |
| Computer Studies | Office Practice | Yoruba/Igbo/Hausa |
| Geography | Marketing | Geography |
| Mathematics | Mathematics | Civic Education |
| English Language | English Language | English Language |

**Key changes:**
- Single subject selection (not up to 4) -- WAEC/NECO/NABTEB are single-subject exams
- 50 questions per subject (realistic exam count)
- 1 hour timer (60 minutes)
- Course track chips for quick filtering

### 2. Free Trial Visibility Fix

The free trial banner IS currently working (confirmed via testing -- see screenshot above). However, two improvements:

- For brand new users hitting the page for the first time, the trial record insert may silently fail if there's an RLS issue. We'll add error handling and a fallback display.
- The "Continue Trial" button text could be more prominent -- we'll make it auto-grant access for trial users instead of requiring them to click through the gate.

## Technical Details

### Files Modified

**`src/pages/ApiExam.tsx`**
- Replace `EXAM_SUBJECTS` flat list with course-track-based structure
- Add course track selector (Science / Commercial / Arts) as toggle group
- Change to single subject selection (remove multi-select, remove "up to 4" limit)
- Update questions per subject from 20 to 50
- Update timer from 45 minutes to 60 minutes
- Show subjects filtered by selected course track

**`src/components/SubscriptionGate.tsx`**
- When trial is active, auto-grant access (set `hasAccess = true`) instead of showing the gate with a "Continue Trial" button
- This means trial users go straight to subject selection without an extra click
- Only show the gate when trial is expired or no trial exists
- Add better error handling for the trial insert (catch and display gracefully)

### No database changes needed
The subject list is hardcoded for API-based exams (fetched from Veezee API by name), so no schema changes required.

