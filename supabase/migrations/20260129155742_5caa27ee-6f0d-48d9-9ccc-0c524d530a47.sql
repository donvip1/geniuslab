-- Allow authenticated users to check if an unused PIN exists
-- This enables students to verify their PIN before activating it
CREATE POLICY "Users can check unused pins" 
ON access_pins FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_used = false
);