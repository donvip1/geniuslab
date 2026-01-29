

# Plan: PIN-Based Exam Access Control System

## Overview
Implement a manual subscription system where students need valid access PINs to take exams. Admins can generate, manage, and print PINs from the dashboard.

---

## How It Works

### For Students
1. Student logs in normally
2. When attempting to take an exam (if PIN system is enabled):
   - First-time users see a PIN entry screen
   - Enter an 8-character alphanumeric PIN
   - If valid and unused, PIN is activated for that student
   - Student has exam access for 1 month from first use
3. Once PIN is activated, that student can take unlimited exams for 1 month
4. After expiration, student needs a new PIN

### For Admins
1. New "Access PINs" tab in Admin dashboard
2. Toggle to enable/disable PIN requirement globally
3. Generate PINs in batches (up to 1,000 per batch)
4. View all PINs with status (unused/used/expired)
5. Print PINs in A4 format for cutting and distribution

---

## PIN Structure

| Field | Description |
|-------|-------------|
| Format | 8 characters: uppercase letters + numbers (e.g., `A4B7C9D2`) |
| Validity | 1 month from first use |
| Usage | Single-use (one student per PIN) |
| Status | Unused / Active / Expired |

---

## Database Changes

### 1. Create `access_pins` Table
```sql
CREATE TABLE access_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_code text UNIQUE NOT NULL,
  batch_id uuid NOT NULL,
  is_used boolean DEFAULT false,
  used_by uuid REFERENCES auth.users(id),
  used_by_email text,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL
);
```

### 2. Create `pin_batches` Table (for tracking generations)
```sql
CREATE TABLE pin_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name text,
  pin_count integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL
);
```

### 3. Add PIN Settings to `exam_settings`
```sql
ALTER TABLE exam_settings
ADD COLUMN is_pin_required boolean DEFAULT false;
```

### 4. RLS Policies
- Admins can manage all PINs
- Users can check/activate PINs for themselves

---

## Admin Dashboard Features

### New "Access PINs" Tab
1. **Global Toggle**: Enable/disable PIN requirement
2. **PIN Generator**:
   - Input: Number of PINs to generate (max 1,000)
   - Optional: Batch name (e.g., "January 2026 Batch")
   - Button: "Generate PINs"
3. **PIN List View**:
   - Columns: PIN Code | Status | Used By | Activated Date | Expires At
   - Filter by: Status (All/Unused/Used/Expired)
   - Pagination for large lists
4. **Print Feature**:
   - Print selected batch in A4 format
   - Grid layout (e.g., 20 PINs per page, 4 columns x 5 rows)
   - Each PIN card shows:
     - PIN code (bold, large font)
     - "Valid for 1 month after activation"
     - "Single use only"
5. **Statistics**:
   - Total PINs generated
   - PINs used vs unused
   - Active subscriptions

---

## Student Experience Flow

```
Student clicks "Start Exam"
        ↓
System checks: Is PIN required?
        ↓
   [PIN Required]          [PIN Not Required]
        ↓                         ↓
Check: Does student             Go to exam
have active subscription?         directly
        ↓
   [Has Active]    [No Active Subscription]
        ↓                    ↓
   Go to exam         Show PIN Entry Screen
   directly                  ↓
                    Student enters PIN
                         ↓
              System validates:
              - PIN exists?
              - PIN unused?
              - PIN not expired?
                         ↓
             [Valid]           [Invalid]
                ↓                  ↓
          Activate PIN      Show error message
          Link to student   "Invalid or used PIN"
          Set expiry (30 days)
                ↓
           Go to exam
```

---

## Files to Create

### 1. `src/components/admin/AccessPinManagement.tsx`
- Main admin component for PIN management
- Includes generator, list, filters, and print functionality

### 2. `src/components/PinEntryScreen.tsx`
- Full-screen PIN entry UI for students
- Input field for 8-character PIN
- Validation feedback
- "Back to home" option

---

## Files to Modify

### 1. `src/pages/Admin.tsx`
- Add "Access PINs" tab with the Key icon

### 2. `src/pages/Exam.tsx`
- Check if PIN is required before showing subjects
- Check if user has active subscription
- Show PIN entry screen if needed

### 3. `src/pages/ExamTaking.tsx`
- Verify subscription before allowing exam start

### 4. `src/components/admin/ExamModeManagement.tsx`
- Add link to "Access PINs" section (optional)

---

## Print Layout Design

A4 page with PIN cards arranged in a grid:

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│   GENIUSLAB     │   GENIUSLAB     │   GENIUSLAB     │   GENIUSLAB     │
│                 │                 │                 │                 │
│   A4B7C9D2      │   E5F8G2H1      │   K3L6M9N4      │   P7Q2R5S8      │
│                 │                 │                 │                 │
│   Valid: 1 Month│   Valid: 1 Month│   Valid: 1 Month│   Valid: 1 Month│
│   Single Use    │   Single Use    │   Single Use    │   Single Use    │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┤
│   GENIUSLAB     │   GENIUSLAB     │   GENIUSLAB     │   GENIUSLAB     │
│       ...       │       ...       │       ...       │       ...       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

Each page: 4 columns x 5 rows = 20 PINs
1,000 PINs = 50 pages

---

## Technical Implementation Summary

| Component | Action |
|-----------|--------|
| Database | 2 new tables + 1 column added |
| Admin UI | New Access PINs tab with full management |
| Student Flow | PIN validation before exam access |
| Print | PDF generation with grid layout |

---

## Security Considerations
- PINs are generated server-side with cryptographically random characters
- RLS ensures only admins can generate/view all PINs
- Students can only see their own subscription status
- PIN validation happens server-side before exam access

