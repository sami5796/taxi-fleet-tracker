"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, User, Car, Battery, Fuel, MapPin, AlertCircle, CheckCircle } from "lucide-react"
import type { CarData, ReservationData } from "../types/fleet"
import { driverAuthService, type DriverAuth } from "../../lib/driver-auth-service"

interface ReservationModalProps {
  car: CarData
  onClose: () => void
  onReserve: (reservationData: ReservationData) => void
}

export default function ReservationModal({ car, onClose, onReserve }: ReservationModalProps) {
  const [driverId, setDriverId] = useState("")
  const [driverName, setDriverName] = useState("")
  const [reservationDate, setReservationDate] = useState("")
  const [reservationTime, setReservationTime] = useState("")
  const [duration, setDuration] = useState("4")
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const [isValidatingDriver, setIsValidatingDriver] = useState(false)
  const [validatedDriver, setValidatedDriver] = useState<DriverAuth | null>(null)

  const validateForm = () => {
    const newErrors: string[] = []

    if (!driverId.trim()) newErrors.push("Driver ID is required")
    if (!driverName.trim()) newErrors.push("Driver name is required")
    if (!reservationDate) newErrors.push("Reservation date is required")
    if (!reservationTime) newErrors.push("Reservation time is required")

    // Check if date/time is in the future
    if (reservationDate && reservationTime) {
      const reservationDateTime = new Date(`${reservationDate}T${reservationTime}`)
      const now = new Date()
      if (reservationDateTime <= now) {
        newErrors.push("Reservation must be in the future")
      }
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const validateDriverCredentials = async () => {
    if (!driverId.trim() || !driverName.trim()) {
      setErrors(["Please enter both Driver ID and Driver Name"])
      return false
    }

    setIsValidatingDriver(true)
    setErrors([])

    try {
      const driver = await driverAuthService.validateDriverCredentials(driverId.trim(), driverName.trim())
      
      if (driver) {
        setValidatedDriver(driver)
        setErrors([])
        return true
      } else {
        setValidatedDriver(null)
        setErrors(["Invalid Driver ID or Driver Name. Please check your credentials."])
        return false
      }
    } catch (error) {
      console.error('Error validating driver:', error)
      setErrors(["Error validating driver credentials. Please try again."])
      return false
    } finally {
      setIsValidatingDriver(false)
    }
  }

  const handleReserve = async () => {
    if (!validateForm()) {
      return
    }

    // Validate driver credentials before proceeding
    const isValidDriver = await validateDriverCredentials()
    if (!isValidDriver) {
      return
    }

    const reservationDateTime = new Date(`${reservationDate}T${reservationTime}`)
    const endDateTime = new Date(reservationDateTime.getTime() + Number.parseInt(duration) * 60 * 60 * 1000)

    const reservationData: ReservationData = {
      reservedBy: driverId,
      reservedByName: driverName,
      reservedFrom: reservationDateTime.toISOString(),
      reservedTo: endDateTime.toISOString(),
      notes,
    }

    onReserve(reservationData)
  }

  // Get current date and time for min values
  const now = new Date()
  const currentDate = now.toISOString().split("T")[0]
  const currentTime = now.toTimeString().slice(0, 5)

  // Calculate end time for display
  const getEndTime = () => {
    if (!reservationDate || !reservationTime) return ""
    const start = new Date(`${reservationDate}T${reservationTime}`)
    const end = new Date(start.getTime() + Number.parseInt(duration) * 60 * 60 * 1000)
    return end.toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Car className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Reserve {car.plate_number}</h2>
              <p className="text-sm text-gray-600 font-normal">{car.model}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Information */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium mb-3">Vehicle Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-gray-700">Currently at: {car.location}</span>
              </div>
              <div className="text-gray-600">Mileage: {car.mileage.toLocaleString()} km</div>
            </div>

            {/* Battery and Fuel Status */}
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Battery className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium">Battery Level</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={car.battery_level} className="w-20 h-2" />
                  <span className="text-sm font-medium w-8">{car.battery_level}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Fuel className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-sm font-medium">Fuel Level</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Progress value={car.fuel_level} className="w-20 h-2" />
                  <span className="text-sm font-medium w-8">{car.fuel_level}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Driver Authentication */}
          <div className="space-y-4">
            <h3 className="font-medium">Driver Authentication</h3>
            
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Sample Drivers</span>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                Use Driver ID: <strong>1234</strong> and Driver Name: <strong>Bruker 1</strong> through <strong>Bruker 10</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver-id">
                  <User className="h-4 w-4 inline mr-2" />
                  Driver ID *
                </Label>
                <Input
                  id="driver-id"
                  placeholder="Enter your driver ID (1234)"
                  value={driverId}
                  onChange={(e) => {
                    setDriverId(e.target.value)
                    setErrors([])
                    setValidatedDriver(null)
                  }}
                  className={errors.some((e) => e.includes("Driver ID")) ? "border-red-500" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver-name">Driver Name *</Label>
                <Input
                  id="driver-name"
                  placeholder="Enter your full name (Bruker 1-10)"
                  value={driverName}
                  onChange={(e) => {
                    setDriverName(e.target.value)
                    setErrors([])
                    setValidatedDriver(null)
                  }}
                  className={errors.some((e) => e.includes("Driver name")) ? "border-red-500" : ""}
                />
              </div>
            </div>

            {/* Driver Validation Button */}
            {driverId.trim() && driverName.trim() && !validatedDriver && (
              <Button
                onClick={validateDriverCredentials}
                disabled={isValidatingDriver}
                variant="outline"
                className="w-full"
              >
                {isValidatingDriver ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validate Driver Credentials
                  </>
                )}
              </Button>
            )}

            {/* Validation Success */}
            {validatedDriver && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Driver validated: {validatedDriver.name}
                  </span>
                </div>
              </div>
            )}

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                {errors.map((error, index) => (
                  <div key={index} className="flex items-center text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reservation Details */}
          <div className="space-y-4">
            <h3 className="font-medium">Reservation Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reservation-date">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Reservation Date *
                </Label>
                <Input
                  id="reservation-date"
                  type="date"
                  min={currentDate}
                  value={reservationDate}
                  onChange={(e) => {
                    setReservationDate(e.target.value)
                    setErrors([])
                  }}
                  className={errors.some((e) => e.includes("Reservation date")) ? "border-red-500" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reservation-time">
                  <Clock className="h-4 w-4 inline mr-2" />
                  Start Time *
                </Label>
                <Input
                  id="reservation-time"
                  type="time"
                  min={reservationDate === currentDate ? currentTime : undefined}
                  value={reservationTime}
                  onChange={(e) => {
                    setReservationTime(e.target.value)
                    setErrors([])
                  }}
                  className={errors.some((e) => e.includes("Reservation time")) ? "border-red-500" : ""}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Expected Duration</Label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="1">1 hour</option>
                <option value="2">2 hours</option>
                <option value="4">4 hours (half shift)</option>
                <option value="8">8 hours (full shift)</option>
                <option value="12">12 hours (extended shift)</option>
                <option value="24">24 hours (full day)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any special requirements, pickup instructions, or additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Reservation Summary */}
          {reservationDate && reservationTime && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-3">Reservation Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Vehicle:</span>
                  <span className="font-medium text-blue-900">
                    {car.plate_number} - {car.model}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Driver:</span>
                  <span className="font-medium text-blue-900">{driverName || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Start:</span>
                  <span className="font-medium text-blue-900">
                    {new Date(`${reservationDate}T${reservationTime}`).toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">End:</span>
                  <span className="font-medium text-blue-900">{getEndTime()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Duration:</span>
                  <span className="font-medium text-blue-900">
                    {duration} hour{Number.parseInt(duration) > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleReserve}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={!driverId || !driverName || !reservationDate || !reservationTime || !validatedDriver}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Confirm Reservation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
