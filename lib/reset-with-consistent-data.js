const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qepilgryhhkqoaxnggtb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlcGlsZ3J5aGhrcW9heG5nZ3RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDkyNjE4OSwiZXhwIjoyMDU2NTAyMTg5fQ.nfcKx_1SHHiGBd7r68cspDQrpTULEBUo6GtNwd0fqsA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function resetWithConsistentData() {
  try {
    console.log('🔄 Completely resetting database with fresh, consistent data...')
    
    // Clear all tables completely
    console.log('🗑️ Clearing all existing data...')
    const { error: carsError } = await supabase.from('cars').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (carsError) {
      console.log('❌ Error clearing cars:', carsError.message)
    } else {
      console.log('✅ Cleared cars table')
    }
    
    const { error: driversError } = await supabase.from('drivers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (driversError) {
      console.log('❌ Error clearing drivers:', driversError.message)
    } else {
      console.log('✅ Cleared drivers table')
    }
    
    const { error: vaktlisteError } = await supabase.from('vaktliste').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (vaktlisteError) {
      console.log('❌ Error clearing vaktliste:', vaktlisteError.message)
    } else {
      console.log('✅ Cleared vaktliste table')
    }
    
    console.log('\n📝 Adding fresh, consistent sample data...')
    
    // Fresh sample cars with EXACTLY the same data for both interfaces
    const freshCars = [
      {
        plate_number: 'EL12345',
        model: 'Tesla Model 3',
        status: 'busy',
        location: 'På Vei',
        floor: '2. etasje',
        side: 'Venstre',
        battery_level: 85,
        fuel_level: 90,
        mileage: 45000,
        last_updated: new Date().toISOString(),
      },
      {
        plate_number: 'EL67890',
        model: 'Tesla Model Y',
        status: 'free',
        location: 'SNØ P-hus | APCOA PARKING',
        floor: '2. etasje',
        side: 'Midten',
        battery_level: 65,
        fuel_level: 75,
        mileage: 32000,
        last_updated: new Date().toISOString(),
      },
      {
        plate_number: 'EL13579',
        model: 'Tesla Model S',
        status: 'busy',
        location: 'SNØ P-hus | APCOA PARKING',
        floor: '3',
        side: 'C',
        battery_level: 45,
        fuel_level: 60,
        mileage: 28000,
        last_updated: new Date().toISOString(),
      },
      {
        plate_number: 'EL24680',
        model: 'Tesla Model X',
        status: 'maintenance',
        location: 'Service Center',
        floor: '1',
        side: 'D',
        battery_level: 20,
        fuel_level: 30,
        mileage: 55000,
        last_updated: new Date().toISOString(),
      },
      {
        plate_number: 'EL97531',
        model: 'Tesla Model 3',
        status: 'free',
        location: 'SNØ P-hus | APCOA PARKING',
        floor: '2',
        side: 'A',
        battery_level: 95,
        fuel_level: 100,
        mileage: 15000,
        last_updated: new Date().toISOString(),
      },
      {
        plate_number: 'ed12321',
        model: 'Tesla Model 3',
        status: 'free',
        location: 'SNØ P-hus | APCOA PARKING',
        battery_level: 100,
        fuel_level: 100,
        mileage: 0,
        last_updated: new Date().toISOString(),
      },
      {
        plate_number: 'TEST123',
        model: 'Tesla Model 3',
        status: 'free',
        location: 'SNØ P-hus | APCOA PARKING',
        battery_level: 100,
        fuel_level: 100,
        mileage: 0,
        last_updated: new Date().toISOString(),
      }
    ]
    
    // Fresh sample drivers
    const freshDrivers = [
      {
        name: 'Ola Nordmann',
        phone_number: '+47 123 45 678',
        email: 'ola@taxi.no',
        license_number: 'DL123456',
        status: 'active',
        join_date: '2023-01-15',
        total_hours: 1200,
        rating: 4.8,
      },
      {
        name: 'Kari Hansen',
        phone_number: '+47 987 65 432',
        email: 'kari@taxi.no',
        license_number: 'DL789012',
        status: 'active',
        join_date: '2023-03-20',
        total_hours: 980,
        rating: 4.9,
      }
    ]
    
    console.log('🚗 Adding fresh cars...')
    const { data: newCars, error: carsInsertError } = await supabase
      .from('cars')
      .insert(freshCars)
      .select()
    
    if (carsInsertError) {
      console.log('❌ Error adding cars:', carsInsertError.message)
    } else {
      console.log('✅ Added', newCars.length, 'fresh cars')
    }
    
    console.log('👥 Adding fresh drivers...')
    const { data: newDrivers, error: driversInsertError } = await supabase
      .from('drivers')
      .insert(freshDrivers)
      .select()
    
    if (driversInsertError) {
      console.log('❌ Error adding drivers:', driversInsertError.message)
    } else {
      console.log('✅ Added', newDrivers.length, 'fresh drivers')
    }
    
    // Verify the data
    console.log('\n🔍 Verifying database contents...')
    const { data: verifyCars, error: verifyError } = await supabase
      .from('cars')
      .select('*')
    
    if (verifyError) {
      console.log('❌ Error verifying cars:', verifyError.message)
    } else {
      console.log(`📊 Database now contains ${verifyCars.length} cars:`)
      verifyCars.forEach((car, index) => {
        console.log(`${index + 1}. ${car.plate_number} - ${car.model} - Battery: ${car.battery_level}% - Status: ${car.status}`)
      })
    }
    
    console.log('\n🎉 Database reset complete!')
    console.log('✅ Both admin and main app should now show IDENTICAL data')
    console.log('🔄 Please refresh both browser tabs (Ctrl+F5 or Cmd+Shift+R)')
    console.log('📱 Then click the refresh button in the main app header')
    
  } catch (err) {
    console.error('❌ Error resetting database:', err.message)
  }
}

resetWithConsistentData() 