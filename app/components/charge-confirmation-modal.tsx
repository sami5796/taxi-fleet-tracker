"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap, AlertTriangle, Car, TrendingUp, TrendingDown, MapPin } from "lucide-react"
import { useLanguage } from "../contexts/language-context"
import type { CarData } from "../types/fleet"

interface ChargeConfirmationModalProps {
  car: CarData
  isOpen: boolean
  onClose: () => void
  onConfirm: (chargeLevel: number, parkingLocation?: { floor: string; side: string }) => void
  type: "pickup" | "return"
  pickupChargeLevel?: number
}

export default function ChargeConfirmationModal({
  car,
  isOpen,
  onClose,
  onConfirm,
  type,
  pickupChargeLevel,
}: ChargeConfirmationModalProps) {
  const { t } = useLanguage()
  const [chargeLevel, setChargeLevel] = useState(type === "pickup" ? (car.battery_level ?? 0) : (pickupChargeLevel ?? 0))
  const [parkingFloor, setParkingFloor] = useState(car.floor || "")
  const [parkingSide, setParkingSide] = useState(car.side || "")
  const [error, setError] = useState("")
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    if (chargeLevel < 0 || chargeLevel > 100) {
      setError("Ladenivå må være mellom 0% og 100%")
      return
    }

    if (type === "return" && pickupChargeLevel && chargeLevel > pickupChargeLevel + 10) {
      setError("Returladenivå kan ikke være mer enn 10% høyere enn ved henting")
      return
    }

    if (type === "return" && (!parkingFloor || !parkingSide)) {
      setError("Vennligst velg etasje og side for parkering")
      return
    }

    setIsConfirming(true)
    try {
      const parkingLocation = type === "return" ? { floor: parkingFloor, side: parkingSide } : undefined
      await onConfirm(chargeLevel, parkingLocation)
    } catch (error) {
      console.error('Error confirming charge:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  const isLowCharge = chargeLevel < 40
  const chargeChange = pickupChargeLevel ? chargeLevel - pickupChargeLevel : 0

  const getChargeColor = (level: number) => {
    if (level < 30) return "text-rose-600"
    if (level < 70) return "text-amber-600"
    return "text-emerald-600"
  }

  const getChargeProgressColor = (level: number) => {
    if (level < 30) return "bg-rose-500"
    if (level < 70) return "bg-amber-500"
    return "bg-emerald-500"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg md:max-w-xl glass-effect border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg">
              <Car className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-slate-900 font-semibold">{car.model}</div>
              <div className="text-slate-600 text-sm">
                {type === "pickup" ? "Bekreft Henting" : "Bekreft Retur"} - {car.plate_number}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {type === "pickup" && isLowCharge && (
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white p-4 rounded-xl shadow-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold text-sm">Lav Lading Varsel</span>
              </div>
              <p className="text-xs opacity-90">
                Dette kjøretøyet har lav lading ({chargeLevel}%). Vennligst bekreft ladenivået før du tar det.
              </p>
            </div>
          )}

          {type === "return" && pickupChargeLevel && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 p-4 rounded-xl">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Henteinformasjon</h4>
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <div className="flex items-center justify-between">
                  <span>Hentet med:</span>
                  <span className="font-bold">{pickupChargeLevel}% lading</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label htmlFor="charge-level" className="text-sm font-semibold text-slate-700">
              <Zap className="h-4 w-4 inline mr-2" />
              {type === "pickup" ? "Bekreft ladenivå ved henting" : "Ladenivå ved retur"}
            </Label>
            <div className="flex items-center space-x-3">
              <Input
                id="charge-level"
                type="number"
                min="0"
                max="100"
                value={chargeLevel}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : Number(e.target.value)
                  if (!isNaN(value)) {
                    setChargeLevel(value)
                    setError("")
                  }
                }}
                className={`flex-1 h-12 text-lg font-semibold text-center bg-white/80 dark:bg-slate-800 border-white/30 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 text-slate-900 dark:text-white ${
                  error ? "border-rose-500 ring-2 ring-rose-200 dark:ring-rose-800" : ""
                }`}
              />
              <span className="text-sm font-medium text-slate-600 min-w-[20px]">%</span>
            </div>
            {error && (
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-medium bg-rose-50 dark:bg-rose-900/10 p-2 rounded-lg">
                <AlertTriangle className="h-3 w-3" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Ladenivå</span>
              <span className={`font-bold text-lg ${getChargeColor(chargeLevel)}`}>{chargeLevel}%</span>
            </div>
            <div className="relative">
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getChargeProgressColor(chargeLevel)}`}
                  style={{ width: `${chargeLevel}%` }}
                />
              </div>
            </div>
          </div>

          {/* Parking Location Fields - Only for Return */}
          {type === "return" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700 p-4 rounded-xl">
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Parkering Lokasjon
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parking-floor" className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      Etasje
                    </Label>
                    <Select value={parkingFloor} onValueChange={setParkingFloor}>
                      <SelectTrigger className="bg-white/80 dark:bg-slate-800 border-emerald-200 dark:border-emerald-600">
                        <SelectValue placeholder="Velg etasje" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1. etasje">1. etasje</SelectItem>
                        <SelectItem value="2. etasje">2. etasje</SelectItem>
                        <SelectItem value="3. etasje">3. etasje</SelectItem>
                        <SelectItem value="4. etasje">4. etasje</SelectItem>
                        <SelectItem value="5. etasje">5. etasje</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parking-side" className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                      Side
                    </Label>
                    <Select value={parkingSide} onValueChange={setParkingSide}>
                      <SelectTrigger className="bg-white/80 dark:bg-slate-800 border-emerald-200 dark:border-emerald-600">
                        <SelectValue placeholder="Velg side" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Venstre">Venstre</SelectItem>
                        <SelectItem value="Høyre">Høyre</SelectItem>
                        <SelectItem value="Midten">Midten</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {type === "return" && pickupChargeLevel && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3">Ladingsendring</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Ved henting:</span>
                  <span className="font-semibold text-slate-900">{pickupChargeLevel}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Ved retur:</span>
                  <span className="font-semibold text-slate-900">{chargeLevel}%</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="font-medium text-slate-700">Endring:</span>
                  <div className="flex items-center gap-1">
                    {chargeChange > 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    ) : chargeChange < 0 ? (
                      <TrendingDown className="h-4 w-4 text-rose-600" />
                    ) : null}
                    <span
                      className={`font-bold ${
                        chargeChange > 0 ? "text-emerald-600" : chargeChange < 0 ? "text-rose-600" : "text-slate-600"
                      }`}
                    >
                      {chargeChange > 0 ? "+" : ""}
                      {chargeChange}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-white/20">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/60 border-white/30 hover:bg-white font-medium"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 font-medium"
              disabled={isConfirming}
            >
              {isConfirming ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  {type === "pickup" ? "Bekreft Henting" : "Bekreft Retur"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
