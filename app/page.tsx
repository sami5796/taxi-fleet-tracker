"use client"

import { useState, useEffect } from "react"
import { Car, Search, Filter, Grid3X3, List, Plus, Bell, Menu, RefreshCw, Info, HelpCircle, Settings, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import LanguageSelector from "./components/language-selector"
import FleetStats from "./components/fleet-stats"
import FilterPanel from "./components/filter-panel"
import CarCard from "./components/car-card"
import CarListView from "./components/car-list-view"
import CarDetailModal from "./components/car-detail-modal"
import MultipleReservationsModal from "./components/multiple-reservations-modal"
import PhotoCaptureModal from "./components/photo-capture-modal"
import ChargeConfirmationModal from "./components/charge-confirmation-modal"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useLanguage } from "./contexts/language-context"
import { carService } from "@/lib/data-service"
import { photoService } from "@/lib/photo-service"
import { useToast } from "@/hooks/use-toast"
import { driverAuthService, type DriverAuth } from "@/lib/driver-auth-service"
import type { CarData, FilterOptions, ReservationData } from "./types/fleet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function ModernFleetDashboard() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [cars, setCars] = useState<CarData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCar, setSelectedCar] = useState<CarData | null>(null)
  const [showReservation, setShowReservation] = useState(false)
  const [showPhotoCapture, setShowPhotoCapture] = useState(false)
  const [showChargeConfirmation, setShowChargeConfirmation] = useState(false)
  const [chargeConfirmationType, setChargeConfirmationType] = useState<"pickup" | "return">("pickup")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    status: "all",
    location: "all",
    batteryLevel: "all",
    fuelLevel: "all",
  })
  const [currentTime, setCurrentTime] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isUpdatingCar, setIsUpdatingCar] = useState(false)
  const [isPhotoUploading, setIsPhotoUploading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null)
  
  // Driver authentication states
  const [showDriverAuth, setShowDriverAuth] = useState(false)
  const [driverId, setDriverId] = useState("")
  const [driverName, setDriverName] = useState("")
  const [isValidatingDriver, setIsValidatingDriver] = useState(false)
  const [validatedDriver, setValidatedDriver] = useState<DriverAuth | null>(null)
  const [driverErrors, setDriverErrors] = useState<string[]>([])
  const [pendingCarAction, setPendingCarAction] = useState<"take" | "return" | null>(null)

  // Load cars from Supabase
  const loadCars = async () => {
    try {
      setLoading(true)
      
      // Test database connection first
      try {
        await carService.testConnection()
      } catch (err) {
        console.error('Database connection test failed:', err)
        setError('Database connection failed')
        return
      }
      
      const carsData = await carService.getAllCarsWithSchedule()
      console.log('Main: Loaded cars with schedule status from Supabase:', carsData)
      setCars(carsData)
      setError(null)
    } catch (err) {
      console.error('Error loading cars:', err)
      setError('Failed to load fleet data')
    } finally {
      setLoading(false)
    }
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    await loadCars()
    setLastRefreshTime(new Date())
    setIsRefreshing(false)
  }

  useEffect(() => {
    loadCars()

    // Auto-refresh disabled for driver view to prevent unexpected refreshes
    // const refreshInterval = setInterval(loadCars, 30000)

    // Subscribe to real-time updates
    const carSubscription = carService.subscribeToCars((payload) => {
      console.log('Real-time car update received:', payload)
      try {
        if (payload.eventType === 'INSERT') {
          setCars(prev => [payload.new, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setCars(prev => prev.map(car => car.id === payload.new.id ? payload.new : car))
        } else if (payload.eventType === 'DELETE') {
          setCars(prev => prev.filter(car => car.id !== payload.old.id))
        }
      } catch (error) {
        console.error('Error handling real-time update:', error)
        // Fallback to manual refresh if real-time update fails
        loadCars()
      }
    })

    // Subscribe to schedule changes and refresh cars
    const scheduleSubscription = carService.subscribeToSchedules((payload) => {
      console.log('Schedule change detected:', payload)
      // Reload cars to update their status based on new schedule
      loadCars()
    })

    return () => {
      carSubscription.unsubscribe()
      scheduleSubscription.unsubscribe()
      // clearInterval(refreshInterval)
    }
  }, [])

  // Update current time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }))
    }
    
    updateTime()
    const timeInterval = setInterval(updateTime, 1000)
    
    return () => clearInterval(timeInterval)
  }, [])

  const updateCarStatus = async (carId: string, newStatus: CarData["status"], additionalData?: Partial<CarData>) => {
    try {
      await carService.updateCar(carId, { status: newStatus, ...additionalData })
    } catch (error) {
      console.error('Error updating car status:', error)
    }
  }

  const handleTakeWithCharge = (car: CarData) => {
    setSelectedCar(car)
    setPendingCarAction("take")
    setShowDriverAuth(true)
  }

  const handleReturnWithCharge = (car: CarData) => {
    setSelectedCar(car)
    setPendingCarAction("return")
    setShowDriverAuth(true)
  }

  const validateDriverCredentials = async () => {
    if (!driverId.trim() || !driverName.trim()) {
      setDriverErrors(["Vennligst fyll ut både Sjåfør ID og Sjåførnavn"])
      return false
    }

    setIsValidatingDriver(true)
    setDriverErrors([])

    try {
      const driver = await driverAuthService.validateDriverCredentials(driverId.trim(), driverName.trim())
      
      if (driver) {
        // Check if this is a return operation and validate the driver
        if (pendingCarAction === "return" && selectedCar) {
          // Only allow the same driver who picked up the car to return it
          if (selectedCar.driver_name && selectedCar.driver_name !== driver.name) {
            setDriverErrors([`Kun ${selectedCar.driver_name} kan returnere denne bilen. Du er logget inn som ${driver.name}.`])
            return false
          }
        }
        
        setValidatedDriver(driver)
        setDriverErrors([])
        return true
      } else {
        setValidatedDriver(null)
        setDriverErrors(["Ugyldig Sjåfør ID eller Sjåførnavn. Vennligst sjekk dine opplysninger."])
        return false
      }
    } catch (error) {
      console.error('Error validating driver:', error)
      setDriverErrors(["Feil ved validering av sjåføropplysninger. Vennligst prøv igjen."])
      return false
    } finally {
      setIsValidatingDriver(false)
    }
  }

  const handleDriverAuthComplete = async () => {
    if (!validatedDriver) {
      const isValidDriver = await validateDriverCredentials()
      if (!isValidDriver) {
        return
      }
    }

    // Close driver auth modal and proceed with photo capture
    setShowDriverAuth(false)
    setChargeConfirmationType(pendingCarAction === "take" ? "pickup" : "return")
    setShowPhotoCapture(true)
  }

  const resetDriverAuth = () => {
    setDriverId("")
    setDriverName("")
    setValidatedDriver(null)
    setDriverErrors([])
    setPendingCarAction(null)
    setShowDriverAuth(false)
  }

  const handlePhotoCaptureComplete = async (photos: { [key: string]: string }) => {
    if (!selectedCar) return

    try {
      setIsPhotoUploading(true)
      console.log("Photos captured:", photos)
      
      // Use the validated driver's name instead of fallback
      const driverName = validatedDriver?.name || selectedCar.driver_name
      
      if (!driverName) {
        console.error('No driver name available for photo upload')
        toast({
          title: t("error"),
          description: "Driver information is missing. Please try again.",
          variant: "destructive",
        })
        return
      }
      
      // Upload photos to Supabase Storage with driver name
      const uploadResults = await photoService.uploadTripPhotos(
        photos, 
        selectedCar.id, 
        chargeConfirmationType,
        driverName
      )
      
      // Check upload results
      const successfulUploads = uploadResults.filter(result => result.success)
      const failedUploads = uploadResults.filter(result => !result.success)
      
      console.log("Upload results:", { successful: successfulUploads.length, failed: failedUploads.length })
      
      if (successfulUploads.length > 0) {
        toast({
          title: t("photosUploaded"),
          description: `${successfulUploads.length} photos uploaded successfully.`,
          variant: "default",
        })
      }
      
      if (failedUploads.length > 0) {
        console.error("Failed uploads:", failedUploads)
        toast({
          title: t("error"),
          description: `${failedUploads.length} photos failed to upload.`,
          variant: "destructive",
        })
      }
      
      // Proceed to charge confirmation
      setShowPhotoCapture(false)
      setShowChargeConfirmation(true)
      
    } catch (error) {
      console.error('Error processing photos:', error)
      toast({
        title: t("error"),
        description: "Failed to process photos. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsPhotoUploading(false)
    }
  }

  const handleChargeConfirmation = async (chargeLevel: number, parkingLocation?: { floor: string; side: string }) => {
    if (!selectedCar) return

    try {
      setIsUpdatingCar(true)
      console.log('handleChargeConfirmation called with:', { chargeLevel, parkingLocation, chargeConfirmationType })
      
      const updates: Partial<CarData> = {
        status: chargeConfirmationType === "pickup" ? "busy" : "free",
        location: chargeConfirmationType === "pickup" ? "På Vei" : "SNØ P-hus | APCOA PARKING",
        // Update the battery_level to show current charge status
        battery_level: chargeLevel,
      }

      if (chargeConfirmationType === "pickup") {
        updates.pickup_charge_level = chargeLevel
        updates.driver_name = validatedDriver?.name || null
        // Don't store driver_id since we're using mock data without proper UUIDs
      } else {
        updates.return_charge_level = chargeLevel
        updates.driver_name = null
        if (parkingLocation) {
          updates.floor = parkingLocation.floor
          updates.side = parkingLocation.side
        }
      }

      console.log('Final updates object:', JSON.stringify(updates, null, 2))

      console.log('Updating car with:', { carId: selectedCar.id, updates })
      console.log('Selected car:', selectedCar)
      
      // Validate the data before sending
      if (!selectedCar.id) {
        throw new Error('Car ID is missing')
      }
      
      if (typeof chargeLevel !== 'number' || isNaN(chargeLevel)) {
        throw new Error('Invalid charge level')
      }
      
      await carService.updateCar(selectedCar.id, updates)
      
      // Add a small delay to ensure the database update is processed
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Immediately refresh the car data to show the updated status
      await loadCars()
      
      // Show success toast
      toast({
        title: chargeConfirmationType === "pickup" ? t("takeVehicle") : t("returnVehicle"),
        description: `${selectedCar.plate_number} ${chargeConfirmationType === "pickup" ? t("takeVehicle") : t("returnVehicle")}.`,
        variant: "default",
      })
      
      setShowChargeConfirmation(false)
      setSelectedCar(null)
    } catch (err) {
      console.error('Error updating car:', err)
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      })
      setError('Failed to update car')
      toast({
        title: t("error"),
        description: "Failed to update vehicle status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingCar(false)
    }
  }

  const handleMultipleReservations = async (carId: string, reservations: ReservationData[]) => {
    try {
      setIsUpdatingCar(true)
      // Update car status to reserved
      await carService.updateCar(carId, {
        status: "reserved",
        reserved_by: reservations[0]?.driver_name || "Unknown",
        reserved_from: reservations[0]?.reserved_from || new Date().toISOString(),
        reserved_to: reservations[0]?.reserved_to || new Date().toISOString(),
      })
      
      // Add a small delay to ensure the database update is processed
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Immediately refresh the car data to show the updated status
      await loadCars()
      
      // Show success toast
      toast({
        title: t("reserveCar"),
        description: `${t("vehicle")} ${carId} has been reserved.`,
        variant: "default",
      })
    } catch (err) {
      console.error('Error creating reservations:', err)
      setError('Failed to create reservations')
      toast({
        title: t("error"),
        description: "Failed to create reservation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingCar(false)
    }
  }

  const handleViewDetails = (car: CarData) => {
    setSelectedCar(car)
  }

  const filteredCars = cars.filter((car) => {
    const matchesSearch =
      car.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filters.status === "all" || car.status === filters.status
    const matchesLocation = filters.location === "all" || car.location === filters.location
    const matchesBattery =
      filters.batteryLevel === "all" ||
      (filters.batteryLevel === "low" && car.battery_level < 30) ||
      (filters.batteryLevel === "medium" && car.battery_level >= 30 && car.battery_level < 70) ||
      (filters.batteryLevel === "high" && car.battery_level >= 70)
    const matchesFuel =
      filters.fuelLevel === "all" ||
      (filters.fuelLevel === "low" && car.fuel_level < 30) ||
      (filters.fuelLevel === "medium" && car.fuel_level >= 30 && car.fuel_level < 70) ||
      (filters.fuelLevel === "high" && car.fuel_level >= 70)

    return matchesSearch && matchesStatus && matchesLocation && matchesBattery && matchesFuel
  }).sort((a, b) => {
    // Sort available cars to the top
    if (a.status === "free" && b.status !== "free") return -1
    if (a.status !== "free" && b.status === "free") return 1
    return 0
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading fleet data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="bg-red-100 dark:bg-red-900 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
              <Car className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 mobile-container">
      {/* Header - Mobile Optimized */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto mobile-safe-area">
          <div className="flex items-center justify-between py-3 sm:py-4">
            {/* Header Actions - Mobile Optimized */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Status Indicator */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2 mobile-touch-friendly">
                      <div className={`w-2 h-2 rounded-full ${cars.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className="text-xs text-slate-600 dark:text-slate-400 hidden sm:inline">
                        {cars.length} {t("vehicles")}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{cars.length} {t("vehicles")} {t("available")}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Refresh Button with Status - Mobile Optimized */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      variant="outline"
                      size="sm"
                      className="mobile-button-compact bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20"
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">{isRefreshing ? t("refreshing") : t("refresh")}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{lastRefreshTime ? `Last updated: ${lastRefreshTime.toLocaleTimeString()}` : 'Click to refresh data'}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Help Button - Mobile Optimized */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowHelp(!showHelp)}
                      variant="outline"
                      size="sm"
                      className="mobile-button-compact bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Quick help and tips</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <ThemeToggle />
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mobile-safe-area py-4 sm:py-6 lg:py-8">
        {/* Main Content - Mobile Optimized for All Screens */}
        <div className="flex-1 flex flex-col gap-4 sm:gap-6">
          {/* Fleet Stats removed for driver view (admin only) */}

          {/* Search and Filters - Mobile Optimized */}
          <div className="mobile-card bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20">
            <div className="mobile-spacing">
              {/* Help Section - Mobile Optimized */}
              {showHelp && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <h3 className="mobile-subtitle text-blue-900 dark:text-blue-100">Quick Tips</h3>
                      <ul className="mobile-text text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• <strong>Search:</strong> Find vehicles by plate number, model, or driver</li>
                        <li>• <strong>Filters:</strong> Filter by status, location, or battery level</li>
                        <li>• <strong>View Modes:</strong> Switch between grid and list views</li>
                        <li>• <strong>Actions:</strong> Click on vehicles to take, return, or view details</li>
                        <li>• <strong>Real-time:</strong> Data updates automatically every 30 seconds</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Bar - Mobile Optimized */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4 md:h-5 md:w-5" />
                <Input
                  placeholder={t("search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mobile-input pl-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20 shadow-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-800"
                />
                {searchTerm && (
                  <Button
                    onClick={() => setSearchTerm("")}
                    variant="ghost"
                    size="sm"
                    className="mobile-touch-friendly absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                )}
              </div>

              {/* Filter and View Controls - Mobile Optimized */}
              <div className="mobile-flex items-center space-x-2">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="mobile-button bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20 hover:bg-white dark:hover:bg-slate-800 font-medium flex-1 sm:flex-none"
                >
                  <Filter className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  {t("filters")}
                  {Object.values(filters).some(f => f !== "all") && (
                    <Badge variant="secondary" className="ml-2">
                      Active
                    </Badge>
                  )}
                </Button>

                {/* View Mode Toggle - Mobile Optimized */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                        variant="outline"
                        size="sm"
                        className="mobile-button-compact bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20"
                      >
                        {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Switch to {viewMode === "grid" ? "list" : "grid"} view</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Filter Panel - Mobile Optimized */}
          {showFilters && (
            <div className="mobile-card bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20">
              <FilterPanel filters={filters} onFiltersChange={setFilters} cars={cars} />
            </div>
          )}

          {/* Results Info - Mobile Optimized */}
          <div className="mb-4 sm:mb-6 flex items-center justify-between mobile-text">
            <div className="flex items-center gap-4">
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {t("showingResults")} <span className="font-bold text-slate-900 dark:text-white">{filteredCars.length}</span> {t("of")}{" "}
                <span className="font-bold text-slate-900 dark:text-white">{cars.length}</span> {t("vehicles")}
              </p>
            </div>
          </div>

          {/* Vehicle Display - Mobile Optimized Grid for All Screens */}
          {viewMode === "grid" ? (
            <div className="mobile-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
              {filteredCars.map((car) => (
                <CarCard
                  key={car.id}
                  car={car}
                  onManage={(car) => setSelectedCar(car)}
                  onReserve={(car) => {
                    setSelectedCar(car)
                    setShowReservation(true)
                  }}
                  onStatusChange={updateCarStatus}
                  onTakeWithCharge={handleTakeWithCharge}
                  onReturnWithCharge={handleReturnWithCharge}
                  isUpdating={isUpdatingCar && selectedCar?.id === car.id}
                />
              ))}
            </div>
          ) : (
            <CarListView
              cars={filteredCars}
              onManage={(car) => setSelectedCar(car)}
              onReserve={(car) => {
                setSelectedCar(car)
                setShowReservation(true)
              }}
              onStatusChange={updateCarStatus}
              onReturnWithCharge={handleReturnWithCharge}
            />
          )}

          {/* Empty State - Mobile Optimized */}
          {filteredCars.length === 0 && (
            <div className="text-center py-12 sm:py-16">
              <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-full w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <Car className="h-8 w-8 sm:h-10 sm:w-10 text-slate-500 dark:text-slate-400" />
              </div>
              <h3 className="mobile-title text-slate-900 dark:text-white mb-2 sm:mb-3">{t("noVehiclesFound")}</h3>
              <p className="mobile-text text-slate-600 dark:text-slate-400 mb-4 sm:mb-6 max-w-md mx-auto">
                {searchTerm || Object.values(filters).some((f) => f !== "all")
                  ? t("tryAdjusting")
                  : t("noVehiclesAvailable")}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm("")}
                  className="mobile-button bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20 hover:bg-white dark:hover:bg-slate-800 font-medium"
                >
                  {t("clearSearch")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedCar && !showReservation && !showChargeConfirmation && !showPhotoCapture && (
        <CarDetailModal car={selectedCar} onClose={() => setSelectedCar(null)} onUpdateStatus={updateCarStatus} />
      )}

      {selectedCar && showReservation && (
        <MultipleReservationsModal
          car={selectedCar}
          onClose={() => {
            setSelectedCar(null)
            setShowReservation(false)
          }}
          onReserve={(reservations) => {
            handleMultipleReservations(selectedCar.id, reservations)
            setSelectedCar(null)
            setShowReservation(false)
          }}
        />
      )}

      {selectedCar && showPhotoCapture && (
        <PhotoCaptureModal
          car={selectedCar}
          isOpen={showPhotoCapture}
          type={chargeConfirmationType}
          onClose={() => {
            setSelectedCar(null)
            setShowPhotoCapture(false)
          }}
          onComplete={handlePhotoCaptureComplete}
        />
      )}

      {selectedCar && showChargeConfirmation && (
        <ChargeConfirmationModal
          car={selectedCar}
          isOpen={showChargeConfirmation}
          type={chargeConfirmationType}
          onClose={() => {
            setSelectedCar(null)
            setShowChargeConfirmation(false)
          }}
          onConfirm={handleChargeConfirmation}
        />
      )}

      {showDriverAuth && (
        <Dialog open={showDriverAuth} onOpenChange={setShowDriverAuth}>
          <DialogContent className="mobile-modal-content max-w-md">
            <DialogHeader>
              <DialogTitle className="mobile-heading">Sjåførautentisering</DialogTitle>
            </DialogHeader>
            <div className="mobile-spacing">
              <div className="bg-blue-50 border border-blue-200 p-3 sm:p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="mobile-text font-medium text-blue-800">Eksempel Sjåfører</span>
                </div>
                <p className="mobile-text text-blue-700">
                  Bruk Sjåfør ID: <strong>1234</strong> og Sjåførnavn: <strong>Bruker 1</strong> til <strong>Bruker 10</strong>
                </p>
              </div>

              <div className="mobile-spacing">
                <div>
                  <Label htmlFor="driverId" className="mobile-text">Sjåfør ID *</Label>
                  <Input
                    id="driverId"
                    placeholder="Skriv inn sjåfør ID (1234)"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    disabled={isValidatingDriver}
                    className="mobile-input mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="driverName" className="mobile-text">Sjåførnavn *</Label>
                  <Input
                    id="driverName"
                    placeholder="Skriv inn sjåførnavn (Bruker 1-10)"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    disabled={isValidatingDriver}
                    className="mobile-input mt-1"
                  />
                </div>
                
                {driverErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                      <span className="mobile-text font-medium text-red-800">Feil:</span>
                    </div>
                    <ul className="mobile-text text-red-700 list-disc list-inside space-y-1">
                      {driverErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={resetDriverAuth}
                  className="mobile-button flex-1"
                >
                  Avbryt
                </Button>
                <Button
                  onClick={handleDriverAuthComplete}
                  disabled={isValidatingDriver || !driverId.trim() || !driverName.trim()}
                  className="mobile-button flex-1"
                >
                  {isValidatingDriver ? "Validerer..." : "Autentiser Sjåfør"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
