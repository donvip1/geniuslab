
# Plan: Fix Login Flow - Ensure Proper Authentication Sequence

## The Problem
When you click "Login", you're being redirected straight to the Exam page. This happens because:
1. You're already logged in from a previous session
2. The Auth page detects your existing session and automatically sends you to Exam
3. This is confusing because you expect to see the login form

## The Solution
**Remove the automatic redirect from the Auth page**. Instead:
- If a user is already logged in and visits the Auth page, show a message like "You're already logged in" with options to go to Exam or Logout
- This gives users control and makes it clear what's happening

---

## Technical Changes

### File: `src/pages/Auth.tsx`

**Current Behavior (lines 50-59):**
```tsx
useEffect(() => {
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate("/exam");  // Auto-redirect - confusing!
    }
  };
  checkUser();
}, [navigate]);
```

**New Behavior:**
- Add a state to track if user is already logged in
- Instead of auto-redirecting, show a "You're already logged in" card with:
  - Message explaining they're logged in
  - Button: "Go to Exams" → navigates to /exam
  - Button: "Logout" → signs out and shows login form

---

## User Experience After Fix

### Scenario 1: Not logged in, clicks Login
1. User clicks "Login" button
2. Auth page shows login/signup form
3. User logs in
4. Redirected to Exam page (or Admin if admin)

### Scenario 2: Already logged in, clicks Login
1. User clicks "Login" button
2. Auth page shows: "You're already logged in as [email]"
3. Two options:
   - "Go to Exams" → takes them to exam page
   - "Logout" → signs them out, shows login form

### Scenario 3: Not logged in, clicks Take Exam
1. User clicks "Take Exam" 
2. Exam page detects no session → redirects to Auth
3. User logs in
4. Redirected to Exam page → PIN entry (if required)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Replace auto-redirect with "already logged in" UI |

---

## Visual Flow After Fix

```text
User clicks "Login"
      |
      v
Is user logged in?
      |
  +---+---+
  |       |
  No     Yes
  |       |
  v       v
Show     Show "Already logged in"
Login    with options:
Form     [Go to Exams] [Logout]
```
