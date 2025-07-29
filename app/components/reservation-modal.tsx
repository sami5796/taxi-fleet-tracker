"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Calendar, Clock, User, Car, Battery, Fuel, MapPin } from "lucide-react"
import type { CarData, ReservationData } from "../types/fleet"

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

  const handleReserve = () => {
    if (!driverId || !driverName || !reservationDate || !reservationTime) {
      alert("Please fill in all required fields")
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-lg">
              <Car className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reserve {car.plate_number}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-normal">{car.model}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Information */}
          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="font-medium mb-3 text-slate-900 dark:text-white">Vehicle Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-slate-500 dark:text-slate-400" />
                <span className="text-slate-700 dark:text-slate-300">Currently at: {car.location}</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400">Mileage: {car.mileage.toLocaleString()} km</div>
            </div>

            {/* Battery and Fuel Status */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Battery className="h-4 w-4 mr-1 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300">Battery</span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">{car.batteryLevel}%</span>
                </div>
                <Progress value={car.batteryLevel} className="h-2" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <Fuel className="h-4 w-4 mr-1 text-slate-500 dark:text-slate-400" />
                    <span className="text-slate-700 dark:text-slate-300">Fuel</span>
                  </div>
                  <span className="font-medium text-slate-900 dark:text-white">{car.fuelLevel}%</span>
                </div>
                <Progress value={car.fuelLevel} className="h-2" />
              </div>
            </div>
          </div>

          {/* Reservation Form */}
          <div className="space-y-4">
            <h3 className="font-medium">Reservation Details</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver-id">
                  <User className="h-4 w-4 inline mr-2" />
                  Driver ID *
                </Label>
                <Input
                  id="driver-id"
                  placeholder="Enter your driver ID"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver-name">Driver Name *</Label>
                <Input
                  id="driver-name"
                  placeholder="Enter your full name"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  required
                />
              </div>
            </div>

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
                  onChange={(e) => setReservationDate(e.target.value)}
                  required
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
                  onChange={(e) => setReservationTime(e.target.value)}
                  required
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
              <h4 className="font-medium text-blue-800 mb-2">Reservation Summary</h4>
              <div className="space-y-1 text-sm text-blue-700">
                <div className="flex justify-between">
                  <span>Vehicle:</span>
                  <span className="font-medium">
                    {car.plate_number} - {car.model}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Driver:</span>
                  <span className="font-medium">{driverName || "Not specified"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Start:</span>
                  <span className="font-medium">
                    {new Date(`${reservationDate}T${reservationTime}`).toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>End:</span>
                  <span className="font-medium">
                    {new Date(
                      new Date(`${reservationDate}T${reservationTime}`).getTime() +
                        Number.parseInt(duration) * 60 * 60 * 1000,
                    ).toLocaleString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duration:</span>
                  <span className="font-medium">
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
              disabled={!driverId || !driverName || !reservationDate || !reservationTime}
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
