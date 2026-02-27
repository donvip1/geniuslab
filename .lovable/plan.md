

## Converting Your App to a Native Android App

You want to publish your GeniusLab app on the Google Play Store. There are two approaches:

**Option 1: Installable Web App (PWA)** — Users install directly from the browser to their home screen. No Play Store needed. Simpler but limited phone features.

**Option 2: True Native App with Capacitor (Recommended for Play Store)** — A real Android app you can publish to Google Play. Full access to phone features. This is what you need.

Since you want the Play Store listing, here's the full Capacitor setup plan:

---

### What I'll Do (Code Changes)

1. **Install Capacitor dependencies**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`
2. **Initialize Capacitor config** in the project root with:
   - App ID: `app.lovable.086ca4210276493cabb6eef95b1e3ef8`
   - App Name: `geniuslab`
   - Live-reload server URL pointing to your preview
3. **Ensure the app is fully mobile-optimized** (already done with bottom nav)

---

### What You'll Do (Step-by-Step on Your Mac)

After I make the code changes, follow these steps exactly:

**Step 1: Get the code on your Mac**
- Go to Settings → GitHub → Export to GitHub (connect your GitHub account if not already)
- Open Terminal on your Mac
- Run: `git clone <your-github-repo-url>`
- Run: `cd <project-folder-name>`

**Step 2: Install dependencies**
- Run: `npm install`

**Step 3: Add Android platform**
- Run: `npx cap add android`
- This creates an `android/` folder in your project

**Step 4: Build and sync**
- Run: `npm run build`
- Run: `npx cap sync`

**Step 5: Open in Android Studio**
- Run: `npx cap open android`
- Android Studio will open with your project
- Wait for Gradle to finish syncing (bottom progress bar)

**Step 6: Run on emulator or phone**
- In Android Studio, click the green Play ▶ button
- Choose an emulator or connect your Android phone via USB
- The app will install and run

**Step 7: Prepare for Play Store (later)**
- In Android Studio: Build → Generate Signed Bundle / APK
- Choose "Android App Bundle"
- Create a keystore (store this file safely — you need it for every update)
- Upload the `.aab` file to [Google Play Console](https://play.google.com/console)
- You'll need a Google Play Developer account ($25 one-time fee)

---

### Important Notes
- Every time you make changes in Lovable, run `git pull` then `npx cap sync` on your Mac
- During development, the app loads from your live preview URL (hot-reload)
- For the final Play Store build, you'll switch the config to use the built files instead of the live URL
- I also recommend reading the [Lovable mobile development guide](https://docs.lovable.dev/tips-tricks/mobile-development) for additional tips

