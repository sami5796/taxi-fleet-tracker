const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with hardcoded credentials
const supabaseUrl = 'https://qepilgryhhkqoaxnggtb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlcGlsZ3J5aGhrcW9heG5nZ3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MjYxODksImV4cCI6MjA1NjUwMjE4OX0.dzwJWSKcOlkhFw2wlDn0Nb74LqhoFhVw78j0MSeb48g'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSampleDrivers() {
  try {
    console.log('Creating sample drivers...')
    
    const sampleDrivers = []
    
    for (let i = 1; i <= 10; i++) {
      sampleDrivers.push({
        name: `Bruker ${i}`,
        phone_number: `+47 123 45 ${i.toString().padStart(3, '0')}`,
        email: `bruker${i}@taxi.no`,
        license_number: `DL${i.toString().padStart(6, '0')}`,
        status: 'active',
        join_date: new Date().toISOString().split('T')[0],
        total_hours: Math.floor(Math.random() * 1000) + 100,
        rating: (Math.random() * 2 + 3).toFixed(2) // Random rating between 3.0 and 5.0
      })
    }
    
    const { data, error } = await supabase
      .from('drivers')
      .insert(sampleDrivers)
      .select()
    
    if (error) {
      console.error('Error creating sample drivers:', error)
      throw error
    }
    
    console.log(`Successfully created ${data.length} sample drivers:`)
    data.forEach(driver => {
      console.log(`- ${driver.name} (ID: ${driver.id})`)
    })
    
  } catch (error) {
    console.error('Failed to create sample drivers:', error)
    process.exit(1)
  }
}

createSampleDrivers()