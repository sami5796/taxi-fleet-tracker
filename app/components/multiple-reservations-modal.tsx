"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, User, Car, Battery, Fuel, MapPin, AlertCircle, Plus, Trash2, CheckCircle } from "lucide-react"
import { useLanguage } from "../contexts/language-context"
import type { CarData, ReservationData } from "../types/fleet"
import { driverAuthService, type DriverAuth } from "../../lib/driver-auth-service"

interface Reservation {
  id: string
  phoneNumber: string
  driverName: string
  reservationDate: string
  reservationTime: string
  deliveryDate?: string
  deliveryTime?: string
  duration: string
  notes: string
  validatedDriver?: DriverAuth | null
}

interface MultipleReservationsModalProps {
  car: CarData
  onClose: () => void
  onReserve: (reservations: ReservationData[]) => void
}

export default function MultipleReservationsModal({ car, onClose, onReserve }: MultipleReservationsModalProps) {
  const { t } = useLanguage()
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: "1",
      phoneNumber: "",
      driverName: "",
      reservationDate: "",
      reservationTime: "",
      deliveryDate: "",
      deliveryTime: "",
      duration: "4",
      notes: "",
    },
  ])
  const [errors, setErrors] = useState<string[]>([])
  const [validatingDrivers, setValidatingDrivers] = useState<Set<string>>(new Set())

  const addReservation = () => {
    const newReservation: Reservation = {
      id: Date.now().toString(),
      phoneNumber: "",
      driverName: "",
      reservationDate: "",
      reservationTime: "",
      deliveryDate: "",
      deliveryTime: "",
      duration: "4",
      notes: "",
    }
    setReservations([...reservations, newReservation])
  }

  const removeReservation = (id: string) => {
    if (reservations.length > 1) {
      setReservations(reservations.filter((r) => r.id !== id))
    }
  }

  const updateReservation = (id: string, field: keyof Reservation, value: string) => {
    setReservations(reservations.map((r) => {
      if (r.id === id) {
        const updated = { ...r, [field]: value }
        // Clear validation when driver credentials change
        if (field === 'phoneNumber' || field === 'driverName') {
          updated.validatedDriver = null
        }
        return updated
      }
      return r
    }))
    setErrors([])
  }

  const validateDriverCredentials = async (reservationId: string) => {
    const reservation = reservations.find(r => r.id === reservationId)
    if (!reservation) return false

    if (!reservation.phoneNumber.trim() || !reservation.driverName.trim()) {
      setErrors(["Please enter both Driver ID and Driver Name for all reservations"])
      return false
    }

    setValidatingDrivers(prev => new Set([...prev, reservationId]))
    setErrors([])

    try {
      const driver = await driverAuthService.validateDriverCredentials(
        reservation.phoneNumber.trim(), 
        reservation.driverName.trim()
      )
      
      if (driver) {
        setReservations(reservations.map(r => 
          r.id === reservationId 
            ? { ...r, validatedDriver: driver }
            : r
        ))
        setErrors([])
        return true
      } else {
        setReservations(reservations.map(r => 
          r.id === reservationId 
            ? { ...r, validatedDriver: null }
            : r
        ))
        setErrors([`Invalid Driver ID or Driver Name for reservation ${reservations.findIndex(r => r.id === reservationId) + 1}. Please check your credentials.`])
        return false
      }
    } catch (error) {
      console.error('Error validating driver:', error)
      setErrors(["Error validating driver credentials. Please try again."])
      return false
    } finally {
      setValidatingDrivers(prev => {
        const newSet = new Set(prev)
        newSet.delete(reservationId)
        return newSet
      })
    }
  }

  const validateForm = () => {
    const newErrors: string[] = []

    reservations.forEach((reservation, index) => {
      if (!reservation.phoneNumber.trim()) {
        newErrors.push(`${t("phoneNumberRequired")} (${t("reserveCar")} ${index + 1})`)
      }
      if (!reservation.driverName.trim()) {
        newErrors.push(`${t("driverNameRequired")} (${t("reserveCar")} ${index + 1})`)
      }
      if (!reservation.reservationDate) {
        newErrors.push(`Reservation date required (${t("reserveCar")} ${index + 1})`)
      }
      if (!reservation.reservationTime) {
        newErrors.push(`Reservation time required (${t("reserveCar")} ${index + 1})`)
      }

      // Check if date/time is in the future
      if (reservation.reservationDate && reservation.reservationTime) {
        const reservationDateTime = new Date(`${reservation.reservationDate}T${reservation.reservationTime}`)
        const now = new Date()
        if (reservationDateTime <= now) {
          newErrors.push(`Reservation must be in the future (${t("reserveCar")} ${index + 1})`)
        }
      }

      // Check if delivery time is after reservation time
      if (reservation.deliveryDate && reservation.deliveryTime && reservation.reservationDate && reservation.reservationTime) {
        const reservationDateTime = new Date(`${reservation.reservationDate}T${reservation.reservationTime}`)
        const deliveryDateTime = new Date(`${reservation.deliveryDate}T${reservation.deliveryTime}`)
        if (deliveryDateTime <= reservationDateTime) {
          newErrors.push(`Delivery time must be after reservation time (${t("reserveCar")} ${index + 1})`)
        }
      }
    })

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleReserve = async () => {
    if (!validateForm()) {
      return
    }

    // Validate all driver credentials before proceeding
    const validationPromises = reservations.map(reservation => 
      validateDriverCredentials(reservation.id)
    )
    
    const validationResults = await Promise.all(validationPromises)
    const allValid = validationResults.every(result => result)

    if (!allValid) {
      return
    }

    const reservationDataList: ReservationData[] = reservations.map((reservation) => {
      const reservationDateTime = new Date(`${reservation.reservationDate}T${reservation.reservationTime}`)
      let endDateTime: Date

      if (reservation.deliveryDate && reservation.deliveryTime) {
        endDateTime = new Date(`${reservation.deliveryDate}T${reservation.deliveryTime}`)
      } else {
        endDateTime = new Date(reservationDateTime.getTime() + Number.parseInt(reservation.duration) * 60 * 60 * 1000)
      }

      return {
        driver_id: reservation.phoneNumber,
        driver_name: reservation.driverName,
        reserved_from: reservationDateTime.toISOString(),
        reserved_to: endDateTime.toISOString(),
        notes: reservation.notes,
      }
    })

    onReserve(reservationDataList)
  }

  // Get current date and time for min values
  const now = new Date()
  const currentDate = now.toISOString().split("T")[0]
  const currentTime = now.toTimeString().slice(0, 5)

  // No auto-validation to avoid UI lock; validation happens in handleReserve

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Driver Authentication Info */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Sample Drivers</span>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              Use Driver ID: <strong>1234</strong> and Driver Name: <strong>Bruker 1</strong> through <strong>Bruker 10</strong>
            </p>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-sm font-medium text-red-800">Please fix the following errors:</span>
              </div>
              <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Reservations */}
          <div className="space-y-6">
            {reservations.map((reservation, index) => (
              <div key={reservation.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    {t("reserveCar")} {index + 1}
                  </h3>
                  {reservations.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeReservation(reservation.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`driver-id-${reservation.id}`}>
                      <User className="h-4 w-4 inline mr-2" />
                      Driver ID *
                    </Label>
                    <Input
                      id={`driver-id-${reservation.id}`}
                      placeholder="Enter driver ID (1234)"
                      value={reservation.phoneNumber}
                      onChange={(e) => updateReservation(reservation.id, "phoneNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`driver-name-${reservation.id}`}>{t("driverName")} *</Label>
                    <Input
                      id={`driver-name-${reservation.id}`}
                      placeholder="Enter driver name (Bruker 1-10)"
                      value={reservation.driverName}
                      onChange={(e) => updateReservation(reservation.id, "driverName", e.target.value)}
                    />
                  </div>
                </div>
                {/* Sign In button */}
                {!reservation.validatedDriver && (
                  <Button
                    onClick={() => validateDriverCredentials(reservation.id)}
                    disabled={validatingDrivers.has(reservation.id)}
                    variant="outline"
                    className="w-full mt-2"
                  >
                    {validatingDrivers.has(reservation.id) ? 'Signing In...' : 'Sign In'}
                  </Button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`reservation-date-${reservation.id}`}>
                      <Calendar className="h-4 w-4 inline mr-2" />
                      Reservation Date *
                    </Label>
                    <Input
                      id={`reservation-date-${reservation.id}`}
                      type="date"
                      min={currentDate}
                      value={reservation.reservationDate}
                      onChange={(e) => updateReservation(reservation.id, "reservationDate", e.target.value)}
                      disabled={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`reservation-time-${reservation.id}`}>
                      <Clock className="h-4 w-4 inline mr-2" />
                      Reservation Time *
                    </Label>
                    <Input
                      id={`reservation-time-${reservation.id}`}
                      type="time"
                      min={reservation.reservationDate === currentDate ? currentTime : undefined}
                      value={reservation.reservationTime}
                      onChange={(e) => updateReservation(reservation.id, "reservationTime", e.target.value)}
                      disabled={false}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`duration-${reservation.id}`}>
                      <Battery className="h-4 w-4 inline mr-2" />
                      Duration *
                    </Label>
                    <select
                      id={`duration-${reservation.id}`}
                      value={reservation.duration}
                      onChange={(e) => updateReservation(reservation.id, "duration", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md bg-white"
                      disabled={!reservation.validatedDriver}
                    >
                      <option value="1">1 hour</option>
                      <option value="2">2 hours</option>
                      <option value="3">3 hours</option>
                      <option value="4">4 hours</option>
                      <option value="5">5 hours</option>
                      <option value="6">6 hours</option>
                      <option value="7">7 hours</option>
                      <option value="8">8 hours</option>
                      <option value="9">9 hours</option>
                      <option value="10">10 hours</option>
                      <option value="11">11 hours</option>
                      <option value="12">12 hours</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`delivery-date-${reservation.id}`}>
                      <MapPin className="h-4 w-4 inline mr-2" />
                      Delivery Date
                    </Label>
                    <Input
                      id={`delivery-date-${reservation.id}`}
                      type="date"
                      min={reservation.reservationDate || currentDate}
                      value={reservation.deliveryDate}
                      onChange={(e) => updateReservation(reservation.id, "deliveryDate", e.target.value)}
                      disabled={!reservation.validatedDriver}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`delivery-time-${reservation.id}`}>
                      <Fuel className="h-4 w-4 inline mr-2" />
                      Delivery Time
                    </Label>
                    <Input
                      id={`delivery-time-${reservation.id}`}
                      type="time"
                      value={reservation.deliveryTime}
                      onChange={(e) => updateReservation(reservation.id, "deliveryTime", e.target.value)}
                      disabled={!reservation.deliveryDate || !reservation.validatedDriver}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`notes-${reservation.id}`}>
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    Notes
                  </Label>
                  <Textarea
                    id={`notes-${reservation.id}`}
                    placeholder="Add any notes for this reservation"
                    value={reservation.notes}
                    onChange={(e) => updateReservation(reservation.id, "notes", e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button
              onClick={handleReserve}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={false}
            >
              <Calendar className="h-4 w-4 mr-2" />
              {t("confirmReservation")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}