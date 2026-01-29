-- Remove the broad authentication policy that allows email harvesting
DROP POLICY IF EXISTS "Require authentication for profiles" ON profiles;