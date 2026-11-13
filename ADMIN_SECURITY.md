# Admin Security Configuration

## 🔒 Security Features

GeniusLab now has enterprise-grade admin panel security:

1. **IP Whitelisting** - Restrict admin access to specific IP addresses
2. **Session Hijacking Detection** - Alerts on suspicious IP changes
3. **Access Logging** - Full audit trail of all access attempts
4. **Multi-layer Authentication** - JWT token + role verification + IP check

---

## 🛠️ Setup Instructions

### Step 1: Deploy the Edge Function

```bash
# Deploy the admin verification function to Supabase
cd supabase
supabase functions deploy verify-admin-access
```

### Step 2: Run Database Migration

```bash
# Apply the security logs table migration
supabase db push
```

Or manually run the SQL in `supabase/migrations/20250115_create_admin_access_logs.sql` in your Supabase SQL Editor.

### Step 3: Configure IP Whitelist (Optional but Recommended)

#### Get Your Current IP Address:
```bash
curl https://api.ipify.org
```

#### Option A: Configure via Supabase Dashboard
1. Go to Supabase Dashboard → Settings → Edge Functions
2. Add environment variable:
   - Name: `ENABLE_ADMIN_IP_WHITELIST`
   - Value: `true`

#### Option B: Configure in local `.env`
```env
ENABLE_ADMIN_IP_WHITELIST=true
```

#### Add Your IP to the Whitelist:
Edit `supabase/functions/verify-admin-access/index.ts`:

```typescript
const WHITELISTED_IPS: string[] = [
  "197.210.226.58",  // Your office IP
  "102.89.32.15",    // Your home IP
  "41.203.105.20",   // Your mobile hotspot IP
];
```

Then redeploy:
```bash
supabase functions deploy verify-admin-access
```

---

## 📊 Monitoring Security

### View Access Logs
1. Login to admin panel
2. Go to **Security** tab
3. View all access attempts with:
   - ✅ Granted access (green)
   - ❌ Denied access (red)
   - IP addresses
   - Timestamps
   - Reasons for denial

### Database Queries for Advanced Monitoring

**View failed access attempts in last 24 hours:**
```sql
SELECT * FROM admin_access_logs 
WHERE access_granted = false 
  AND timestamp > now() - interval '24 hours'
ORDER BY timestamp DESC;
```

**View suspicious IP changes:**
```sql
SELECT 
  email,
  ip_address,
  timestamp,
  LAG(ip_address) OVER (PARTITION BY user_id ORDER BY timestamp) as previous_ip
FROM admin_access_logs
WHERE access_granted = true
ORDER BY timestamp DESC;
```

**Get security alerts:**
```sql
SELECT * FROM admin_security_alerts;
```

---

## 🚨 Security Alerts

The system automatically logs:
- ❌ Failed login attempts
- 🚫 Blocked IP addresses
- ⚠️ Rapid IP changes (potential session hijacking)
- ✅ Successful admin access

### Email Notifications (Optional)

To get email alerts for security events, add this to the edge function:

```typescript
// Add after logging blocked access
await supabase.functions.invoke('send-security-alert', {
  body: {
    type: 'blocked_ip',
    ip: ip,
    email: user.email,
    timestamp: new Date().toISOString()
  }
});
```

---

## 🔐 Security Best Practices

### ✅ DO:
- Enable IP whitelisting for production
- Use VPN with static IP for consistent access
- Monitor the Security tab regularly
- Review access logs weekly
- Use strong passwords + 2FA on Supabase account

### ❌ DON'T:
- Share admin credentials
- Access admin panel from public WiFi without VPN
- Disable IP whitelist in production
- Ignore failed access attempts
- Use the same password across services

---

## 🧪 Testing the Security

### Test 1: Normal Access (Should Pass)
```bash
# From your whitelisted IP
curl -X POST https://your-project.supabase.co/functions/v1/verify-admin-access \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: `{"success": true, "access": true}`

### Test 2: Blocked IP (Should Fail)
```bash
# From a non-whitelisted IP (if whitelist is enabled)
curl -X POST https://your-project.supabase.co/functions/v1/verify-admin-access \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: `{"error": "Access denied - IP not authorized", "access": false}`

### Test 3: No Token (Should Fail)
```bash
curl -X POST https://your-project.supabase.co/functions/v1/verify-admin-access
```

Expected: `{"error": "No authorization header", "access": false}`

---

## 🔧 Troubleshooting

### Problem: Can't Access Admin Panel
**Solution:**
1. Check if IP whitelist is enabled: `ENABLE_ADMIN_IP_WHITELIST=true`
2. Get your current IP: `curl https://api.ipify.org`
3. Add your IP to whitelist in the edge function
4. Redeploy: `supabase functions deploy verify-admin-access`

### Problem: "Access Denied" even with admin role
**Solution:**
1. Check database: `SELECT * FROM user_roles WHERE role = 'admin'`
2. Ensure your user_id has admin role
3. Check edge function logs in Supabase Dashboard

### Problem: Mobile access not working
**Solution:**
Mobile IPs change frequently. Either:
- Disable IP whitelist for mobile access
- Use a VPN with static IP
- Add a secondary authentication method

---

## 📱 Development vs Production

### Development (Localhost)
```typescript
const ENABLE_IP_WHITELIST = false; // Disabled for dev
```

### Production (Live Site)
```typescript
const ENABLE_IP_WHITELIST = true; // Enabled for security
const WHITELISTED_IPS = ["your.real.ip.address"];
```

---

## 🆘 Emergency Access

If locked out:
1. Go to Supabase Dashboard → SQL Editor
2. Run: 
```sql
UPDATE user_roles SET role = 'admin' WHERE user_id = 'YOUR_USER_ID';
```
3. Temporarily disable IP whitelist:
   - Set `ENABLE_ADMIN_IP_WHITELIST=false` in edge function
   - Redeploy function

---

## 📞 Support

If you need help:
1. Check Security tab for denial reason
2. Review Supabase logs: Dashboard → Edge Functions → Logs
3. Check database: `SELECT * FROM admin_access_logs ORDER BY timestamp DESC LIMIT 10`

**Remember:** Security logs are your friend! They tell you exactly why access was denied.
