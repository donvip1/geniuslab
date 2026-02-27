

## Plan: Scientific Calculator + Admin Subscription Bypass

### 1. Create `ScientificCalculator` component
New file: `src/components/ScientificCalculator.tsx`

- A floating, draggable-feel calculator that appears when a button is clicked
- Two modes toggled via tabs: **Normal** and **Scientific**
- **Normal mode**: digits 0-9, +, -, ×, ÷, =, %, ±, decimal, clear, backspace
- **Scientific mode**: adds sin, cos, tan, log, ln, √, x², xʸ, π, e, (, ), factorial
- State: expression string, result display, mode toggle
- Renders as a fixed-position panel (bottom-right) with a close button
- Uses `eval()` with sanitized input (or manual expression parser) for calculation
- Styled to look like a real calculator with grid layout buttons

### 2. Add calculator toggle button to JAMB exam header
In `src/pages/JambExam.tsx`:
- Add `Calculator` icon (from lucide-react) button in the exam header bar (near the timer/finalize area)
- State: `showCalculator` boolean
- Render `<ScientificCalculator>` when toggled on
- Available in both practice and mock modes during active exam

### 3. Admin bypass for JAMB SubscriptionGate
In `src/pages/JambExam.tsx`:
- Add `isAdmin` state (boolean)
- During auth init, query `user_roles` for admin role (same pattern as `ExamTaking.tsx` line 129-136)
- Conditionally wrap mode selection in `<SubscriptionGate>` only when `!isAdmin` (matching the pattern already used in `ExamTaking.tsx` lines 654-668)

### Technical details

**Calculator expression handling:**
- Replace display symbols (×→*, ÷→/) before evaluation
- Scientific functions mapped: `sin(` → `Math.sin(`, `π` → `Math.PI`, etc.
- Error handling wraps eval in try/catch, shows "Error" on invalid expressions
- Max display length capped to prevent overflow

**Files changed:**
- `src/components/ScientificCalculator.tsx` (new)
- `src/pages/JambExam.tsx` (add calculator + admin bypass)

