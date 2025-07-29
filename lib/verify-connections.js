const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qepilgryhhkqoaxnggtb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlcGlsZ3J5aGhrcW9heG5nZ3RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDkyNjE4OSwiZXhwIjoyMDU2NTAyMTg5fQ.nfcKx_1SHHiGBd7r68cspDQrpTULEBUo6GtNwd0fqsA'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyConnections() {
  try {
    console.log('🔍 Verifying connected data across all interfaces...')
    
    // Get all cars with driver information
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('*')
    
    if (carsError) {
      console.log('❌ Error fetching cars:', carsError.message)
      return
    }
    
    console.log(`\n📊 Cars with driver assignments:`)
    cars.forEach((car, index) => {
      const driverInfo = car.driver_name ? `👤 ${car.driver_name}` : '❌ No driver assigned'
      const batteryColor = car.battery_level < 30 ? '🔴' : car.battery_level < 70 ? '🟡' : '🟢'
      console.log(`${index + 1}. ${car.plate_number} - ${car.model}`)
      console.log(`   ${batteryColor} Battery: ${car.battery_level}% | Status: ${car.status}`)
      console.log(`   📍 ${car.location} | ${driverInfo}`)
    })
    
    // Get all drivers
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
    
    if (driversError) {
      console.log('❌ Error fetching drivers:', driversError.message)
      return
    }
    
    console.log(`\n👥 Drivers:`)
    drivers.forEach((driver, index) => {
      console.log(`${index + 1}. ${driver.name}`)
      console.log(`   📞 ${driver.phone_number} | ⭐ Rating: ${driver.rating}`)
      console.log(`   📧 ${driver.email} | 🚗 License: ${driver.license_number}`)
    })
    
    // Get all vaktliste entries
    const { data: vaktliste, error: vaktlisteError } = await supabase
      .from('vaktliste')
      .select('*')
    
    if (vaktlisteError) {
      console.log('❌ Error fetching vaktliste:', vaktlisteError.message)
      return
    }
    
    console.log(`\n📅 Vaktliste entries:`)
    vaktliste.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.driver_name}`)
      console.log(`   📅 ${entry.date} | ⏰ ${entry.start_time}-${entry.end_time}`)
      console.log(`   🚗 Car: ${entry.vehicle_assigned} | 📝 ${entry.notes}`)
      console.log(`   📊 Status: ${entry.status}`)
    })
    
    // Check connections
    console.log(`\n🔗 Connection verification:`)
    
    // Check which cars have drivers assigned
    const carsWithDrivers = cars.filter(car => car.driver_name)
    const carsWithoutDrivers = cars.filter(car => !car.driver_name)
    
    console.log(`✅ ${carsWithDrivers.length} cars have drivers assigned:`)
    carsWithDrivers.forEach(car => {
      console.log(`   - ${car.plate_number} → ${car.driver_name}`)
    })
    
    console.log(`❌ ${carsWithoutDrivers.length} cars have no driver assigned:`)
    carsWithoutDrivers.forEach(car => {
      console.log(`   - ${car.plate_number} (${car.status})`)
    })
    
    // Check which drivers have vaktliste entries
    const driversWithShifts = vaktliste.map(entry => entry.driver_name)
    const uniqueDriversWithShifts = [...new Set(driversWithShifts)]
    
    console.log(`📅 ${uniqueDriversWithShifts.length} drivers have scheduled shifts:`)
    uniqueDriversWithShifts.forEach(driverName => {
      const driverShifts = vaktliste.filter(entry => entry.driver_name === driverName)
      console.log(`   - ${driverName}: ${driverShifts.length} shifts`)
    })
    
    console.log(`\n🎉 Verification complete!`)
    console.log(`✅ All interfaces should now show connected data:`)
    console.log(`   - Main app: Shows cars with driver assignments`)
    console.log(`   - Admin page: Shows drivers, cars, and vaktliste`)
    console.log(`   - Driver management: Shows actual driver data`)
    console.log(`🔄 Please refresh both browser tabs to see the connected data`)
    
  } catch (err) {
    console.error('❌ Error verifying connections:', err.message)
  }
}

verifyConnections() 