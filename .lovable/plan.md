

## Plan: Paystack Auto-Access, Payment Success Flow, and PIN Section Restructure

### 1. Add Paystack Payment Callback Handler
- In `Payment.tsx`, detect `?trxref=` and `?reference=` URL params (added by Paystack redirect)
- When detected, verify payment by checking `payment_transactions` table for a matching reference with `status = 'success'`
- If the webhook hasn't processed yet, poll a few times with short delays
- Show a success popup/dialog confirming payment was successful and access is granted

### 2. Payment Success Popup
- Create a success dialog in `Payment.tsx` that appears after Paystack callback verification
- Content: checkmark icon, "Payment Successful!", "You now have unlimited access to [Category Name] for 1 month", and a "Start Practicing" button that navigates to `/exam`

### 3. Restructure the Payment Page Layout
- Move the manual bank transfer details (Opay, 8124269495, Nsisong Etim) and WhatsApp contact button **under the PIN entry card**, below the "Activate PIN" button
- Remove the separate payment card for manual transfer — keep only Paystack as the dedicated payment card
- The PIN card will contain: PIN input + Activate button, then a divider "or pay manually", then bank details + WhatsApp button

### 4. Change PIN Duration to 1 Month (30 days)
- Update `Payment.tsx` PIN activation: change `expiresAt.setDate(expiresAt.getDate() + 35)` → `+ 30`
- Update `PinEntryScreen.tsx` PIN activation: same change from 35 → 30 days
- Update `paystack-webhook/index.ts`: change subscription duration from 35 → 30 days
- Update UI text from "1 month + 5 days" → "1 month" everywhere

### 5. Paystack Webhook Already Handles Auto-Access
- The existing `paystack-webhook` edge function already creates a `subscription_plans` record on `charge.success`
- The `SubscriptionGate` already checks `subscription_plans` for active subscriptions
- No changes needed here — just ensure the callback URL includes the category info for the success popup

### Files to Modify
- `src/pages/Payment.tsx` — callback detection, success popup, restructured layout, PIN duration
- `src/components/PinEntryScreen.tsx` — PIN duration change
- `supabase/functions/paystack-webhook/index.ts` — duration change from 35 → 30
- `supabase/functions/paystack-initialize/index.ts` — update callback_url to include category params

