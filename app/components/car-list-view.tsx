"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { MapPin, Clock, User, Camera, Fuel, Calendar, Play, Square, Users, Edit, X, CheckCircle, Wrench } from "lucide-react"
import { useLanguage } from "../contexts/language-context"
import type { CarData } from "../types/fleet"

interface CarListViewProps {
  cars: CarData[]
  onManage: (car: CarData) => void
  onReserve: (car: CarData) => void
  onStatusChange: (carId: string, newStatus: CarData["status"], additionalData?: Partial<CarData>) => void
  onReturnWithCharge: (car: CarData) => void
}

export default function CarListView({ cars, onManage, onReserve, onStatusChange, onReturnWithCharge }: CarListViewProps) {
  const { t } = useLanguage()
  
  const getStatusConfig = (status: CarData["status"]) => {
    switch (status) {
      case "free":
        return { bgColor: "bg-green-500", textColor: "text-white", label: t("available") }
      case "busy":
        return { bgColor: "bg-blue-500", textColor: "text-white", label: t("inUse") }
      case "reserved":
        return { bgColor: "bg-orange-500", textColor: "text-white", label: t("reserved") }
      case "maintenance":
        return { bgColor: "bg-red-500", textColor: "text-white", label: t("maintenance") }
      default:
        return { bgColor: "bg-gray-500", textColor: "text-white", label: "Unknown" }
    }
  }

  return (
    <div className="space-y-4">
      {cars.map((car) => {
        const formatLastUpdated = (timestamp: string | undefined) => {
          if (!timestamp) return t("justNow")
          
          const now = new Date()
          const updated = new Date(timestamp)
          const timeSinceUpdate = Math.floor((Date.now() - updated.getTime()) / (1000 * 60))
          
          if (timeSinceUpdate < 1) return t("justNow")
          if (timeSinceUpdate < 60) return `${timeSinceUpdate} ${t("minutesAgo")}`
          if (timeSinceUpdate < 1440) return `${Math.floor(timeSinceUpdate / 60)} ${t("hoursAgo")}`
          return `${Math.floor(timeSinceUpdate / 1440)} ${t("daysAgo")}`
        }

        return (
          <Card key={car.id} className="glass-effect border-white/20 professional-shadow hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Car Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusConfig(car.status).bgColor} ${getStatusConfig(car.status).textColor} border-0 font-medium`}
                    >
                      {getStatusConfig(car.status).label}
                    </Badge>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatLastUpdated(car.last_updated)}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{car.plate_number}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{car.model}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{car.location}</span>
                  </div>
                  
                  {car.floor && car.side && (
                    <p className="text-xs text-slate-500 dark:text-slate-500 mb-2">
                      {car.floor}, {car.side}
                    </p>
                  )}
                  
                  {/* Driver/Reservation Info */}
                  {car.status === "busy" && car.driver_name && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <Users className="h-3 w-3" />
                      <span className="truncate">{car.driver_name}</span>
                    </div>
                  )}
                  
                  {car.status === "reserved" && car.reserved_by && (
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <Calendar className="h-3 w-3" />
                      <span className="truncate font-medium">{car.reserved_by}</span>
                      {car.reserved_from && car.reserved_to && (
                        <span className="text-xs text-slate-500">
                          {(() => {
                            const startTime = new Date(car.reserved_from)
                            const endTime = new Date(car.reserved_to)
                            return `${startTime.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}`
                          })()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Battery Level */}
                <div className="flex flex-col items-end gap-2 ml-4">
                  <div className="text-right">
                    <span className="font-medium text-slate-900 dark:text-white">{car.fuel_level}%</span>
                    <div className="w-16 mt-1">
                      <Progress value={car.fuel_level} className="h-1.5" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onManage(car)}
                  className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20 hover:bg-white dark:hover:bg-slate-800 opacity-80"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  {t("manage")}
                </Button>
                
                {car.status === "free" && (
                  <Button
                    size="sm"
                    onClick={() => onReserve(car)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 opacity-80"
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {t("reserve")}
                  </Button>
                )}
                
                {car.status === "reserved" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(car.id, "free")}
                    className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20 hover:bg-white dark:hover:bg-slate-800 opacity-80"
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t("cancel")}
                  </Button>
                )}
                
                {car.status === "busy" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReturnWithCharge(car)}
                    className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20 hover:bg-white dark:hover:bg-slate-800 opacity-80"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t("return")}
                  </Button>
                )}
                
                {car.status === "maintenance" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(car.id, "free")}
                    className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-white/20 dark:border-slate-700/20 hover:bg-white dark:hover:bg-slate-800 opacity-50"
                  >
                    <Wrench className="h-3 w-3 mr-1" />
                    {t("maintenance")}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
