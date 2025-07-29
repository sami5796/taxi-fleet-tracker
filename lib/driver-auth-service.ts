import { supabase } from './supabase'

export interface DriverAuth {
  id: string
  name: string
  driver_id: string // This will be "1234" for all sample drivers
  phone_number?: string
  email?: string
  license_number?: string
  status: 'active' | 'inactive' | 'on_leave'
}

export const driverAuthService = {
  // Validate driver ID (for sample drivers, all use "1234")
  async validateDriverId(driverId: string): Promise<DriverAuth | null> {
    try {
      // For the sample drivers, all have driver ID "1234"
      if (driverId === "1234") {
        // Return a mock driver auth object since all sample drivers use the same ID
        return {
          id: "sample-driver",
          name: "Sample Driver",
          driver_id: "1234",
          status: "active"
        }
      }
      
      // In a real implementation, you would query the database
      // const { data, error } = await supabase
      //   .from('drivers')
      //   .select('*')
      //   .eq('driver_id', driverId)
      //   .single()
      
      // if (error || !data) return null
      // return data
      
      return null
    } catch (error) {
      console.error('Error validating driver ID:', error)
      return null
    }
  },

  // Get driver by name (for sample drivers)
  async getDriverByName(driverName: string): Promise<DriverAuth | null> {
    try {
      // Check if it's one of our sample drivers - only allow Bruker 1-10
      const sampleDriverMatch = driverName.match(/^Bruker (1[0]|[1-9])$/)
      if (sampleDriverMatch) {
        const driverNumber = sampleDriverMatch[1]
        return {
          id: `sample-driver-${driverNumber}`,
          name: driverName,
          driver_id: "1234",
          phone_number: `+47 123 45 ${driverNumber.padStart(3, '0')}`,
          email: `bruker${driverNumber}@taxi.no`,
          license_number: `DL${driverNumber.padStart(6, '0')}`,
          status: "active"
        }
      }
      
      // In a real implementation, you would query the database
      // const { data, error } = await supabase
      //   .from('drivers')
      //   .select('*')
      //   .eq('name', driverName)
      //   .single()
      
      // if (error || !data) return null
      // return data
      
      return null
    } catch (error) {
      console.error('Error getting driver by name:', error)
      return null
    }
  },

  // Validate driver credentials (ID + Name combination)
  async validateDriverCredentials(driverId: string, driverName: string): Promise<DriverAuth | null> {
    try {
      // For sample drivers, validate the combination
      if (driverId === "1234") {
        // Only allow Bruker 1-10 with exact case matching
        const sampleDriverMatch = driverName.match(/^Bruker (1[0]|[1-9])$/)
        if (sampleDriverMatch) {
          const driverNumber = sampleDriverMatch[1]
          return {
            id: `sample-driver-${driverNumber}`,
            name: driverName,
            driver_id: "1234",
            phone_number: `+47 123 45 ${driverNumber.padStart(3, '0')}`,
            email: `bruker${driverNumber}@taxi.no`,
            license_number: `DL${driverNumber.padStart(6, '0')}`,
            status: "active"
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('Error validating driver credentials:', error)
      return null
    }
  },

  // Get all sample drivers
  async getSampleDrivers(): Promise<DriverAuth[]> {
    const sampleDrivers: DriverAuth[] = []
    
    for (let i = 1; i <= 10; i++) {
      sampleDrivers.push({
        id: `sample-driver-${i}`,
        name: `Bruker ${i}`,
        driver_id: "1234",
        phone_number: `+47 123 45 ${i.toString().padStart(3, '0')}`,
        email: `bruker${i}@taxi.no`,
        license_number: `DL${i.toString().padStart(6, '0')}`,
        status: "active"
      })
    }
    
    return sampleDrivers
  }
}