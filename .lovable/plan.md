

## Plan: Reorganize Mobile Nav, Build Student Profile, Add Forgot Password & Password Toggle

### 1. Reorganize Mobile Bottom Nav (`src/components/MobileBottomNav.tsx`)

**Bottom bar tabs (4 items):** Home, Exams, Subscribe (`/payment`), Services

**Replace "More" tab with "Profile":** Links to `/profile` (new page). Shows `User` icon.

**Move "More" menu button to top-right navbar** on mobile (in `src/components/Navbar.tsx`):
- Replace the mobile Login/Logout button with a hamburger Menu icon that opens a Sheet
- Sheet contains: About Us, Contact, Study Materials, Logout (when logged in) / Login (when not)
- Remove JAMB Exam from more links

### 2. Update Navbar for Mobile More Menu (`src/components/Navbar.tsx`)

- On mobile: show a Menu (hamburger) icon button in the top-right corner
- Clicking opens a Sheet with links: About Us, Contact, Study Materials, and Logout (if logged in) or Login (if not)
- Remove the standalone Login/Logout button on mobile

### 3. Create Student Profile Page (`src/pages/Profile.tsx`)

New `/profile` route with these sections:
- **User Info Card**: Display username, full name, email, with an "Edit" button to update username/full_name
- **Exam Stats**: Total exams taken, average score, best score (from `exam_attempts` table)
- **Exam History**: List of past attempts with subject, score, date, time taken
- **Performance Summary**: Simple stats like pass rate, total questions answered
- Logout button at bottom
- Back to Home link
- Protected route: redirects to `/auth` if not logged in

### 4. Add Route (`src/App.tsx`)

- Import and add `<Route path="/profile" element={<Profile />} />`

### 5. Add Forgot Password Feature (`src/pages/Auth.tsx`)

- Add "Forgot Password?" link below the login password field
- When clicked, show a simple form asking for email
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Show success toast

### 6. Create Reset Password Page (`src/pages/ResetPassword.tsx`)

- New `/reset-password` route
- Checks for `type=recovery` in URL hash
- Shows form to enter new password + confirm
- Calls `supabase.auth.updateUser({ password })`
- Add route to `App.tsx`

### 7. Add Password Visibility Toggle (`src/pages/Auth.tsx`)

- Add eye/eye-off icon button next to all password fields (login password, signup password, confirm password)
- Toggles between `type="password"` and `type="text"`

### Technical Details

- Profile page queries `exam_attempts` table joined with subject info for history
- Edit profile uses `supabase.from("profiles").update()` — RLS already allows users to update own profile
- Forgot password uses built-in Supabase auth `resetPasswordForEmail`
- Reset password page uses `updateUser` after recovery token is consumed
- No database changes needed — all tables and policies already exist

