const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qepilgryhhkqoaxnggtb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlcGlsZ3J5aGhrcW9heG5nZ3RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDkyNjE4OSwiZXhwIjoyMDU2NTAyMTg5fQ.nfcKx_1SHHiGBd7r68cspDQrpTULEBUo6GtNwd0fqsA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createConnectedSamples() {
  try {
    console.log('🗑️ Deleting all existing data...')
    
    // Clear all tables completely
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
    
    console.log('\n👥 Creating connected drivers...')
    
    // Create drivers first
    const drivers = [
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
      },
      {
        name: 'Erik Johansen',
        phone_number: '+47 555 12 345',
        email: 'erik@taxi.no',
        license_number: 'DL345678',
        status: 'active',
        join_date: '2023-06-10',
        total_hours: 750,
        rating: 4.7,
      }
    ]
    
    const { data: newDrivers, error: driversInsertError } = await supabase
      .from('drivers')
      .insert(drivers)
      .select()
    
    if (driversInsertError) {
      console.log('❌ Error adding drivers:', driversInsertError.message)
      return
    } else {
      console.log('✅ Added', newDrivers.length, 'drivers')
    }
    
    console.log('\n🚗 Creating connected cars...')
    
    // Create cars with driver assignments
    const cars = [
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
        driver_id: newDrivers[0].id, // Ola Nordmann
        driver_name: newDrivers[0].name,
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
        driver_id: newDrivers[1].id, // Kari Hansen
        driver_name: newDrivers[1].name,
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
        driver_id: newDrivers[2].id, // Erik Johansen
        driver_name: newDrivers[2].name,
        last_updated: new Date().toISOString(),
      }
    ]
    
    const { data: newCars, error: carsInsertError } = await supabase
      .from('cars')
      .insert(cars)
      .select()
    
    if (carsInsertError) {
      console.log('❌ Error adding cars:', carsInsertError.message)
      return
    } else {
      console.log('✅ Added', newCars.length, 'cars')
    }
    
    console.log('\n📅 Creating connected vaktliste entries...')
    
    // Create vaktliste entries that connect drivers to cars
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    const vaktlisteEntries = [
      {
        driver_id: newDrivers[0].id,
        driver_name: newDrivers[0].name,
        date: today.toISOString().split('T')[0],
        start_time: '08:00',
        end_time: '16:00',
        vehicle_assigned: 'EL12345',
        status: 'completed',
        notes: 'Morning shift completed',
      },
      {
        driver_id: newDrivers[1].id,
        driver_name: newDrivers[1].name,
        date: today.toISOString().split('T')[0],
        start_time: '16:00',
        end_time: '00:00',
        vehicle_assigned: 'EL13579',
        status: 'scheduled',
        notes: 'Evening shift',
      },
      {
        driver_id: newDrivers[2].id,
        driver_name: newDrivers[2].name,
        date: tomorrow.toISOString().split('T')[0],
        start_time: '06:00',
        end_time: '14:00',
        vehicle_assigned: 'EL97531',
        status: 'scheduled',
        notes: 'Early morning shift',
      },
      {
        driver_id: newDrivers[0].id,
        driver_name: newDrivers[0].name,
        date: tomorrow.toISOString().split('T')[0],
        start_time: '14:00',
        end_time: '22:00',
        vehicle_assigned: 'EL67890',
        status: 'scheduled',
        notes: 'Afternoon shift',
      }
    ]
    
    const { data: newVaktliste, error: vaktlisteInsertError } = await supabase
      .from('vaktliste')
      .insert(vaktlisteEntries)
      .select()
    
    if (vaktlisteInsertError) {
      console.log('❌ Error adding vaktliste:', vaktlisteInsertError.message)
      return
    } else {
      console.log('✅ Added', newVaktliste.length, 'vaktliste entries')
    }
    
    // Verify the connected data
    console.log('\n🔍 Verifying connected data...')
    
    const { data: verifyCars, error: verifyCarsError } = await supabase
      .from('cars')
      .select('*')
    
    if (verifyCarsError) {
      console.log('❌ Error verifying cars:', verifyCarsError.message)
    } else {
      console.log(`📊 Database now contains ${verifyCars.length} connected cars:`)
      verifyCars.forEach((car, index) => {
        const driverInfo = car.driver_name ? ` - Driver: ${car.driver_name}` : ' - No driver assigned'
        console.log(`${index + 1}. ${car.plate_number} - ${car.model} - Battery: ${car.battery_level}% - Status: ${car.status}${driverInfo}`)
      })
    }
    
    const { data: verifyDrivers, error: verifyDriversError } = await supabase
      .from('drivers')
      .select('*')
    
    if (verifyDriversError) {
      console.log('❌ Error verifying drivers:', verifyDriversError.message)
    } else {
      console.log(`👥 Database now contains ${verifyDrivers.length} drivers:`)
      verifyDrivers.forEach((driver, index) => {
        console.log(`${index + 1}. ${driver.name} - ${driver.phone_number} - Rating: ${driver.rating}`)
      })
    }
    
    const { data: verifyVaktliste, error: verifyVaktlisteError } = await supabase
      .from('vaktliste')
      .select('*')
    
    if (verifyVaktlisteError) {
      console.log('❌ Error verifying vaktliste:', verifyVaktlisteError.message)
    } else {
      console.log(`📅 Database now contains ${verifyVaktliste.length} vaktliste entries:`)
      verifyVaktliste.forEach((entry, index) => {
        console.log(`${index + 1}. ${entry.driver_name} - ${entry.date} ${entry.start_time}-${entry.end_time} - Car: ${entry.vehicle_assigned}`)
      })
    }
    
    console.log('\n🎉 Connected sample data created successfully!')
    console.log('✅ All interfaces should now show connected data:')
    console.log('   - Main app: Shows cars with driver assignments')
    console.log('   - Admin page: Shows drivers, cars, and vaktliste')
    console.log('   - Driver management: Shows actual driver data')
    console.log('🔄 Please refresh both browser tabs (Ctrl+F5 or Cmd+Shift+R)')
    
  } catch (err) {
    console.error('❌ Error creating connected samples:', err.message)
  }
}

createConnectedSamples() 