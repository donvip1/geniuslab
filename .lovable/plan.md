

# Plan: Admin Exam Lock & User Management Features

## Overview
Add two powerful admin control features:
1. **Exam Section Lock/Unlock** - Control access to the entire exam section for all users
2. **User Management** - Suspend, ban, or pause users by email address

---

## Feature 1: Exam Section Lock/Unlock

### How It Works
- Admin toggle in the Admin panel to lock/unlock the exam section
- When locked, students see a "Exams Currently Unavailable" message instead of the exam page
- Admin can add a custom message explaining why exams are locked

### What Users Will See
When exams are locked:
- A friendly lock screen with the admin's custom message
- Option to go back to the homepage
- Admins can still access everything normally

---

## Feature 2: User Management

### How It Works
- New "User Management" tab in Admin panel
- Search users by email address
- Actions available:
  - **Pause** - Temporary restriction (user sees "account paused" message)
  - **Suspend** - Medium-term restriction with reason shown
  - **Ban** - Permanent block from the platform

### What Happens to Affected Users
- When they log in, they see a message explaining their account status
- They cannot access exams or other protected content
- Admins can view all restricted users and undo restrictions

---

## Technical Implementation

### Database Changes

**1. Update exam_settings table:**
```sql
ALTER TABLE exam_settings 
ADD COLUMN is_exams_locked boolean DEFAULT false,
ADD COLUMN lock_message text;
```

**2. Create user_restrictions table:**
```sql
CREATE TABLE user_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  restriction_type text NOT NULL, -- 'paused', 'suspended', 'banned'
  reason text,
  restricted_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz, -- null for permanent
  is_active boolean DEFAULT true
);

-- RLS: Only admins can manage, users can view their own status
```

### Files to Create
1. `src/components/admin/UserManagement.tsx` - Admin UI for managing users

### Files to Modify
1. `src/pages/Admin.tsx` - Add new User Management tab
2. `src/pages/Exam.tsx` - Check if exams are locked and show lock screen
3. `src/pages/ExamTaking.tsx` - Verify user isn't restricted before allowing exam
4. `src/components/admin/ExamModeManagement.tsx` - Add exam lock toggle
5. `src/pages/Auth.tsx` - Check user restrictions on login

---

## Admin Panel Changes

### Exam Mode Tab Enhancement
- Add "Lock All Exams" toggle at the top
- Add custom lock message input field
- Visual indicator showing current lock status

### New User Management Tab
- Search bar to find users by email
- Table showing all restricted users
- Actions: Pause, Suspend, Ban, Remove Restriction
- Reason input when restricting a user
- Optional expiry date for temporary restrictions

---

## User Experience Flow

### When Exams Are Locked:
```
Student visits /exam
  ↓
System checks exam_settings.is_exams_locked
  ↓
If locked → Show lock screen with admin message
If unlocked → Show normal exam page
```

### When User Is Restricted:
```
User logs in or visits protected page
  ↓
System checks user_restrictions for their user_id
  ↓
If restricted → Show restriction message with reason
If not → Allow normal access
```

---

## Summary of Changes

| Component | Change |
|-----------|--------|
| Database | 1 new table, 2 new columns |
| Admin Panel | New tab + enhanced Exam Mode section |
| Exam Pages | Lock screen + restriction checks |
| Auth Flow | Restriction validation |

