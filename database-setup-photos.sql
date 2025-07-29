-- Photo Storage System Setup for Taxi Fleet Tracker
-- Run these commands in your Supabase SQL Editor

-- 1. Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  car_id UUID REFERENCES cars(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('pickup', 'return')),
  photo_type TEXT NOT NULL CHECK (photo_type IN ('front', 'back', 'right', 'left')),
  photo_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_photos_car_id ON photos(car_id);
CREATE INDEX IF NOT EXISTS idx_photos_trip_type ON photos(trip_type);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies (adjust based on your auth setup)
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow all operations on photos" ON photos;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON photos;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON photos;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON photos;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON photos;

-- Create new policies for all operations
CREATE POLICY "Enable insert for all users" ON photos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for all users" ON photos
  FOR SELECT USING (true);

CREATE POLICY "Enable update for all users" ON photos
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for all users" ON photos
  FOR DELETE USING (true);

-- TEMPORARY: Disable RLS for testing (uncomment the line below if RLS is causing issues)
-- ALTER TABLE photos DISABLE ROW LEVEL SECURITY;

-- 5. Create a view for easy photo queries
CREATE OR REPLACE VIEW photo_summary AS
SELECT 
  p.id,
  p.car_id,
  c.plate_number,
  p.driver_name,
  p.trip_type,
  p.photo_type,
  p.photo_url,
  p.file_name,
  p.uploaded_at,
  p.created_at,
  TO_CHAR(p.uploaded_at, 'Day, DD Mon YYYY') as formatted_date,
  TO_CHAR(p.uploaded_at, 'HH24:MI') as formatted_time
FROM photos p
JOIN cars c ON p.car_id = c.id
ORDER BY p.uploaded_at DESC;

-- 6. Create function to get photos by car with grouping
CREATE OR REPLACE FUNCTION get_photos_by_car(car_uuid UUID)
RETURNS TABLE (
  trip_date TEXT,
  driver_name TEXT,
  trip_type TEXT,
  photos JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    TO_CHAR(p.uploaded_at, 'Day, DD Mon YYYY') as trip_date,
    p.driver_name,
    p.trip_type,
    json_agg(
      json_build_object(
        'id', p.id,
        'photo_type', p.photo_type,
        'photo_url', p.photo_url,
        'file_name', p.file_name,
        'uploaded_at', p.uploaded_at
      )
    ) as photos
  FROM photos p
  WHERE p.car_id = car_uuid
  GROUP BY 
    TO_CHAR(p.uploaded_at, 'Day, DD Mon YYYY'),
    p.driver_name,
    p.trip_type
  ORDER BY MAX(p.uploaded_at) DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to get recent photos
CREATE OR REPLACE FUNCTION get_recent_photos(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  car_id UUID,
  plate_number TEXT,
  driver_name TEXT,
  trip_type TEXT,
  photo_type TEXT,
  photo_url TEXT,
  file_name TEXT,
  formatted_date TEXT,
  formatted_time TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.car_id,
    c.plate_number,
    p.driver_name,
    p.trip_type,
    p.photo_type,
    p.photo_url,
    p.file_name,
    TO_CHAR(p.uploaded_at, 'Day, DD Mon YYYY') as formatted_date,
    TO_CHAR(p.uploaded_at, 'HH24:MI') as formatted_time
  FROM photos p
  JOIN cars c ON p.car_id = c.id
  ORDER BY p.uploaded_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Create storage bucket (run this in Supabase Dashboard > Storage)
-- Go to Storage in Supabase Dashboard and create a bucket named 'trip-photos'
-- Set it to public for demo purposes

-- 9. Fix Storage RLS Policies (run this in Supabase SQL Editor)
-- Drop existing storage policies that might be blocking uploads
DROP POLICY IF EXISTS "Allow public access to storage.objects" ON storage.objects;
DROP POLICY IF EXISTS "Allow public access to storage.buckets" ON storage.buckets;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload files" ON storage.buckets;

-- Create new policies for storage.objects
CREATE POLICY "Allow public access to storage.objects" ON storage.objects
  FOR ALL USING (true);

-- Create new policies for storage.buckets  
CREATE POLICY "Allow public access to storage.buckets" ON storage.buckets
  FOR ALL USING (true);

-- Alternative: If you want more restrictive policies, use these instead:
-- CREATE POLICY "Allow authenticated users to upload files" ON storage.objects
--   FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- 
-- CREATE POLICY "Allow public to read files" ON storage.objects
--   FOR SELECT USING (true);

-- 10. Insert sample data (optional - for testing)
-- INSERT INTO photos (car_id, driver_name, trip_type, photo_type, photo_url, file_name)
-- VALUES 
--   ('your-car-id-here', 'John Doe', 'pickup', 'front', 'https://example.com/photo1.jpg', 'front_20241201_143022.jpg'),
--   ('your-car-id-here', 'John Doe', 'pickup', 'back', 'https://example.com/photo2.jpg', 'back_20241201_143022.jpg'),
--   ('your-car-id-here', 'John Doe', 'pickup', 'right', 'https://example.com/photo3.jpg', 'right_20241201_143022.jpg'),
--   ('your-car-id-here', 'John Doe', 'pickup', 'left', 'https://example.com/photo4.jpg', 'left_20241201_143022.jpg'); 