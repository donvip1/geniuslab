

# Plan: Fix Profiles Table Security (Prevent Email Harvesting)

## The Problem Explained Simply

Right now, your `profiles` table has a security rule that says "anyone who is logged in can see everyone's profile." This is dangerous because:

1. A student creates an account
2. They can now see the email addresses of ALL students
3. They could collect these emails for spam or sell them

## What We'll Change

### Database Change
Remove the overly permissive policy and keep only the necessary ones:

| Before (Current) | After (Fixed) |
|------------------|---------------|
| Anyone logged in can see all profiles | Only you see your own profile |
| Admins can see all profiles | Admins can see all profiles (unchanged) |

### SQL Migration
```sql
-- Remove the broad authentication policy that allows email harvesting
DROP POLICY IF EXISTS "Require authentication for profiles" ON profiles;
```

## Impact on Your App

| Feature | Will it still work? |
|---------|---------------------|
| User Management (admin search by email) | ✅ Yes - admin policy remains |
| Students viewing their own profile | ✅ Yes - own profile policy remains |
| Students seeing other students' emails | ❌ No - this is the security hole we're closing |

## Summary

This is a simple one-line fix that removes the security vulnerability while keeping all your admin features working.

