import { createClient } from '@supabase/supabase-js'

// Use hardcoded values to avoid environment variable issues
const supabaseUrl = 'https://qepilgryhhkqoaxnggtb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlcGlsZ3J5aGhrcW9heG5nZ3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MjYxODksImV4cCI6MjA1NjUwMjE4OX0.dzwJWSKcOlkhFw2wlDn0Nb74LqhoFhVw78j0MSeb48g'

console.log('Creating Supabase client with URL:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface CarData {
  id: string
  plate_number: string
  model: string
  status: 'free' | 'busy' | 'reserved' | 'maintenance'
  location: string
  floor?: string
  side?: string
  battery_level: number
  fuel_level: number
  mileage: number
  driver_id?: string | null
  driver_name?: string | null
  reserved_by?: string
  reserved_from?: string
  reserved_to?: string
  before_photo?: string
  after_photo?: string
  notes?: string
  maintenance_reason?: string
  pickup_charge_level?: number
  return_charge_level?: number
  last_updated?: string
  created_at: string
}

export interface Driver {
  id: string
  name: string
  phone_number: string
  email: string
  license_number: string
  status: 'active' | 'inactive' | 'on_leave'
  join_date: string
  total_hours: number
  rating: number
  created_at: string
}

export interface VaktlisteEntry {
  id: string
  driver_id: string
  driver_name: string
  date: string
  start_time: string
  end_time: string
  total_hours?: number
  vehicle_assigned: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  shift_number?: number
  created_at: string
}

export interface Reservation {
  id: string
  car_id: string
  driver_id: string
  driver_name: string
  reserved_from: string
  reserved_to: string
  status: 'active' | 'completed' | 'cancelled'
  notes?: string
  created_at: string
} 