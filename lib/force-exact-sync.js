const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qepilgryhhkqoaxnggtb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlcGlsZ3J5aGhrcW9heG5nZ3RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDkyNjE4OSwiZXhwIjoyMDU2NTAyMTg5fQ.nfcKx_1SHHiGBd7r68cspDQrpTULEBUo6GtNwd0fqsA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function forceExactSync() {
  try {
    console.log('🔄 Force syncing database with EXACT battery levels...')
    
    // Update each car with the exact battery levels that should be consistent
    const updates = [
      {
        plate_number: 'EL12345',
        battery_level: 90,
        fuel_level: 90,
      },
      {
        plate_number: 'EL67890',
        battery_level: 75,
        fuel_level: 75,
      },
      {
        plate_number: 'EL13579',
        battery_level: 60,
        fuel_level: 60,
      },
      {
        plate_number: 'EL24680',
        battery_level: 30,
        fuel_level: 30,
      },
      {
        plate_number: 'EL97531',
        battery_level: 100,
        fuel_level: 100,
      }
    ]
    
    console.log('📝 Updating cars with exact battery levels...')
    
    for (const update of updates) {
      const { data, error } = await supabase
        .from('cars')
        .update({ 
          battery_level: update.battery_level,
          fuel_level: update.fuel_level,
          last_updated: new Date().toISOString()
        })
        .eq('plate_number', update.plate_number)
        .select()
      
      if (error) {
        console.log(`❌ Error updating ${update.plate_number}:`, error.message)
      } else {
        console.log(`✅ Updated ${update.plate_number}: ${update.battery_level}% battery`)
      }
    }
    
    // Verify the updates
    console.log('\n🔍 Verifying exact battery levels...')
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('*')
    
    if (carsError) {
      console.log('❌ Error fetching cars:', carsError.message)
    } else {
      console.log(`📊 Database now contains ${cars.length} cars with exact battery levels:`)
      cars.forEach((car, index) => {
        const batteryColor = car.battery_level < 30 ? '🔴' : car.battery_level < 70 ? '🟡' : '🟢'
        console.log(`${index + 1}. ${car.plate_number} - ${car.model}`)
        console.log(`   ${batteryColor} Battery: ${car.battery_level}% | Status: ${car.status}`)
        console.log(`   📍 ${car.location} | Driver: ${car.driver_name || 'None'}`)
      })
    }
    
    console.log('\n🎉 Force sync complete!')
    console.log('✅ Both admin and main app should now show IDENTICAL battery levels:')
    console.log('   - EL12345: 90% battery')
    console.log('   - EL67890: 75% battery')
    console.log('   - EL13579: 60% battery')
    console.log('   - EL24680: 30% battery')
    console.log('   - EL97531: 100% battery')
    console.log('🔄 Please refresh both browser tabs (Ctrl+F5 or Cmd+Shift+R)')
    console.log('📱 Then click the refresh button in the main app header')
    
  } catch (err) {
    console.error('❌ Error force syncing:', err.message)
  }
}

forceExactSync() 