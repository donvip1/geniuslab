# Post-Build Deployment Checklist

## ⏳ Currently Building
- Android release bundle is building (takes 5-10 minutes)
- File will be at: `android/app/build/outputs/bundle/release/app-release.aab`

---

## ✅ Already Completed
1. ✅ Web app built successfully
2. ✅ Capacitor synced to Android
3. ✅ Updated AdMob plugin to v8.3.0
4. ✅ All code changes pushed to GitHub
5. ✅ Vercel is auto-deploying the web app

---

## 🚀 Next Steps After Build Completes

### 1. Upload to Google Play Store
1. Go to https://play.google.com/console
2. Navigate to your app: GeniusLab CBT
3. Click on "Production" → "Create new release"
4. Upload the AAB file from: `android/app/build/outputs/bundle/release/app-release.aab`
5. Add release notes:
   ```
   What's New in v1.2:
   - New pricing: ₦2,500 for 3 months (better value!)
   - Enhanced security features
   - Improved offline experience
   - Better loading states and user feedback
   - Bug fixes and performance improvements
   ```
6. Review and submit for review
7. Wait 1-3 days for Google approval

### 2. Update Database (Critical!)
Run these migrations in Supabase:

**Option A: Via Supabase CLI**
```bash
supabase db push
```

**Option B: Via Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Run: `supabase/migrations/20250115_create_admin_access_logs.sql`
3. Run: `supabase/migrations/20250115_update_pricing_to_2500.sql`

### 3. Deploy Security Edge Function (Optional but Recommended)
```bash
supabase functions deploy verify-admin-access
```

Then enable IP whitelisting:
1. Go to Supabase Dashboard → Settings → Edge Functions
2. Add environment variable:
   - Name: `ENABLE_ADMIN_IP_WHITELIST`
   - Value: `true` (or `false` for now)

### 4. Configure IP Whitelist (Optional)
1. Get your IP: `curl https://api.ipify.org`
2. Edit `supabase/functions/verify-admin-access/index.ts`
3. Add your IP to `WHITELISTED_IPS` array
4. Redeploy: `supabase functions deploy verify-admin-access`

---

## 📊 What Users Will See

### Web Users (Already Live)
- ✅ New pricing: ₦2,500 for 3 months
- ✅ Updated UI and animations
- ✅ Network status notifications
- ✅ Better loading and error states

### Android Users (After Play Store Update)
- ⏳ Will continue seeing old pricing until they update
- ⏳ Update will be available 1-3 days after Play Store approval
- ✅ Auto-update enabled users will get it automatically

---

## 🔍 Verification Steps

After deployment:
1. [ ] Check web app at https://geniuslabz.xyz
2. [ ] Verify pricing shows ₦2,500 everywhere
3. [ ] Test payment flow
4. [ ] Check admin panel security logs
5. [ ] Test network status (go offline/online)
6. [ ] Verify database has updated pricing
7. [ ] Check Android app after Play Store approval

---

## 📱 Version Info

**Web:** Auto-deployed by Vercel ✅  
**Android:** v1.2 (versionCode 5)  
**Database:** Needs manual migration  
**Security:** Edge function ready to deploy  

---

## 🆘 If Something Goes Wrong

**Build fails:**
- Check gradle logs
- Run: `cd android && ./gradlew clean`
- Then: `./gradlew bundleRelease`

**Database issues:**
- Rollback with Supabase dashboard
- Check migration syntax

**Play Store rejection:**
- Address specific issues mentioned
- Common: Privacy policy, permissions

**Users see old pricing on web:**
- Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
- Clear browser cache

---

## 📞 Support Resources

- Supabase Dashboard: https://supabase.com/dashboard
- Play Console: https://play.google.com/console
- Vercel Dashboard: https://vercel.com
- GitHub Repo: https://github.com/donvip1/geniuslab

---

**Waiting for Android build to complete...**
You'll be notified when it's done!
