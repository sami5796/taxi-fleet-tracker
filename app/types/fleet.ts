export interface CarData {
  id: string
  plate_number: string
  model: string
  status: "free" | "busy" | "reserved" | "maintenance"
  location: string
  floor?: string
  side?: string
  last_updated?: string
  battery_level: number
  fuel_level: number
  mileage: number
  driver_name?: string | null
  driver_id?: string | null
  reserved_by?: string
  reserved_from?: string
  reserved_to?: string
  before_photo?: string
  after_photo?: string
  notes?: string
  maintenance_reason?: string
  pickup_charge_level?: number
  return_charge_level?: number
  created_at: string
}

export interface FilterOptions {
  status: "all" | "free" | "busy" | "reserved" | "maintenance"
  location: "all" | string
  batteryLevel: "all" | "low" | "medium" | "high"
  fuelLevel: "all" | "low" | "medium" | "high"
}

export interface ReservationData {
  driver_name: string
  reserved_from: string
  reserved_to: string
  notes?: string
}
