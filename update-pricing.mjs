// Quick script to update database pricing
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function updatePricing() {
  console.log('🔧 Updating all pricing to ₦2,500...\n')

  // Update exam_categories
  const { data: categories, error: catError } = await supabase
    .from('exam_categories')
    .update({ monthly_price: 2500 })
    .eq('monthly_price', 1000)
    .select()

  if (catError) {
    console.error('❌ Error updating exam_categories:', catError.message)
  } else {
    console.log(`✅ Updated ${categories?.length || 0} exam categories to ₦2,500`)
  }

  // Update exam_settings
  const { data: settings, error: settingsError } = await supabase
    .from('exam_settings')
    .update({ payment_amount: 2500 })
    .eq('payment_amount', 1000)
    .select()

  if (settingsError) {
    console.error('❌ Error updating exam_settings:', settingsError.message)
  } else {
    console.log(`✅ Updated exam_settings to ₦2,500`)
  }

  // Verify
  console.log('\n📊 Verifying changes...')
  const { data: allCategories } = await supabase
    .from('exam_categories')
    .select('name, monthly_price')

  console.log('\nCurrent pricing:')
  allCategories?.forEach(cat => {
    console.log(`  ${cat.name}: ₦${cat.monthly_price}`)
  })

  console.log('\n✅ Database update complete!')
  console.log('🌐 Refresh your website to see the changes')
}

updatePricing()
