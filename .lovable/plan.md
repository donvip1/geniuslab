

# Plan: PIN Generation Password Protection & Payment Information

## Overview
Add two features:
1. **4-Digit Password Protection** - Secure PIN generation with a password that only authorized admins know
2. **Payment Information Section** - Help students know how to purchase access PINs

---

## Feature 1: PIN Generation Password Protection

### How It Works
- Admin sets a 4-digit password (numbers only) that must be entered before generating PINs
- When clicking "Generate PINs", a dialog appears asking for the 4-digit password
- Only correct password allows PIN generation
- To reset the password, admin must enter the previous password first
- Password is stored securely in the database

### Admin Experience
1. **First Time Setup**: Admin creates a 4-digit password
2. **Generating PINs**: After entering batch details, click "Generate" → Enter 4-digit password → PINs generated
3. **Changing Password**: Click "Change Password" → Enter old password → Enter new password → Confirm

---

## Feature 2: Payment Information for Students

### What Students See
When the PIN entry screen appears, students will also see:
- A card with payment instructions
- Contact information (WhatsApp number)
- Bank account details
- Amount to pay
- Option to click and message directly on WhatsApp

### Payment Details (Admin Configurable)
- Contact: 08124269495
- Bank: Opay
- Account Number: 8124269495
- Account Holder: Nsisong Etim
- Amount: 1,000 Naira (can be changed by admin)

---

## Database Changes

### 1. Create `pin_generator_settings` Table
```sql
CREATE TABLE pin_generator_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL
);
```

### 2. Add Payment Info to `exam_settings`
```sql
ALTER TABLE exam_settings ADD COLUMN 
  payment_contact text DEFAULT '08124269495',
  payment_account_number text DEFAULT '8124269495',
  payment_bank_name text DEFAULT 'Opay',
  payment_account_holder text DEFAULT 'Nsisong Etim',
  payment_amount numeric DEFAULT 1000;
```

---

## Admin UI Changes

### AccessPinManagement.tsx Enhancements

1. **Password Setup Section** (shown at top if no password set)
   - Input: Create 4-digit password
   - Input: Confirm 4-digit password
   - Button: "Set Password"

2. **Password Gate for Generation**
   - When clicking "Generate PINs", show dialog:
     - Input: 4-digit password (masked)
     - Button: "Confirm & Generate"
   - If wrong password, show error
   - If correct, proceed with generation

3. **Change Password Section**
   - Button: "Change Generation Password"
   - Dialog with:
     - Input: Current password
     - Input: New password
     - Input: Confirm new password
   - Validates old password before allowing change

4. **Payment Settings Section**
   - Inputs for:
     - Contact number
     - Bank name
     - Account number
     - Account holder name
     - Amount (Naira)
   - Button: "Update Payment Info"

---

## Student UI Changes

### PinEntryScreen.tsx Enhancements

Add a new card below the PIN entry form:

**"Need to Purchase a PIN?"**
- Message: "To get your exam access PIN, contact us via WhatsApp"
- WhatsApp button: Click to message (opens WhatsApp with pre-filled message)
- Payment details displayed clearly:
  - Amount: ₦1,000
  - Bank: Opay
  - Account: 8124269495
  - Name: Nsisong Etim
- Instructions: "Pay to the account above, then send proof of payment via WhatsApp to receive your PIN"

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/AccessPinManagement.tsx` | Add password gate, setup, and change functionality + payment settings |
| `src/components/PinEntryScreen.tsx` | Add payment information card with WhatsApp button |
| Database Migration | New table + new columns |

---

## Security Considerations

1. **Password Storage**: The 4-digit password will be hashed before storing in the database (using pgcrypto)
2. **RLS Policies**: Only admins can read/write the password settings
3. **Client-side Validation**: Password input restricted to 4 digits only
4. **Server-side Validation**: Password verified against hash before allowing generation

---

## User Flow: Generating PINs

```
Admin clicks "Generate PINs"
        ↓
Dialog appears: "Enter Generation Password"
        ↓
Admin enters 4-digit password
        ↓
    [Correct]              [Incorrect]
        ↓                       ↓
   PINs Generated         Show error message
                          "Incorrect password"
```

---

## User Flow: Student Purchasing PIN

```
Student visits /exam (without active subscription)
        ↓
PIN Entry Screen appears
        ↓
Student sees "Need to Purchase a PIN?" card
        ↓
Student clicks "Contact on WhatsApp"
        ↓
WhatsApp opens with pre-filled message:
"Hi, I want to purchase an exam access PIN"
        ↓
Student makes payment and sends proof
        ↓
Admin sends PIN to student
        ↓
Student enters PIN on the portal
        ↓
Access granted for 1 month
```

