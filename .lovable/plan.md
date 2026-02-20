

# Phase 1: Core Restructuring and Payment Integration

This phase covers the foundational changes needed to support multiple exam types, university selection, semester-based organization, Paystack payments, and the trial/subscription access model.

---

## Overview of Changes

1. Rename "FUOYE CBT Exams" to "University CBT Exams"
2. Add WAEC, NECO, NABTEB exam categories
3. Restructure JAMB modes (Practice = single subject/30 min, Mock UTME = 4 subjects/2 hrs)
4. Add Nigerian universities list with searchable dropdown
5. Add semester-based question organization (1st and 2nd semester)
6. Build 5-day/5-question free trial system
7. Build Paystack checkout flow (N1,000/month per exam type)
8. Separate PIN/subscription per exam type
9. Update PIN duration to 1 month + 5 days grace
10. Admin controls for semester toggling

---

## Database Changes

### New Tables

**`exam_categories`** -- Defines each exam type (University CBT, JAMB, WAEC, NECO, NABTEB)
- id, name, slug, description, icon_name, is_active, display_order, monthly_price (default 1000)

**`nigerian_universities`** -- All Nigerian universities, polytechnics, colleges
- id, name, abbreviation, type (federal/state/polytechnic/college), state, is_active

**`subscription_plans`** -- Tracks paid subscriptions per exam category
- id, user_id, exam_category_id, plan_type (pin/paystack), status (active/expired/trial), starts_at, expires_at, payment_reference, created_at

**`payment_transactions`** -- Paystack payment records
- id, user_id, exam_category_id, amount, currency, reference, paystack_reference, status (pending/success/failed), created_at

**`user_trials`** -- Tracks the 5-day trial per user per exam category
- id, user_id, exam_category_id, trial_start_date, questions_used_today (int), last_question_date, created_at

### Modified Tables

**`subjects`** -- Add columns:
- semester (text: "first" or "second")
- exam_category_id (uuid, references exam_categories)
- department (text, nullable)

**`access_pins`** -- Add column:
- exam_category_id (uuid, references exam_categories) -- so PINs are category-specific

**`exam_settings`** -- Add columns:
- allow_semester_selection (boolean, default true) -- admin toggle for semester mode

### Seed Data

- Populate `exam_categories` with: University CBT, JAMB UTME, WAEC, NECO, NABTEB
- Populate `nigerian_universities` with all known Nigerian universities (federal, state, polytechnics, key colleges) -- approximately 200+ institutions

---

## Edge Functions

### `paystack-initialize` (new)
- Accepts: exam_category_id, user email
- Creates a payment_transactions record (pending)
- Calls Paystack API to initialize transaction
- Returns authorization_url for redirect

### `paystack-webhook` (new)
- Receives Paystack webhook events
- On successful payment: creates subscription_plans record (1 month + 5 days), updates payment_transactions status
- Verifies webhook signature using PAYSTACK_SECRET_KEY

### `verify-veezee-pin` (new, placeholder for Phase 2)
- Will call Veezee's PIN verification endpoint
- For now: stub that returns "not implemented" until API details are provided

---

## Frontend Changes

### Exam Category Selection (`src/pages/Exam.tsx`)
- Rename "FUOYE CBT Exams" to "University CBT Exams"
- Add WAEC, NECO, NABTEB cards (with appropriate logos/icons)
- Each category routes to its own flow

### University Selection (new component)
- Searchable dropdown/combobox using cmdk (already installed)
- Groups universities by type (Federal, State, Polytechnic, College)
- Shown when user selects "University CBT Exams"
- Selection is cosmetic/filtering -- all share the same question bank

### Semester Toggle
- Toggle buttons (1st Semester / 2nd Semester) shown in University CBT exam selection
- Admin dashboard toggle to enable/disable semester selection globally
- Questions filtered by semester when selecting subjects

### JAMB Mode Restructuring (`src/pages/JambExam.tsx`)
- **Practice Mode**: Single subject selection, 30-minute timer, 10 questions
- **Mock UTME**: Keep current 4-subject combo, 2-hour timer, 40 questions (unchanged)

### Access Control Flow (new `SubscriptionGate` component)
Before attempting any exam, users see one of these states:

```text
User arrives at exam
       |
  Has active subscription for this category?
       |
    Yes --> Proceed to exam
    No  --> Has trial remaining?
              |
           Yes --> Allow 5 questions (show "X days left" banner)
           No  --> Show subscription options:
                     - Enter PIN (manual or Veezee)
                     - Pay with Paystack (N1,000/month)
```

### Pricing/Checkout Page (new component)
- Shows N1,000/month for selected exam category
- "I have a PIN" button --> PIN entry form
- "Pay with Paystack" button --> Paystack checkout redirect
- Trial info: "5 free questions per day for 5 days"

### PIN Duration Update
- Change PIN expiry from 1 month to 1 month + 5 days (35 days total)
- Update display text accordingly

### Admin Dashboard Updates
- Semester toggle switch in Exam Mode Management
- Exam category filter for PIN management
- View subscriptions by category

---

## Question Fetching Logic

For all exam types:
1. Check local database first for questions matching the subject + semester + level
2. If no questions found in database, fall back to Veezee API (for supported categories)
3. Trial users get only 5 questions per day

---

## Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | Create new tables, alter existing ones, seed data |
| `supabase/functions/paystack-initialize/index.ts` | New edge function |
| `supabase/functions/paystack-webhook/index.ts` | New edge function |
| `supabase/config.toml` | Add new function configs |
| `src/pages/Exam.tsx` | Restructure categories, add subscription gate |
| `src/pages/JambExam.tsx` | Split Practice (30 min/1 subject) vs Mock (2 hrs/4 subjects) |
| `src/components/PinEntryScreen.tsx` | Add exam category context, 35-day expiry |
| `src/components/SubscriptionGate.tsx` | New -- access control with trial/PIN/Paystack options |
| `src/components/UniversitySelector.tsx` | New -- searchable university dropdown |
| `src/components/SemesterToggle.tsx` | New -- semester selection UI |
| `src/components/PaystackCheckout.tsx` | New -- payment flow UI |
| `src/components/admin/ExamModeManagement.tsx` | Add semester toggle |
| `src/components/admin/AccessPinManagement.tsx` | Add category filter |

---

## Important Notes

- All prices are N1,000 monthly across all exam types
- PINs are now category-specific (a JAMB PIN won't work for University CBT)
- The Veezee PIN verification will be added in Phase 2 once you provide the API details
- Paystack webhook URL will be generated when the edge function is deployed -- you'll need to add it to your Paystack dashboard
- The university list is for selection/display purposes; all universities share the same question bank organized by level/semester

