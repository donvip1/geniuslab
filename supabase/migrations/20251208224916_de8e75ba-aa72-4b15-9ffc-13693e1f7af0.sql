-- Fix: User Email Addresses and Names Exposed to Anonymous Visitors
-- Add baseline authentication requirement for profiles table
CREATE POLICY "Require authentication for profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix: Admin Usernames Could Be Discovered by Attackers
-- Add baseline authentication requirement for admin_credentials table
CREATE POLICY "Require authentication for admin_credentials"
ON public.admin_credentials
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Fix: User Role Information Could Be Enumerated by Hackers
-- Add baseline authentication requirement for user_roles table
CREATE POLICY "Require authentication for user_roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add explicit admin-only modification policies for user_roles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'));