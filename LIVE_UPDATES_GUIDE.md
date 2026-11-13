# Live Updates for Android App - Instant Web-to-Mobile Sync

## 🎯 Goal
Make web changes automatically deploy to the Android app without waiting for Play Store approval.

---

## ⚡ Solution: Capacitor Live Updates

There are two main options for live updates:

### Option 1: Capgo (Recommended - Free for small apps)
- ✅ Free tier: 500 updates/month
- ✅ Automatic updates from GitHub/Vercel
- ✅ Rollback capability
- ✅ Easy setup

### Option 2: Server URL Update (Simple but limited)
- ✅ Points app to live website
- ⚠️ Requires internet connection always
- ⚠️ Slower than bundled app

---

## 🚀 Implementation Guide

### Method 1: Capgo Live Updates (Best Option)

#### Step 1: Install Capgo
```bash
npm install @capgo/capacitor-updater
npx cap sync
```

#### Step 2: Sign up for Capgo
1. Go to https://web.capgo.app
2. Sign up with GitHub
3. Create a new app
4. Copy your API key

#### Step 3: Configure Capgo
Add to `capacitor.config.ts`:
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
    },
  },
};

export default config;
```

#### Step 4: Initialize in App
Add to `src/main.tsx` (before ReactDOM.render):
```typescript
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Initialize updater
CapacitorUpdater.notifyAppReady();

// Listen for updates
CapacitorUpdater.addListener('updateAvailable', async (info) => {
  console.log('Update available:', info);
  // Automatically download and apply
  await CapacitorUpdater.download({
    version: info.version,
    url: info.url,
  });
  await CapacitorUpdater.set({ version: info.version });
});
```

#### Step 5: Deploy Updates
```bash
# Build your web app
npm run build

# Upload to Capgo (first time setup)
npx @capgo/cli init

# Upload update
npx @capgo/cli upload

# Set as production
npx @capgo/cli set --channel production
```

#### Step 6: Automate with GitHub Actions
Create `.github/workflows/deploy-mobile.yml`:
```yaml
name: Deploy to Mobile
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Upload to Capgo
        run: |
          npx @capgo/cli upload --apikey=${{ secrets.CAPGO_API_KEY }}
          npx @capgo/cli set --channel production
        env:
          CAPGO_API_KEY: ${{ secrets.CAPGO_API_KEY }}
```

Add your Capgo API key to GitHub Secrets:
1. Go to GitHub repo → Settings → Secrets → Actions
2. Add new secret: `CAPGO_API_KEY` = your key from Capgo

---

### Method 2: Point to Live Website (Simple Alternative)

#### Configure capacitor.config.ts:
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.donvip.geniuslab',
  appName: 'GeniusLab CBT',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    url: 'https://geniuslabz.xyz',
    cleartext: true,
    androidScheme: 'https',
  },
};

export default config;
```

Then rebuild:
```bash
npx cap sync
cd android && ./gradlew bundleRelease
```

**Pros:**
- ✅ Instant updates (app loads from website)
- ✅ No separate update mechanism needed

**Cons:**
- ❌ Requires internet always
- ❌ Slower than bundled
- ❌ Against Play Store policies (may be rejected)

---

### Method 3: Hybrid Approach (Recommended for Production)

Use bundled app + Capgo for updates:

1. **Initial load:** Use bundled files (fast, works offline)
2. **Updates:** Capgo downloads and replaces bundle
3. **Fallback:** If update fails, use bundled version

This is the best of both worlds!

---

## 📊 How It Works

### Without Live Updates (Current):
```
Web Changes → GitHub → Vercel ✓ (Web updated)
                    ↓
            Android Build → Play Store → Review (1-3 days) → Users Update
```

### With Live Updates (Capgo):
```
Web Changes → GitHub → Vercel ✓ (Web updated)
                    ↓
            GitHub Actions → Capgo → Android Apps Update (5 minutes) ✓
```

---

## 🎯 What Can Be Updated Without Play Store

### ✅ Can Update Instantly:
- UI changes (colors, layouts, text)
- Pricing changes
- New features (JavaScript/TypeScript)
- Bug fixes
- Content updates
- API endpoints

### ❌ Needs Play Store Update:
- New native plugins
- Permission changes (AndroidManifest.xml)
- App name/icon changes
- Gradle configuration changes
- Native code changes

---

## 🔧 Setup Instructions (Capgo)

1. **Install Capgo CLI:**
   ```bash
   npm install @capgo/capacitor-updater
   npx cap sync
   ```

2. **Sign up:**
   ```bash
   npx @capgo/cli init
   ```
   This will open Capgo website to create account.

3. **Link your app:**
   ```bash
   npx @capgo/cli app add
   ```

4. **Upload first version:**
   ```bash
   npm run build
   npx @capgo/cli upload
   ```

5. **Test update:**
   - Open Android app
   - Make a change on web
   - Build and upload: `npm run build && npx @capgo/cli upload`
   - App should update within 5 minutes on next app open

---

## 💰 Pricing

### Capgo Free Tier:
- 500 updates/month
- Unlimited apps
- Perfect for small teams

### Capgo Pro ($10/month):
- 5,000 updates/month
- Priority support
- Analytics

For GeniusLab's scale, **Free tier should be sufficient** unless you have thousands of active users.

---

## 🧪 Testing Live Updates

1. **Build and upload current version:**
   ```bash
   npm run build
   npx @capgo/cli upload --channel production
   ```

2. **Install app on device**

3. **Make a visible change** (e.g., change a color)

4. **Build and upload:**
   ```bash
   npm run build
   npx @capgo/cli upload --channel production
   ```

5. **Close and reopen app** - You should see the change!

---

## 🔒 Security Considerations

- ✅ Capgo uses code signing
- ✅ Updates are encrypted
- ✅ You can rollback bad updates
- ✅ Users always have last working version as fallback
- ⚠️ Make sure HTTPS is enabled on your server

---

## 📝 Alternative: Manual Hot Reload

If you don't want third-party services, you can implement your own:

1. **Store app version in Supabase:**
   ```sql
   CREATE TABLE app_versions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     version TEXT NOT NULL,
     bundle_url TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Check version on app start:**
   ```typescript
   const checkForUpdates = async () => {
     const { data } = await supabase
       .from('app_versions')
       .select('*')
       .order('created_at', { ascending: false })
       .limit(1)
       .single();
     
     if (data && data.version !== currentVersion) {
       // Download and apply update
     }
   };
   ```

3. **Host updates on your server**

But this requires significant development work. **Capgo is easier and more reliable.**

---

## 🎯 Recommended Next Steps

1. ✅ **Keep current setup** for now (web auto-deploys via Vercel)
2. ✅ **Upload this build to Play Store** (fixes pricing)
3. ⏭️ **Setup Capgo for future** (takes 30 minutes)
4. ⏭️ **Add GitHub Action** for automatic updates

This way:
- Web changes → Vercel (instant)
- Android changes → Capgo (5 minutes)
- No more Play Store delays for content updates!

---

## 📞 Support

**Capgo Documentation:** https://capgo.app/docs  
**Capgo Discord:** https://discord.gg/VnYRvBfgA6  

**Questions?** Let me know and I can help with the setup!
