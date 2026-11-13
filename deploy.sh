#!/bin/bash
# Quick deployment script for GeniusLab updates

echo "🚀 GeniusLab Deployment Script"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Step 1: Building web app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi

echo "✅ Build completed successfully!"
echo ""

echo "🔄 Step 2: Syncing to Android (Capacitor)..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed!"
    exit 1
fi

echo "✅ Synced to Android successfully!"
echo ""

echo "📱 Step 3: Building Android release..."
cd android
./gradlew bundleRelease

if [ $? -ne 0 ]; then
    echo "❌ Android build failed!"
    cd ..
    exit 1
fi

cd ..
echo "✅ Android release built successfully!"
echo ""

echo "🎉 All done!"
echo ""
echo "Next steps:"
echo "1. ✅ Web deployment: Push to GitHub (done) → Vercel auto-deploys"
echo "2. 📱 Android: Upload AAB to Play Store"
echo "   File location: android/app/build/outputs/bundle/release/app-release.aab"
echo "3. 🗄️ Database: Run migrations in Supabase dashboard"
echo "4. 🔐 Security: Deploy edge function: supabase functions deploy verify-admin-access"
echo ""
echo "📖 See UPDATES_SUMMARY.md for detailed instructions"
