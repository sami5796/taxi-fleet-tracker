import { supabase } from './supabase'

export interface PhotoData {
  id: string
  car_id: string
  driver_name: string
  trip_type: 'pickup' | 'return'
  photo_type: 'front' | 'back' | 'right' | 'left'
  photo_url: string
  file_name: string
  uploaded_at: string
  created_at: string
}

export interface PhotoUploadResult {
  success: boolean
  photo?: PhotoData
  error?: string
}

// Enhanced Photo Service
export const photoService = {
  // Upload multiple photos for a trip with driver name
  async uploadTripPhotos(
    photos: { [key: string]: string }, 
    carId: string, 
    tripType: 'pickup' | 'return',
    driverName: string
  ): Promise<PhotoUploadResult[]> {
    const results: PhotoUploadResult[] = []
    const timestamp = new Date()
    const dateStr = timestamp.toISOString().slice(0, 19).replace(/:/g, '-')
    
    for (const [position, base64Data] of Object.entries(photos)) {
      try {
        console.log(`Processing ${position} photo...`)
        
        // Convert base64 data URL to blob
        let blob: Blob
        try {
          // Handle data URL format (data:image/jpeg;base64,...)
          if (base64Data.startsWith('data:')) {
            const response = await fetch(base64Data)
            blob = await response.blob()
          } else {
            // Handle raw base64 string
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            const byteArray = new Uint8Array(byteNumbers)
            blob = new Blob([byteArray], { type: 'image/jpeg' })
          }
        } catch (conversionError) {
          console.error(`Error converting ${position} photo data:`, conversionError)
          results.push({
            success: false,
            error: `Failed to convert ${position} photo data: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`
          })
          continue
        }
        
        // Create user-friendly file name
        const fileName = `${position}_${dateStr}.jpg`
        const storagePath = `${carId}/${tripType}/${fileName}`
        
        console.log('Uploading to path:', storagePath)
        console.log('Blob size:', blob.size, 'bytes')
        console.log('Blob type:', blob.type)
        
        // Create file from blob
        const file = new File([blob], fileName, { type: 'image/jpeg' })
        
        console.log('File size:', file.size, 'bytes')
        console.log('File type:', file.type)
        console.log('File name:', file.name)
        
        // Check if blob is valid
        if (blob.size === 0) {
          console.error('Blob is empty!')
          results.push({
            success: false,
            error: `Failed to upload ${position} photo: Blob is empty`
          })
          continue
        }
        
        console.log('About to upload to Supabase storage...')
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('trip-photos')
          .upload(storagePath, file, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true // Allow overwriting existing file to avoid duplicate errors
          })
        
        if (error) {
          console.error(`Error uploading ${position} photo:`, error)
          console.error('Error details:', {
            message: error.message,
            error: error
          })
          console.error('Full error object:', JSON.stringify(error, null, 2))
          console.error('Error type:', typeof error)
          console.error('Error keys:', Object.keys(error))
          
          results.push({
            success: false,
            error: `Failed to upload ${position} photo: ${error.message || 'Unknown error'}`
          })
          continue
        }
        
        console.log(`Successfully uploaded ${position} photo:`, data)
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('trip-photos')
          .getPublicUrl(storagePath)
        
        console.log('Public URL:', urlData.publicUrl)
        
        // Save to database
        const { data: photoRecord, error: dbError } = await supabase
          .from('photos')
          .insert([{
            car_id: carId,
            driver_name: driverName,
            trip_type: tripType,
            photo_type: position as 'front' | 'back' | 'right' | 'left',
            photo_url: urlData.publicUrl,
            file_name: fileName,
            uploaded_at: timestamp.toISOString()
          }])
          .select()
          .single()
        
        if (dbError) {
          console.error(`Error saving ${position} photo record:`, dbError)
          results.push({
            success: false,
            error: `Failed to save ${position} photo record: ${dbError.message}`
          })
          continue
        }
        
        console.log(`Successfully saved ${position} photo record:`, photoRecord)
        
        results.push({
          success: true,
          photo: photoRecord
        })
        
      } catch (error) {
        console.error(`Error processing ${position} photo:`, error)
        results.push({
          success: false,
          error: `Error processing ${position} photo: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }
    
    return results
  },

  // Upload a single file (for manual uploads)
  async uploadSinglePhoto(
    file: File,
    carId: string,
    tripType: 'pickup' | 'return',
    driverName: string,
    photoType: 'front' | 'back' | 'right' | 'left'
  ): Promise<PhotoUploadResult> {
    try {
      const timestamp = new Date()
      const dateStr = timestamp.toISOString().slice(0, 19).replace(/:/g, '-')
      const fileName = `${photoType}_${dateStr}.jpg`
      const storagePath = `${carId}/${tripType}/${fileName}`
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('trip-photos')
        .upload(storagePath, file)
      
      if (error) {
        console.error('Error uploading photo:', error)
        return {
          success: false,
          error: `Failed to upload photo: ${error.message}`
        }
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('trip-photos')
        .getPublicUrl(storagePath)
      
      // Save to database
      const { data: photoRecord, error: dbError } = await supabase
        .from('photos')
        .insert([{
          car_id: carId,
          driver_name: driverName,
          trip_type: tripType,
          photo_type: photoType,
          photo_url: urlData.publicUrl,
          file_name: fileName,
          uploaded_at: timestamp.toISOString()
        }])
        .select()
        .single()
      
      if (dbError) {
        console.error('Error saving photo record:', dbError)
        return {
          success: false,
          error: `Failed to save photo record: ${dbError.message}`
        }
      }
      
      return {
        success: true,
        photo: photoRecord
      }
      
    } catch (error) {
      console.error('Error uploading single photo:', error)
      return {
        success: false,
        error: `Error uploading photo: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  },

  // Get photos for a car
  async getPhotosForCar(carId: string): Promise<PhotoData[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('car_id', carId)
      .order('uploaded_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get photos by trip type
  async getPhotosByTrip(carId: string, tripType: 'pickup' | 'return'): Promise<PhotoData[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('car_id', carId)
      .eq('trip_type', tripType)
      .order('uploaded_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get recent photos (for admin dashboard)
  async getRecentPhotos(limit: number = 50): Promise<PhotoData[]> {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  // Get photos grouped by trip (for admin view)
  async getPhotosGroupedByTrip(carId: string) {
    const { data, error } = await supabase
      .rpc('get_photos_by_car', { car_uuid: carId })
    
    if (error) throw error
    return data || []
  },

  // Delete a photo
  async deletePhoto(photoId: string): Promise<boolean> {
    try {
      // Get photo record first
      const { data: photo, error: fetchError } = await supabase
        .from('photos')
        .select('file_name, car_id, trip_type')
        .eq('id', photoId)
        .maybeSingle()
 
      if (fetchError) {
        console.error('Error fetching photo for deletion:', fetchError)
        return false
      }

      if (!photo) {
        // Record already gone, attempt DB cleanup anyway
        await supabase.from('photos').delete().eq('id', photoId)
        return true
      }
      
      // Delete from storage
      const storagePath = `${photo.car_id}/${photo.trip_type}/${photo.file_name}`
      const { error: storageError } = await supabase.storage
        .from('trip-photos')
        .remove([storagePath])
      
      if (storageError) {
        console.error('Error deleting from storage:', storageError)
        // Continue to delete from database even if storage deletion fails
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId)
      
      if (dbError) {
        console.error('Error deleting from database:', dbError)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error deleting photo:', error)
      return false
    }
  },

  // Get photo statistics
  async getPhotoStats() {
    const { data, error } = await supabase
      .from('photos')
      .select('uploaded_at, trip_type')
    
    if (error) throw error
    
    const totalPhotos = data.length
    const pickupPhotos = data.filter(p => p.trip_type === 'pickup').length
    const returnPhotos = data.filter(p => p.trip_type === 'return').length
    
    // Get photos from last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const recentPhotos = data.filter(p => new Date(p.uploaded_at) > weekAgo).length
    
    return {
      totalPhotos,
      pickupPhotos,
      returnPhotos,
      recentPhotos
    }
  }
}