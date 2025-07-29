"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Clock, User, Camera, Zap, Calendar, Settings, Play, Square, AlertTriangle } from "lucide-react"
import type { CarData } from "../types/fleet"
import { useLanguage } from "../contexts/language-context"

interface CarCardProps {
  car: CarData
  onManage: (car: CarData) => void
  onReserve: (car: CarData) => void
  onStatusChange: (carId: string, newStatus: CarData["status"], additionalData?: Partial<CarData>) => void
  onTakeWithCharge?: (car: CarData) => void
  onReturnWithCharge?: (car: CarData) => void
}

export default function CarCard({
  car,
  onManage,
  onReserve,
  onStatusChange,
  onTakeWithCharge,
  onReturnWithCharge,
}: CarCardProps) {
  const { t } = useLanguage()

  const getStatusConfig = (status: CarData["status"]) => {
    switch (status) {
      case "free":
        return {
          color: "bg-emerald-500",
          text: t("available"),
          dotColor: "bg-emerald-400",
        }
      case "busy":
        return {
          color: "bg-rose-500",
          text: t("inUse"),
          dotColor: "bg-rose-400",
        }
      case "reserved":
        return {
          color: "bg-amber-500",
          text: t("reserved"),
          dotColor: "bg-amber-400",
        }
      case "maintenance":
        return {
          color: "bg-slate-500",
          text: t("maintenance"),
          dotColor: "bg-slate-400",
        }
      default:
        return {
          color: "bg-slate-500",
          text: "Unknown",
          dotColor: "bg-slate-400",
        }
    }
  }

  const statusConfig = getStatusConfig(car.status)
  const timeSinceUpdate = Math.floor((Date.now() - new Date(car.last_updated).getTime()) / (1000 * 60))

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
    <Card className="rounded-lg shadow-sm relative overflow-hidden bg-white border-0">
      {/* Status Indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${statusConfig.color}`} />
      
      <CardHeader className="flex flex-col space-y-1.5 p-4 md:p-6 pb-2 md:pb-4 pt-4 md:pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 md:gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={`status-indicator ${statusConfig.dotColor}`} />
                <h3 className="font-bold text-lg md:text-xl text-slate-900">{car.plate_number}</h3>
              </div>
              {car.battery_level < 30 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {car.battery_level}%
                </Badge>
              )}
            </div>
            <p className="text-sm md:text-base font-medium text-slate-600 mb-2 md:mb-3">{car.model}</p>
            <Badge className={`inline-flex items-center rounded-full text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-secondary/80 ${statusConfig.color} text-white border-0 font-medium px-2 md:px-3 py-1`}>
              {statusConfig.text}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-6 w-6 md:h-8 md:w-8 p-0 hover:bg-slate-100 rounded-full"
            onClick={() => onManage(car)}
          >
            <Settings className="h-3 w-3 md:h-4 md:w-4 text-slate-600" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-5 pb-4 md:pb-6">
        {/* Low Battery Warning - Mobile Optimized */}
        {car.battery_level < 30 && (
          <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white p-3 md:p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 md:h-5 md:w-5" />
              <span className="font-semibold text-sm">{t("lowChargeWarning")}</span>
            </div>
            <p className="text-xs md:text-sm opacity-90">
                              {car.plate_number} {t("has")} {car.battery_level}% {t("charge")} - {t("needsCharging")}
            </p>
          </div>
        )}

        {/* Location Info - Mobile Optimized */}
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-start gap-2 md:gap-3 text-sm">
            <MapPin className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 truncate">{car.location}</p>
              <p className="text-xs text-slate-500 mt-1">
                {car.floor && car.side ? `${car.floor} • ${car.side} side` : car.location}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 text-sm text-slate-500">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{timeSinceUpdate < 1 ? t("justNow") : `${timeSinceUpdate}m ${t("ago")}`}</span>
          </div>
        </div>

        {/* Battery Info - Mobile Optimized */}
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${getChargeColor(car.battery_level)}`} />
              <span className="text-sm font-medium text-slate-700">{t("charging")}</span>
            </div>
            <span className={`font-bold text-sm ${getChargeColor(car.battery_level)}`}>{car.battery_level}%</span>
          </div>
          <div className="relative">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${getChargeProgressColor(car.battery_level)}`}
                style={{ width: `${car.battery_level}%` }}
              />
            </div>
          </div>
          {car.battery_level < 30 && (
            <div className="flex items-center gap-2 text-rose-600 text-xs font-medium">
              <AlertTriangle className="h-3 w-3" />
              <span>{t("lowCharge")} - {t("needsCharging")}</span>
            </div>
          )}
        </div>

        {/* Action Buttons - Mobile Optimized */}
        <div className="flex gap-2 pt-2">
          {car.status === "free" ? (
            <>
              <Button
                onClick={() => onTakeWithCharge?.(car)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground h-9 md:h-10 rounded-md px-3 flex-1 font-medium transition-all duration-200 shadow-sm bg-rose-500 hover:bg-rose-600 shadow-rose-200"
              >
                <Play className="h-4 w-4 mr-2" />
                {t("take")}
                {car.battery_level < 30 && <AlertTriangle className="h-3 w-3 ml-2" />}
              </Button>
              <Button
                onClick={() => onReserve(car)}
                variant="outline"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background hover:text-accent-foreground h-9 md:h-10 rounded-md px-3 flex-1 font-medium border-slate-300 hover:bg-slate-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t("reserve")}
              </Button>
            </>
          ) : car.status === "busy" ? (
            <>
              <Button
                onClick={() => onReturnWithCharge?.(car)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground h-9 md:h-10 rounded-md px-3 flex-1 bg-emerald-500 hover:bg-emerald-600 font-medium shadow-sm shadow-emerald-200"
              >
                <Square className="h-4 w-4 mr-2" />
                {t("return")}
              </Button>
              <Button
                variant="outline"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border bg-background hover:text-accent-foreground h-9 md:h-10 rounded-md px-3 border-slate-300 hover:bg-slate-50 opacity-50"
                disabled
              >
                <Camera className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-9 md:h-10 rounded-md px-3 flex-1 opacity-50 bg-transparent font-medium"
              disabled
            >
              <span className="text-xs">{t("underMaintenance")}</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 