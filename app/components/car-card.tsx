"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Zap, AlertTriangle, Car, TrendingUp, TrendingDown, MapPin, Clock, User, Calendar, Users, CalendarDays } from "lucide-react"
import { useLanguage } from "../contexts/language-context"
import type { CarData } from "../types/fleet"

interface CarCardProps {
  car: CarData
  onManage: (car: CarData) => void
  onReserve: (car: CarData) => void
  onStatusChange: (carId: string, status: CarData["status"], additionalData?: Partial<CarData>) => void
  onTakeWithCharge: (car: CarData) => void
  onReturnWithCharge: (car: CarData) => void
  isUpdating?: boolean
}

export default function CarCard({ car, onManage, onReserve, onStatusChange, onTakeWithCharge, onReturnWithCharge, isUpdating = false }: CarCardProps) {
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)

  const statusConfig: Record<CarData["status"], {
    label: string
    color: string
    textColor: string
    bgColor: string
  }> = {
    free: {
      label: t("available"),
      color: "bg-green-500",
      textColor: "text-green-700 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    busy: {
      label: t("inUse"),
      color: "bg-blue-500",
      textColor: "text-blue-700 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    reserved: {
      label: t("reserved"),
      color: "bg-orange-500",
      textColor: "text-orange-700 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    maintenance: {
      label: t("maintenance"),
      color: "bg-red-500",
      textColor: "text-red-700 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
  }

  const handleAction = async (action: () => void) => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call
      action()
    } finally {
      setIsLoading(false)
    }
  }

  const isVeryLowCharge = car.fuel_level < 20
  const isLowCharge = car.fuel_level < 30
  const isMediumCharge = car.fuel_level >= 30 && car.fuel_level < 70
  const isHighCharge = car.fuel_level >= 70

  const getChargeColor = () => {
    if (isVeryLowCharge) return "text-red-600"
    if (isLowCharge) return "text-orange-600"
    if (isMediumCharge) return "text-yellow-600"
    return "text-green-600"
  }

  const getChargeBgColor = () => {
    if (isVeryLowCharge) return "bg-red-100 dark:bg-red-900/20"
    if (isLowCharge) return "bg-orange-100 dark:bg-orange-900/20"
    if (isMediumCharge) return "bg-yellow-100 dark:bg-yellow-900/20"
    return "bg-green-100 dark:bg-green-900/20"
  }

  const getChargeProgressColor = () => {
    if (isVeryLowCharge) return "bg-red-500"
    if (isLowCharge) return "bg-orange-500"
    if (isMediumCharge) return "bg-yellow-500"
    return "bg-green-500"
  }

  const formatLastUpdated = (timestamp: string) => {
    const now = new Date()
    const updated = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return t("justNow")
    if (diffInMinutes < 60) return `${diffInMinutes} ${t("minutesAgo")}`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ${t("hoursAgo")}`
    return `${Math.floor(diffInMinutes / 1440)} ${t("daysAgo")}`
  }

  // Check if car is scheduled by admin
  const isCarScheduled = car.status === 'reserved' && car.reserved_from && car.reserved_to && car.driver_name

  const getScheduledTimeText = () => {
    if (!isCarScheduled || !car.reserved_from || !car.reserved_to) return null
    
    const from = new Date(car.reserved_from)
    const to = new Date(car.reserved_to)
    
    return `${from.toLocaleDateString()} ${from.toLocaleTimeString()} - ${to.toLocaleTimeString()}`
  }

  return (
    <Card className="mobile-card bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] hover:-translate-y-1">
      <CardContent className="p-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-2">
          <Badge
            variant="secondary"
            className={`${statusConfig[car.status].bgColor} ${statusConfig[car.status].textColor} border-0 font-medium text-xs sm:text-sm`}
          >
            <div className={`w-2 h-2 rounded-full ${statusConfig[car.status].color} mr-2`} />
            {statusConfig[car.status].label}
          </Badge>

          {/* Scheduled Badge */}
          {isCarScheduled && (
            <div className="flex items-center space-x-1">
              <CalendarDays className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                Admin Scheduled
              </span>
            </div>
          )}
        </div>

        {/* Plate Number and Model */}
        <div className="mb-3">
          <h3 className="mobile-heading font-bold text-slate-900 dark:text-white mb-1">
            {car.plate_number}
          </h3>
          <p className="mobile-text text-slate-600 dark:text-slate-400">
            {car.model}
          </p>
        </div>

        {/* Driver Info */}
        {car.driver_name && (
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3 text-blue-600" />
              <span className="mobile-text font-medium text-blue-700 dark:text-blue-300">
                <span className="truncate max-w-20">{car.driver_name}</span>
              </span>
            </div>
          </div>
        )}

        {/* Battery Level */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="mobile-text font-medium text-slate-700 dark:text-slate-300">
              {t("charge")}
            </span>
            <span className={`mobile-text font-bold ${getChargeColor()}`}>
              {car.battery_level}%
            </span>
          </div>
          <div className="relative">
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${getChargeProgressColor()}`}
                style={{ width: `${car.battery_level}%` }}
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-3 w-3 text-slate-500" />
            <span className="mobile-text font-medium text-slate-700 dark:text-slate-300">
              {t("location")}
            </span>
          </div>
          <p className="mobile-text text-slate-600 dark:text-slate-400 truncate">
            {car.location || t("notSpecified")}
          </p>
        </div>

        {/* Last Updated */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-3 w-3 text-slate-500" />
            <span className="mobile-text font-medium text-slate-700 dark:text-slate-300">
              {t("lastUpdated")}
            </span>
          </div>
          <p className="mobile-text text-slate-600 dark:text-slate-400">
            {car.last_updated ? formatLastUpdated(car.last_updated) : t("justNow")}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {car.status === "free" && !isCarScheduled && (
            <>
              <Button
                onClick={() => handleAction(() => onTakeWithCharge(car))}
                disabled={isLoading}
                className="mobile-button w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg shadow-blue-200 dark:shadow-blue-900/20"
              >
                {isLoading ? t("loading") : t("takeVehicle")}
              </Button>
              <Button
                onClick={() => handleAction(() => onReserve(car))}
                variant="outline"
                disabled={isLoading}
                className="mobile-button w-full border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium opacity-80"
              >
                {t("reserve")}
              </Button>
            </>
          )}
          
          {car.status === "free" && isCarScheduled && (
            <Button
              variant="outline"
              disabled={true}
              className="mobile-button w-full border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-800 text-purple-400 dark:text-purple-500 font-medium opacity-50 cursor-not-allowed"
            >
              Admin Scheduled
            </Button>
          )}
          
          {car.status === "busy" && (
            <Button
              onClick={() => handleAction(() => onReturnWithCharge(car))}
              disabled={isLoading}
              className="mobile-button w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg shadow-green-200 dark:shadow-green-900/20"
            >
              {isLoading ? t("loading") : t("returnVehicle")}
            </Button>
          )}
          
          {car.status === "reserved" && !isCarScheduled && (
            <Button
              onClick={() => handleAction(() => onManage(car))}
              variant="outline"
              disabled={isLoading}
              className="mobile-button w-full border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium opacity-80"
            >
              {t("viewDetails")}
            </Button>
          )}
          
          {car.status === "reserved" && isCarScheduled && (
            <Button
              variant="outline"
              disabled={true}
              className="mobile-button w-full border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-800 text-purple-400 dark:text-purple-500 font-medium opacity-50 cursor-not-allowed"
            >
              Admin Scheduled
            </Button>
          )}
          
          {car.status === "maintenance" && (
            <Button
              onClick={() => handleAction(() => onManage(car))}
              variant="outline"
              disabled={isLoading}
              className="mobile-button w-full border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium opacity-50"
            >
              {t("viewDetails")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 