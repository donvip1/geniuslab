

## Plan: Auth-aware Navbar, Username in Signup, and Payment Verification

### 1. Make Navbar and MobileBottomNav auth-aware
**Problem**: Login button always shows regardless of auth state.

**Changes to `src/components/Navbar.tsx`**:
- Add `useEffect` + `onAuthStateChange` listener to track session state
- When logged in: show user avatar/icon + "Logout" button instead of "Login"
- When logged out: show "Login" button (current behavior)

**Changes to `src/components/MobileBottomNav.tsx`**:
- Same auth state tracking
- Change "Login / Sign Up" in moreLinks to "Profile" or "Logout" when logged in

### 2. Add Username field to Signup
**Database migration**: Add `username` column (unique, nullable) to `profiles` table.

**Changes to `src/pages/Auth.tsx`**:
- Add username input to signup form
- Pass username in `signUp()` metadata
- Update `handle_new_user()` trigger to save username to profiles

### 3. Verify Payment routing
**Current state**: Paystack initialize and webhook edge functions exist and look correct:
- `paystack-initialize`: creates pending transaction, redirects to Paystack
- `paystack-webhook`: verifies signature, updates transaction, creates 35-day subscription
- `SubscriptionGate`: handles PIN + Paystack + trial flow
- `PAYSTACK_SECRET_KEY` secret is configured

**Potential issue**: The `callback_url` in paystack-initialize sends user back to the current page after payment, but there's no explicit payment verification on return. The webhook handles the backend, which is correct. I'll verify the webhook URL is properly configured.

### Files to modify
- **Modify** `src/components/Navbar.tsx` — add auth state, conditional Login/Logout
- **Modify** `src/components/MobileBottomNav.tsx` — auth-aware menu items
- **Modify** `src/pages/Auth.tsx` — add username field to signup
- **Migration** — add `username` column to `profiles` table
- **Migration** — update `handle_new_user()` trigger to include username

### Technical details
- Auth state uses `supabase.auth.onAuthStateChange()` for real-time session tracking in Navbar
- Username column: `text`, unique, nullable (existing users don't have one)
- Trigger update: `COALESCE(NEW.raw_user_meta_data->>'username', NULL)` for username

