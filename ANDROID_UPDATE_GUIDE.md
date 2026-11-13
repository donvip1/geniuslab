# Android App Update Guide

## 🤖 How the Android App Works

Your GeniusLab Android app uses **Capacitor**, which wraps your React web app into a native Android container. The app loads the web content from the `dist` folder.

---

## 📱 Why Changes Don't Reflect Immediately

The Android app on the Play Store contains a **bundled version** of your web app from when you last built it. When you make changes to the website, the Android app doesn't automatically update because:

1. The Android app has a **local copy** of the web files
2. Users need to **download an update** from Play Store
3. Or the app needs to implement **live updates** (OTA updates)

---

## 🔄 Option 1: Update via Play Store (Traditional Method)

### Step 1: Build the Web App
```bash
cd /Users/macbook/geniuslab/geniuslab
npm run build
```

### Step 2: Sync to Android
```bash
npx cap sync android
```

This copies the latest `dist` folder to the Android project.

### Step 3: Build the Android APK/AAB
```bash
cd android
./gradlew assembleRelease
# or for Play Store bundle:
./gradlew bundleRelease
```

### Step 4: Upload to Play Store
1. Go to Google Play Console
2. Navigate to your app → Production → Create new release
3. Upload the new AAB file from: `android/app/build/outputs/bundle/release/app-release.aab`
4. Add release notes (e.g., "New pricing: ₦2,500 for 3 months")
5. Submit for review

### Step 5: Users Update
Users will see an update available in Play Store and need to manually update.

**Downside:** Takes 1-3 days for Google review, users need to manually update.

---

## ⚡ Option 2: Live Updates (Recommended - Instant Updates)

Use **Capawesome Cloud** or **Capacitor Updater** to push updates instantly without Play Store review!

### Install Capacitor Updater
```bash
npm install @capawesome/capacitor-app-update
npx cap sync
```

### Configure Live Updates

1. **Add to capacitor.config.ts:**
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.donvip.geniuslab',
  appName: 'GeniusLab CBT',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    CapacitorUpdater: {
      autoUpdate: true,
      resetWhenUpdate: false
    }
  },
  server: {
    // Point to your live web URL for updates
    url: 'https://geniuslabz.xyz',
    cleartext: true
  }
};

export default config;
```

2. **Add update checking code** in `src/main.tsx`:
```typescript
import { CapacitorUpdater } from '@capawesome/capacitor-app-update';

// Check for updates on app start
CapacitorUpdater.notifyAppReady();

CapacitorUpdater.addListener('updateAvailable', async (info) => {
  console.log('Update available:', info);
  await CapacitorUpdater.performImmediateUpdate();
});
```

### How It Works:
- App checks your website (geniuslabz.xyz) on launch
- If the web version is newer, it downloads and applies the update
- Users get updates **instantly** without Play Store approval
- Native changes still need Play Store update

---

## 🚀 Quick Update Process (Both Methods)

```bash
# 1. Make your changes (already done - pricing updates)

# 2. Build the web app
npm run build

# 3. Sync to Android
npx cap sync android

# 4. For Play Store method:
cd android
./gradlew bundleRelease

# 5. For live updates method:
# Just deploy to Vercel - the app will auto-update!
git push origin main
```

---

## 🎯 Recommended Approach for Your Case

Since you already have the app on Play Store and want instant updates:

### Short Term (Now):
1. Build and submit a new version to Play Store with updated pricing
2. This ensures users who don't have auto-updates get the changes

### Long Term (Best Solution):
1. Implement Capacitor Live Updates (Option 2)
2. Future changes to pricing, UI, etc. will be instant
3. Only native feature changes need Play Store updates

---

## 📋 Checklist for Current Update

- [x] ✅ Updated pricing in all React components
- [x] ✅ Updated database migration for ₦2,500
- [x] ✅ Changed subscription duration to 3 months
- [ ] 🔲 Build web app: `npm run build`
- [ ] 🔲 Sync to Android: `npx cap sync android`
- [ ] 🔲 Build Android release: `cd android && ./gradlew bundleRelease`
- [ ] 🔲 Upload AAB to Play Store
- [ ] 🔲 (Optional) Implement live updates for future instant updates

---

## 🛠️ Build Commands Reference

### Development Build (Testing)
```bash
npm run build
npx cap sync android
npx cap open android
# Then click Run in Android Studio
```

### Production Build (Play Store)
```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
# AAB file will be in: android/app/build/outputs/bundle/release/
```

### Check App Version
Update version in `package.json` and `android/app/build.gradle`:
```gradle
versionCode 2  // Increment for each release
versionName "1.1.0"
```

---

## 🔍 Troubleshooting

### Problem: Changes still not showing in Android app
**Solution:**
1. Clear Android Studio cache: `./gradlew clean`
2. Delete `android/app/src/main/assets/public` folder
3. Run `npx cap sync android` again
4. Rebuild the app

### Problem: App crashes after update
**Solution:**
1. Check if all dependencies are in `package.json`
2. Run `npm install` again
3. Clear and rebuild: `./gradlew clean && ./gradlew bundleRelease`

### Problem: Old pricing still showing
**Solution:**
- The Android app caches the old `dist` folder
- You must rebuild and redistribute via Play Store
- Or implement live updates to bypass this

---

## 📞 Next Steps

**To get the pricing update to your users NOW:**

1. Run the build commands:
```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
```

2. Upload the AAB to Play Store Console

3. Wait for Google approval (1-3 days)

4. Users will see the update in Play Store

**To prevent this delay in future:**
- Implement Capacitor Live Updates (see Option 2 above)
- All web changes will be instant!

---

## 💡 Pro Tip

If you need **emergency updates** without waiting for Play Store:
- Use live updates feature
- Or use a remote config service (Firebase Remote Config)
- Store pricing in Supabase and fetch it dynamically (already doing this!)

Since your pricing is already stored in `exam_categories.monthly_price` in Supabase, the Android app should actually show the correct price once the database is updated, as long as the components fetch from the database on load.

**Did you run the database migration?** If not, run:
```bash
supabase db push
```

This will update the pricing in the database, and both web and Android will show ₦2,500!
