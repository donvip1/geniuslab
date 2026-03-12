

# Plan: Fix Auth Flow, Trial Limits, Explanations, and Mobile Layout

## Issues to Address

1. **Signup does not redirect to sign-in tab** -- After successful signup, the code tries to programmatically click the login tab via DOM query selector, which is unreliable.
2. **Username sign-in not supported** -- Currently only email+password login exists for non-admin users. Need to look up the user's email from their username in the `profiles` table and then authenticate.
3. **Explanations truncated on exam results** -- The explanation text is rendered as a single `{question.explanation}` inside a div. If it's long, there's no overflow issue in the code itself, but this could be a data issue from the edge function or the `ExpandableText` component is not used here. Need to verify the edge function returns full explanations and ensure the results page renders them fully (with proper whitespace/line breaks).
4. **Free trial resets on retake** -- The `SubscriptionGate` trial logic tracks `questions_used_today` per day but resets daily. The requirement is: once a user has used their 10 free questions total (lifetime), they should never get free questions again on that account.
5. **Admin dashboard mobile layout** -- The tab grid with 13 tabs overflows badly on mobile (390px). Text wrapping and card layouts are not mobile-optimized.

---

## Technical Plan

### 1. Fix Signup Redirect to Login Tab
**File:** `src/pages/Auth.tsx`
- Replace the unreliable DOM click approach with React state. Add an `activeTab` state variable.
- After successful signup, set `activeTab` to `"login"` and clear the signup form.

### 2. Enable Username Sign-In
**File:** `src/pages/Auth.tsx`
- Add a toggle or automatic detection: if the login input doesn't contain `@`, treat it as a username.
- Replace the separate email/username fields with a single "Email or Username" field.
- On login, if input lacks `@`, query the `profiles` table for a matching `username` to retrieve the `email`, then authenticate with that email + password.

**Database:** No schema changes needed. The `profiles` table already has a `username` column and allows authenticated SELECT on own profile. However, we need a way to look up email by username for *unauthenticated* users at login time. This requires either:
- An RLS policy allowing anon SELECT on `profiles` filtered to just email by username (security concern), OR
- A database function (security definer) that takes a username and returns the email.

**Recommended:** Create a `get_email_by_username` security definer function that returns only the email for a given username. This avoids exposing the profiles table.

**Migration:**
```sql
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE username = p_username LIMIT 1;
$$;
```

### 3. Fix Explanation Display
**File:** `src/pages/ExamResults.tsx`
- The explanation is rendered as `{question.explanation}` in a plain div. Add `whitespace-pre-line` class and use the `ExpandableText` component or simply render the full text with proper line break handling.
- The edge function (`submit-exam/index.ts`) already returns the full `explanation` field from the database, so this is a frontend display issue.

### 4. Lifetime Free Question Limit
**Database Migration:** Add a `total_questions_used` column to `user_trials`:
```sql
ALTER TABLE public.user_trials ADD COLUMN IF NOT EXISTS total_questions_used integer NOT NULL DEFAULT 0;
```

**File:** `src/components/SubscriptionGate.tsx`
- Change trial logic: instead of checking `questions_used_today` against a daily cap, check `total_questions_used` against the lifetime cap (e.g., 10).
- When `total_questions_used >= trialMaxQuestions`, trial is expired regardless of days remaining.
- Remove the daily reset logic (`last_question_date` comparison).

**File:** `src/pages/ExamTaking.tsx` (or wherever questions-used is incremented)
- After exam submission, increment `total_questions_used` by the number of questions answered.

### 5. Admin Dashboard Mobile Layout
**File:** `src/pages/Admin.tsx`
- Restructure the TabsList: use a horizontally scrollable container (`overflow-x-auto`) instead of a fixed grid that wraps badly.
- Use `flex` with `flex-nowrap` and `min-w-fit` on each trigger so tabs scroll horizontally.
- Add proper padding (`px-4 py-3`) to all cards and content areas.
- Fix subject list items: stack badges vertically on mobile instead of inline.
- Ensure all text uses `break-words` and `min-w-0` to prevent overflow.

### 6. Global Mobile App Polish
- Ensure all pages use proper mobile padding (`px-4`), card spacing, and readable text sizes.
- The admin dashboard is the primary offender based on the user's feedback, but a pass through key pages (Exam, ExamTaking, ExamResults, Profile) should apply consistent mobile-first spacing.

---

## Summary of Changes

| Area | Files | Type |
|------|-------|------|
| Signup redirect | `Auth.tsx` | Code only |
| Username login | `Auth.tsx` + DB migration | Code + Migration |
| Explanations | `ExamResults.tsx` | Code only |
| Trial lifetime cap | `SubscriptionGate.tsx`, `ExamTaking.tsx` + DB migration | Code + Migration |
| Admin mobile layout | `Admin.tsx` | Code only |
| General mobile polish | Multiple pages | Code only |

