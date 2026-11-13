-- Create admin access logs table for security monitoring
CREATE TABLE IF NOT EXISTS admin_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  access_granted BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_user_id ON admin_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_timestamp ON admin_access_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_ip ON admin_access_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_admin_access_logs_granted ON admin_access_logs(access_granted);

-- Enable RLS
ALTER TABLE admin_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Admins can view all access logs"
  ON admin_access_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create a view for recent suspicious activity
CREATE OR REPLACE VIEW admin_security_alerts AS
SELECT
  user_id,
  email,
  ip_address,
  user_agent,
  reason,
  timestamp,
  COUNT(*) OVER (PARTITION BY user_id, DATE(timestamp)) as attempts_today
FROM admin_access_logs
WHERE access_granted = false
  AND timestamp > now() - interval '7 days'
ORDER BY timestamp DESC;

-- Grant access to authenticated users (RLS will filter)
GRANT SELECT ON admin_security_alerts TO authenticated;

COMMENT ON TABLE admin_access_logs IS 'Logs all admin access attempts for security monitoring and audit trail';
COMMENT ON VIEW admin_security_alerts IS 'Shows failed admin access attempts for security monitoring';
