#!/bin/bash
# Emergency database pricing update script

echo "🔧 Updating Database Pricing to ₦2,500"
echo "========================================"
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo ""
    echo "Please run the SQL manually in Supabase Dashboard:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to SQL Editor"
    echo "4. Run this SQL:"
    echo ""
    cat update_pricing_now.sql
    echo ""
    exit 1
fi

echo "📝 Running database update..."
supabase db execute --file update_pricing_now.sql

if [ $? -eq 0 ]; then
    echo "✅ Database updated successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Check your website - pricing should now show ₦2,500"
    echo "2. Test a payment flow to verify"
    echo "3. Deploy edge functions: supabase functions deploy paystack-initialize"
else
    echo "❌ Database update failed!"
    echo ""
    echo "Manual steps:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. SQL Editor → Run the queries in update_pricing_now.sql"
fi
