const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qepilgryhhkqoaxnggtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlcGlsZ3J5aGhrcW9heG5nZ3RiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDkyNjE4OSwiZXhwIjoyMDU2NTAyMTg5fQ.nfcKx_1SHHiGBd7r68cspDQrpTULEBUo6GtNwd0fqsA'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupDatabase() {
  try {
    console.log('Setting up database...')

    // Create drivers table
    const { error: driversError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS drivers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          phone_number TEXT,
          email TEXT,
          license_number TEXT UNIQUE,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
          join_date DATE DEFAULT CURRENT_DATE,
          total_hours INTEGER DEFAULT 0,
          rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    })

    if (driversError) {
      console.error('Error creating drivers table:', driversError)
    } else {
      console.log('✅ Drivers table created')
    }

    // Create cars table
    const { error: carsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS cars (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          plate_number TEXT UNIQUE NOT NULL,
          model TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'busy', 'reserved', 'maintenance')),
          location TEXT,
          floor TEXT,
          side TEXT,
          battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
          fuel_level INTEGER DEFAULT 100 CHECK (fuel_level >= 0 AND fuel_level <= 100),
          mileage INTEGER DEFAULT 0,
          driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
          driver_name TEXT,
          reserved_by TEXT,
          reserved_from TIMESTAMP,
          reserved_to TIMESTAMP,
          before_photo TEXT,
          after_photo TEXT,
          notes TEXT,
          maintenance_reason TEXT,
          pickup_charge_level INTEGER,
          return_charge_level INTEGER,
          last_updated TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    })

    if (carsError) {
      console.error('Error creating cars table:', carsError)
    } else {
      console.log('✅ Cars table created')
    }

    // Create vaktliste table
    const { error: vaktlisteError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS vaktliste (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
          driver_name TEXT NOT NULL,
          date DATE NOT NULL,
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          total_hours DECIMAL(4,2) GENERATED ALWAYS AS (
            EXTRACT(EPOCH FROM (end_time::time - start_time::time)) / 3600
          ) STORED,
          vehicle_assigned TEXT REFERENCES cars(plate_number) ON DELETE SET NULL,
          status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
          notes TEXT,
          shift_number INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `
    })

    if (vaktlisteError) {
      console.error('Error creating vaktliste table:', vaktlisteError)
    } else {
      console.log('✅ Vaktliste table created')
    }

    // Insert sample drivers
    const { error: insertDriversError } = await supabase
      .from('drivers')
      .upsert([
        {
          name: 'Ola Nordmann',
          phone_number: '+47 123 45 678',
          email: 'ola@taxi.no',
          license_number: 'DL123456',
          status: 'active',
          join_date: '2023-01-15',
          total_hours: 1200,
          rating: 4.8
        },
        {
          name: 'Kari Hansen',
          phone_number: '+47 987 65 432',
          email: 'kari@taxi.no',
          license_number: 'DL789012',
          status: 'active',
          join_date: '2023-03-20',
          total_hours: 980,
          rating: 4.9
        },
        {
          name: 'Per Olsen',
          phone_number: '+47 555 44 333',
          email: 'per@taxi.no',
          license_number: 'DL345678',
          status: 'inactive',
          join_date: '2022-11-10',
          total_hours: 750,
          rating: 4.5
        }
      ], { onConflict: 'license_number' })

    if (insertDriversError) {
      console.error('Error inserting drivers:', insertDriversError)
    } else {
      console.log('✅ Sample drivers inserted')
    }

    // Insert sample cars
    const { error: insertCarsError } = await supabase
      .from('cars')
      .upsert([
        {
          plate_number: 'EL12345',
          model: 'Tesla Model 3 2023',
          status: 'free',
          location: 'SNØ P-hus | APCOA PARKING',
          floor: '2. etasje',
          side: 'Venstre',
          battery_level: 85,
          fuel_level: 35,
          mileage: 45230
        },
        {
          plate_number: 'EV67890',
          model: 'NIO ET7 2023',
          status: 'busy',
          location: 'På Vei',
          battery_level: 78,
          fuel_level: 78,
          mileage: 38450,
          driver_name: 'Quick Assignment',
          driver_id: 'QUICK-ABC123',
          pickup_charge_level: 75
        },
        {
          plate_number: 'EL24680',
          model: 'Toyota bZ4X 2023',
          status: 'reserved',
          location: 'SNØ P-hus | APCOA PARKING',
          floor: '1. etasje',
          side: 'Høyre',
          battery_level: 88,
          fuel_level: 88,
          mileage: 22100,
          reserved_by: 'John Doe',
          reserved_from: '2024-01-15T10:00:00Z',
          reserved_to: '2024-01-15T14:00:00Z'
        },
        {
          plate_number: 'EV13579',
          model: 'BMW iX 2022',
          status: 'free',
          location: 'SNØ P-hus | APCOA PARKING',
          floor: '3. etasje',
          side: 'Venstre',
          battery_level: 25,
          fuel_level: 25,
          mileage: 51200
        },
        {
          plate_number: 'EL97531',
          model: 'Hyundai IONIQ 5 2023',
          status: 'maintenance',
          location: 'Service Senter',
          battery_level: 45,
          fuel_level: 45,
          mileage: 67800
        },
        {
          plate_number: 'EV86420',
          model: 'Tesla Model Y 2023',
          status: 'busy',
          location: 'På Vei',
          battery_level: 100,
          fuel_level: 100,
          mileage: 15600,
          driver_name: 'Quick Assignment',
          driver_id: 'QUICK-DEF456',
          pickup_charge_level: 95
        },
        {
          plate_number: 'EL11223',
          model: 'Audi e-tron GT 2023',
          status: 'free',
          location: 'SNØ P-hus | APCOA PARKING',
          floor: '2. etasje',
          side: 'Høyre',
          battery_level: 95,
          fuel_level: 95,
          mileage: 28900
        },
        {
          plate_number: 'EV44556',
          model: 'Mercedes EQS 2022',
          status: 'reserved',
          location: 'SNØ P-hus | APCOA PARKING',
          floor: '1. etasje',
          side: 'Venstre',
          battery_level: 82,
          fuel_level: 82,
          mileage: 34500,
          reserved_by: 'Jane Smith',
          reserved_from: '2024-01-15T16:00:00Z',
          reserved_to: '2024-01-15T20:00:00Z'
        },
        {
          plate_number: 'EL77889',
          model: 'Kia EV6 2023',
          status: 'free',
          location: 'SNØ P-hus | APCOA PARKING',
          floor: '3. etasje',
          side: 'Høyre',
          battery_level: 87,
          fuel_level: 87,
          mileage: 19800
        },
        {
          plate_number: 'EV99001',
          model: 'Polestar 2 2023',
          status: 'maintenance',
          location: 'Service Senter',
          battery_level: 20,
          fuel_level: 20,
          mileage: 42300
        },
        {
          plate_number: 'EL33445',
          model: 'Volkswagen ID.4 2022',
          status: 'busy',
          location: 'På Vei',
          battery_level: 73,
          fuel_level: 73,
          mileage: 37600,
          driver_name: 'Quick Assignment',
          driver_id: 'QUICK-GHI789',
          pickup_charge_level: 70
        },
        {
          plate_number: 'EV55667',
          model: 'NIO ES8 2023',
          status: 'free',
          location: 'SNØ P-hus | APCOA PARKING',
          floor: '2. etasje',
          side: 'Venstre',
          battery_level: 90,
          fuel_level: 90,
          mileage: 26700
        }
      ], { onConflict: 'plate_number' })

    if (insertCarsError) {
      console.error('Error inserting cars:', insertCarsError)
    } else {
      console.log('✅ Sample cars inserted')
    }

    console.log('🎉 Database setup completed successfully!')
  } catch (error) {
    console.error('Error setting up database:', error)
  }
}

setupDatabase() 