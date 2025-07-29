const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qepilgryhhkqoaxnggtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlcGlsZ3J5aGhrcW9heG5nZ3RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDkyNjE4OSwiZXhwIjoyMDU2NTAyMTg5fQ.nfcKx_1SHHiGBd7r68cspDQrpTULEBUo6GtNwd0fqsA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')

    // Test basic connection
    const { data, error } = await supabase
      .from('_test_connection')
      .select('*')
      .limit(1)

    if (error) {
      console.log('Connection test result:', error.message)
    } else {
      console.log('✅ Connection successful')
    }

    // Try to create a simple test table
    console.log('\nAttempting to create test table...')
    
    // For now, let's just test if we can insert data into a table that might exist
    // We'll need to create the tables through the Supabase dashboard
    
    console.log('📝 Please create the following tables in your Supabase dashboard:')
    console.log('1. drivers (id, name, phone_number, email, license_number, status, join_date, total_hours, rating, created_at)')
    console.log('2. cars (id, plate_number, model, status, location, floor, side, battery_level, fuel_level, mileage, driver_id, driver_name, reserved_by, reserved_from, reserved_to, before_photo, after_photo, notes, maintenance_reason, pickup_charge_level, return_charge_level, last_updated, created_at)')
    console.log('3. vaktliste (id, driver_id, driver_name, date, start_time, end_time, total_hours, vehicle_assigned, status, notes, shift_number, created_at)')
    
  } catch (error) {
    console.error('Error testing connection:', error)
  }
}

testConnection() 