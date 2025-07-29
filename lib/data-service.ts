import { supabase, type CarData, type Driver, type VaktlisteEntry, type Reservation } from './supabase'

// Car operations
export const carService = {
  // Get all cars with real-time subscription
  async getAllCars() {
    try {
      console.log('data-service: getAllCars called')
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('data-service: Error getting cars:', error)
        throw error
      }
      
      console.log('data-service: Successfully loaded cars:', data?.length || 0)
      return data
    } catch (error) {
      console.error('data-service: Error in getAllCars:', error)
      throw error
    }
  },

  // Get car by ID
  async getCarById(id: string) {
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Add new car
  async addCar(carData: Omit<CarData, 'id' | 'created_at'>) {
    try {
      console.log('data-service: addCar called with:', carData)
      
      // Remove last_updated from the data since the database handles it automatically
      const { last_updated, ...insertData } = carData
      
      const { data, error } = await supabase
        .from('cars')
        .insert([insertData])
        .select()
        .single()
      
      if (error) {
        console.error('data-service: Supabase error:', error)
        throw error
      }
      
      console.log('data-service: Car added successfully:', data)
      return data
    } catch (error) {
      console.error('data-service: Error in addCar:', error)
      throw error
    }
  },

  // Update car
  async updateCar(id: string, updates: Partial<CarData>) {
    try {
      console.log('data-service: updateCar called with:', { id, updates })
      
      if (!id) {
        throw new Error('Car ID is required')
      }
      
      // First check if the car exists
      const { data: existingCar, error: checkError } = await supabase
        .from('cars')
        .select('id, plate_number, status')
        .eq('id', id)
        .single()
      
      if (checkError) {
        console.error('data-service: Car not found:', checkError)
        throw new Error('Car not found')
      }
      
      console.log('data-service: Found existing car:', existingCar)
      
      // Convert undefined values to null and filter out undefined keys
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates)
          .filter(([key, value]) => value !== undefined)
          .map(([key, value]) => [key, value === null ? null : value])
      )
      
      // Validate data types before sending to Supabase
      for (const [key, value] of Object.entries(cleanUpdates)) {
        if (key === 'battery_level' || key === 'fuel_level' || key === 'mileage' || key === 'pickup_charge_level' || key === 'return_charge_level') {
          if (typeof value !== 'number' || isNaN(value)) {
            throw new Error(`Invalid ${key}: must be a number`)
          }
        }
        if (key === 'status' && !['free', 'busy', 'reserved', 'maintenance'].includes(value as string)) {
          throw new Error(`Invalid status: ${value}`)
        }
        // Ensure string fields are actually strings
        if (['driver_name', 'driver_id', 'reserved_by', 'location', 'floor', 'side', 'notes', 'maintenance_reason'].includes(key)) {
          if (value !== null && typeof value !== 'string') {
            throw new Error(`Invalid ${key}: must be a string or null`)
          }
        }
      }
      
      console.log('data-service: Clean updates:', cleanUpdates)
      console.log('data-service: Car ID type:', typeof id, 'Value:', id)
      console.log('data-service: Updates data types:', Object.entries(cleanUpdates).map(([key, value]) => `${key}: ${typeof value} = ${value}`))
      console.log('data-service: Full update object:', cleanUpdates)
      
      const { data, error } = await supabase
        .from('cars')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single()
      
      console.log('data-service: Supabase response:', { data, error })
      
      if (error) {
        console.error('data-service: Supabase error:', error)
        console.error('data-service: Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }
      
      console.log('data-service: Car updated successfully:', data)
      return data
    } catch (error) {
      console.error('data-service: Error in updateCar:', error)
      throw error
    }
  },

  // Delete car
  async deleteCar(id: string) {
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Update car status
  async updateCarStatus(id: string, status: CarData['status'], additionalData?: Partial<CarData>) {
    return this.updateCar(id, { status, ...additionalData })
  },

  // Subscribe to car changes
  subscribeToCars(callback: (payload: any) => void) {
    try {
      console.log('data-service: Subscribing to cars changes...')
      return supabase
        .channel('cars_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cars' }, callback)
        .subscribe((status) => {
          console.log('data-service: Cars subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('data-service: Successfully subscribed to cars changes')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('data-service: Cars subscription error')
          }
        })
    } catch (error) {
      console.error('data-service: Error setting up cars subscription:', error)
      // Return a dummy subscription object to prevent errors
      return {
        unsubscribe: () => {
          console.log('data-service: Dummy cars subscription unsubscribed')
        }
      }
    }
  },

  // Subscribe to schedule changes
  subscribeToSchedules(callback: (payload: any) => void) {
    try {
      console.log('data-service: Subscribing to schedules changes...')
      return supabase
        .channel('schedules_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vaktliste' }, callback)
        .subscribe((status) => {
          console.log('data-service: Schedules subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('data-service: Successfully subscribed to schedules changes')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('data-service: Schedules subscription error')
          }
        })
    } catch (error) {
      console.error('data-service: Error setting up schedules subscription:', error)
      // Return a dummy subscription object to prevent errors
      return {
        unsubscribe: () => {
          console.log('data-service: Dummy schedules subscription unsubscribed')
        }
      }
    }
  },

  // Test database connection
  async testConnection() {
    try {
      console.log('data-service: Testing database connection...')
      const { data, error } = await supabase
        .from('cars')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('data-service: Database connection test failed:', error)
        throw error
      }
      
      console.log('data-service: Database connection test successful')
      return true
    } catch (error) {
      console.error('data-service: Database connection test error:', error)
      throw error
    }
  },

  // Get cars with updated status based on current schedule
  async getAllCarsWithSchedule() {
    try {
      console.log('data-service: Getting cars with schedule status...')
      
      // Get current date and time
      const now = new Date()
      const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
      const currentTime = now.toTimeString().split(' ')[0] // HH:MM:SS
      
      console.log('data-service: Current date/time:', { currentDate, currentTime })
      console.log('data-service: Current time string:', currentTime)
      
      // Get all cars
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .order('plate_number')
      
      if (carsError) {
        console.error('data-service: Error fetching cars:', carsError)
        throw carsError
      }
      
      // Get all schedules for today (current and future)
      const { data: schedules, error: schedulesError } = await supabase
        .from('vaktliste')
        .select('*')
        .eq('date', currentDate)
        .eq('status', 'scheduled')
      
      if (schedulesError) {
        console.error('data-service: Error fetching schedules:', schedulesError)
        throw schedulesError
      }
      
      console.log('data-service: Found active schedules:', schedules)
      
      // Update car status based on current schedule
      const updatedCars = cars?.map(car => {
        const activeSchedule = schedules?.find(schedule => {
          if (schedule.vehicle_assigned !== car.plate_number) return false
          
          // Check if current time is within the schedule time range
          const scheduleStart = schedule.start_time
          const scheduleEnd = schedule.end_time
          const currentTimeStr = currentTime
          
          console.log(`data-service: Checking schedule for ${car.plate_number}: ${scheduleStart} - ${scheduleEnd}, current: ${currentTimeStr}`)
          
          // Compare time strings (HH:MM:SS format)
          // Show as reserved if current time is within the schedule OR if the schedule hasn't started yet
          const isCurrentlyActive = currentTimeStr >= scheduleStart && currentTimeStr <= scheduleEnd
          const isUpcomingToday = currentTimeStr < scheduleStart
          
          return isCurrentlyActive || isUpcomingToday
        })
        
        if (activeSchedule) {
          console.log(`data-service: Car ${car.plate_number} is currently scheduled for ${activeSchedule.driver_name}`)
          return {
            ...car,
            status: 'reserved' as const,
            driver_id: activeSchedule.driver_id,
            driver_name: activeSchedule.driver_name,
            reserved_by: activeSchedule.driver_name,
            reserved_from: `${currentDate}T${activeSchedule.start_time}`,
            reserved_to: `${currentDate}T${activeSchedule.end_time}`
          }
        }
        
        return car
      })
      
      console.log('data-service: Updated cars with schedule status:', updatedCars)
      return updatedCars || []
    } catch (error) {
      console.error('data-service: Error in getAllCarsWithSchedule:', error)
      throw error
    }
  }
}

// Driver operations
export const driverService = {
  // Get all drivers
  async getAllDrivers() {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get driver by ID
  async getDriverById(id: string) {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Add new driver
  async addDriver(driver: Omit<Driver, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('drivers')
      .insert([driver])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update driver
  async updateDriver(id: string, updates: Partial<Driver>) {
    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete driver
  async deleteDriver(id: string) {
    const { error } = await supabase
      .from('drivers')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Subscribe to driver changes
  subscribeToDrivers(callback: (payload: any) => void) {
    try {
      console.log('data-service: Subscribing to drivers changes...')
      return supabase
        .channel('drivers_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, callback)
        .subscribe((status) => {
          console.log('data-service: Drivers subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('data-service: Successfully subscribed to drivers changes')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('data-service: Drivers subscription error')
          }
        })
    } catch (error) {
      console.error('data-service: Error setting up drivers subscription:', error)
      // Return a dummy subscription object to prevent errors
      return {
        unsubscribe: () => {
          console.log('data-service: Dummy drivers subscription unsubscribed')
        }
      }
    }
  }
}

// Vaktliste operations
export const vaktlisteService = {
  // Get all vaktliste entries
  async getAllVaktliste() {
    const { data, error } = await supabase
      .from('vaktliste')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get vaktliste entries for a specific week
  async getVaktlisteForWeek(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('vaktliste')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get vaktliste entries for a specific driver
  async getVaktlisteForDriver(driverId: string) {
    const { data, error } = await supabase
      .from('vaktliste')
      .select('*')
      .eq('driver_id', driverId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Add new vaktliste entry
  async addVaktlisteEntry(entry: Omit<VaktlisteEntry, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('vaktliste')
      .insert([entry])
      .select()
      .single()
    
    if (error) throw error
    
    // If a vehicle is assigned, update the car status to reserved
    if (entry.vehicle_assigned) {
      try {
        // Find the car by plate number and update its status
        const { data: carData, error: carError } = await supabase
          .from('cars')
          .select('id')
          .eq('plate_number', entry.vehicle_assigned)
          .single()
        
        if (!carError && carData) {
          await carService.updateCar(carData.id, {
            status: 'reserved',
            driver_id: entry.driver_id,
            driver_name: entry.driver_name,
            reserved_by: entry.driver_name,
            reserved_from: `${entry.date}T${entry.start_time}`,
            reserved_to: `${entry.date}T${entry.end_time}`,
            last_updated: new Date().toISOString()
          })
          console.log(`data-service: Updated car ${entry.vehicle_assigned} status to reserved for schedule`)
        }
      } catch (updateError) {
        console.error(`data-service: Failed to update car status for schedule:`, updateError)
      }
    }
    
    return data
  },

  // Update vaktliste entry
  async updateVaktlisteEntry(id: string, updates: Partial<VaktlisteEntry>) {
    const { data, error } = await supabase
      .from('vaktliste')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    
    // If vehicle assignment changed, update car status accordingly
    if (updates.vehicle_assigned !== undefined) {
      try {
        // Find the car by plate number and update its status
        const { data: carData, error: carError } = await supabase
          .from('cars')
          .select('id')
          .eq('plate_number', updates.vehicle_assigned)
          .single()
        
        if (!carError && carData) {
          await carService.updateCar(carData.id, {
            status: 'reserved',
            driver_id: data.driver_id,
            driver_name: data.driver_name,
            reserved_by: data.driver_name,
            reserved_from: `${data.date}T${data.start_time}`,
            reserved_to: `${data.date}T${data.end_time}`,
            last_updated: new Date().toISOString()
          })
          console.log(`data-service: Updated car ${updates.vehicle_assigned} status to reserved for updated schedule`)
        }
      } catch (updateError) {
        console.error(`data-service: Failed to update car status for updated schedule:`, updateError)
      }
    }
    
    return data
  },

  // Delete vaktliste entry
  async deleteVaktlisteEntry(id: string) {
    const { error } = await supabase
      .from('vaktliste')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Bulk add vaktliste entries
  async bulkAddVaktlisteEntries(entries: Omit<VaktlisteEntry, 'id' | 'created_at'>[]) {
    const { data, error } = await supabase
      .from('vaktliste')
      .insert(entries)
      .select()
    
    if (error) throw error
    return data
  },

  // Subscribe to vaktliste changes
  subscribeToVaktliste(callback: (payload: any) => void) {
    try {
      console.log('data-service: Subscribing to vaktliste changes...')
      return supabase
        .channel('vaktliste_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vaktliste' }, callback)
        .subscribe((status) => {
          console.log('data-service: Vaktliste subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('data-service: Successfully subscribed to vaktliste changes')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('data-service: Vaktliste subscription error')
          }
        })
    } catch (error) {
      console.error('data-service: Error setting up vaktliste subscription:', error)
      // Return a dummy subscription object to prevent errors
      return {
        unsubscribe: () => {
          console.log('data-service: Dummy vaktliste subscription unsubscribed')
        }
      }
    }
  }
}

// Reservation operations
export const reservationService = {
  // Get all reservations
  async getAllReservations() {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('reserved_from', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get active reservations
  async getActiveReservations() {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('status', 'active')
      .order('reserved_from', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Add new reservation
  async addReservation(reservation: Omit<Reservation, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservation])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update reservation
  async updateReservation(id: string, updates: Partial<Reservation>) {
    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete reservation
  async deleteReservation(id: string) {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Photo operations
export const photoService = {
  // Upload photo
  async uploadPhoto(file: File, carId: string, tripId: string, photoType: 'before' | 'after') {
    const fileName = `${carId}/${tripId}/${photoType}_${Date.now()}.jpg`
    
    const { data, error } = await supabase.storage
      .from('trip-photos')
      .upload(fileName, file)
    
    if (error) throw error
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('trip-photos')
      .getPublicUrl(fileName)
    
    // Save photo record to database
    const { data: photoRecord, error: dbError } = await supabase
      .from('photos')
      .insert([{
        car_id: carId,
        trip_id: tripId,
        photo_type: photoType,
        photo_url: urlData.publicUrl
      }])
      .select()
      .single()
    
    if (dbError) throw dbError
    return photoRecord
  },

  // Get photos for a car
  async getPhotosForCar(carId: string) {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('car_id', carId)
      .order('uploaded_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// Statistics and analytics
export const statsService = {
  // Get fleet statistics
  async getFleetStats() {
    const { data: cars, error: carsError } = await supabase
      .from('cars')
      .select('status, battery_level, fuel_level')
    
    if (carsError) throw carsError
    
    const totalCars = cars.length
    const activeCars = cars.filter(car => car.status === 'free' || car.status === 'busy').length
    const maintenanceCars = cars.filter(car => car.status === 'maintenance').length
    const lowBatteryCars = cars.filter(car => car.battery_level < 30).length
    const lowFuelCars = cars.filter(car => car.fuel_level < 30).length
    const utilization = totalCars > 0 ? Math.round((activeCars / totalCars) * 100) : 0
    
    return {
      totalCars,
      activeCars,
      maintenanceCars,
      lowBatteryCars,
      lowFuelCars,
      utilization
    }
  },

  // Get driver statistics
  async getDriverStats() {
    const { data: drivers, error } = await supabase
      .from('drivers')
      .select('status, total_hours, rating')
    
    if (error) throw error
    
    const totalDrivers = drivers.length
    const activeDrivers = drivers.filter(driver => driver.status === 'active').length
    const totalHours = drivers.reduce((sum, driver) => sum + driver.total_hours, 0)
    const averageRating = drivers.length > 0 
      ? drivers.reduce((sum, driver) => sum + driver.rating, 0) / drivers.length 
      : 0
    
    return {
      totalDrivers,
      activeDrivers,
      totalHours,
      averageRating: Math.round(averageRating * 100) / 100
    }
  }
} 