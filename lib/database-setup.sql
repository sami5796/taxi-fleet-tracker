-- Enable Row Level Security
ALTER TABLE IF EXISTS cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vaktliste ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reservations ENABLE ROW LEVEL SECURITY;

-- Cars table
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

-- Drivers table
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

-- Vaktliste table (schedule/roster)
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

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  reserved_from TIMESTAMP NOT NULL,
  reserved_to TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Photos table for trip photos
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  trip_id TEXT,
  photo_type TEXT CHECK (photo_type IN ('before', 'after')),
  photo_url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance records table
CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10,2),
  performed_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cars_status ON cars(status);
CREATE INDEX IF NOT EXISTS idx_cars_plate_number ON cars(plate_number);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_vaktliste_date ON vaktliste(date);
CREATE INDEX IF NOT EXISTS idx_vaktliste_driver_id ON vaktliste(driver_id);
CREATE INDEX IF NOT EXISTS idx_reservations_car_id ON reservations(car_id);
CREATE INDEX IF NOT EXISTS idx_reservations_driver_id ON reservations(driver_id);

-- Row Level Security Policies
-- Allow all operations for now (can be restricted later)
CREATE POLICY "Allow all operations on cars" ON cars FOR ALL USING (true);
CREATE POLICY "Allow all operations on drivers" ON drivers FOR ALL USING (true);
CREATE POLICY "Allow all operations on vaktliste" ON vaktliste FOR ALL USING (true);
CREATE POLICY "Allow all operations on reservations" ON reservations FOR ALL USING (true);
CREATE POLICY "Allow all operations on photos" ON photos FOR ALL USING (true);
CREATE POLICY "Allow all operations on maintenance" ON maintenance FOR ALL USING (true);

-- Insert sample data
INSERT INTO drivers (name, phone_number, email, license_number, status, join_date, total_hours, rating) VALUES
('Ola Nordmann', '+47 123 45 678', 'ola@taxi.no', 'DL123456', 'active', '2023-01-15', 1200, 4.8),
('Kari Hansen', '+47 987 65 432', 'kari@taxi.no', 'DL789012', 'active', '2023-03-20', 980, 4.9),
('Per Olsen', '+47 555 44 333', 'per@taxi.no', 'DL345678', 'inactive', '2022-11-10', 750, 4.5)
ON CONFLICT (license_number) DO NOTHING;

INSERT INTO cars (plate_number, model, status, location, floor, side, battery_level, fuel_level, mileage) VALUES
('EL12345', 'Tesla Model 3 2023', 'free', 'SNØ P-hus | APCOA PARKING', '2. etasje', 'Venstre', 85, 35, 45230),
('EV67890', 'NIO ET7 2023', 'busy', 'På Vei', NULL, NULL, 78, 78, 38450),
('EL24680', 'Toyota bZ4X 2023', 'reserved', 'SNØ P-hus | APCOA PARKING', '1. etasje', 'Høyre', 88, 88, 22100),
('EV13579', 'BMW iX 2022', 'free', 'SNØ P-hus | APCOA PARKING', '3. etasje', 'Venstre', 25, 25, 51200),
('EL97531', 'Hyundai IONIQ 5 2023', 'maintenance', 'Service Senter', NULL, NULL, 45, 45, 67800),
('EV86420', 'Tesla Model Y 2023', 'busy', 'På Vei', NULL, NULL, 100, 100, 15600),
('EL11223', 'Audi e-tron GT 2023', 'free', 'SNØ P-hus | APCOA PARKING', '2. etasje', 'Høyre', 95, 95, 28900),
('EV44556', 'Mercedes EQS 2022', 'reserved', 'SNØ P-hus | APCOA PARKING', '1. etasje', 'Venstre', 82, 82, 34500),
('EL77889', 'Kia EV6 2023', 'free', 'SNØ P-hus | APCOA PARKING', '3. etasje', 'Høyre', 87, 87, 19800),
('EV99001', 'Polestar 2 2023', 'maintenance', 'Service Senter', NULL, NULL, 20, 20, 42300),
('EL33445', 'Volkswagen ID.4 2022', 'busy', 'På Vei', NULL, NULL, 73, 73, 37600),
('EV55667', 'NIO ES8 2023', 'free', 'SNØ P-hus | APCOA PARKING', '2. etasje', 'Venstre', 90, 90, 26700)
ON CONFLICT (plate_number) DO NOTHING; 