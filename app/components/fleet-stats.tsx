"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, CheckCircle, XCircle, Clock, Wrench, TrendingUp, Zap, ArrowUp } from "lucide-react"
import type { CarData, FilterOptions } from "../types/fleet"
import { useLanguage } from "../contexts/language-context"

interface FleetStatsProps {
  cars: CarData[]
  filters: FilterOptions
  onFilterChange: (filters: FilterOptions) => void
}

export default function FleetStats({ cars, filters, onFilterChange }: FleetStatsProps) {
  const { t } = useLanguage()
  
  // Safety check for undefined cars
  if (!cars || !Array.isArray(cars)) {
    return (
      <div className="mb-8">
        <div className="text-center py-8">
          <p className="text-slate-500">Loading fleet data...</p>
        </div>
      </div>
    )
  }
  
  const stats = {
    total: cars.length,
    free: cars.filter((car) => car.status === "free").length,
    busy: cars.filter((car) => car.status === "busy").length,
    reserved: cars.filter((car) => car.status === "reserved").length,
    maintenance: cars.filter((car) => car.status === "maintenance").length,
    lowCharge: cars.filter((car) => car.fuel_level < 30).length,
    utilization: cars.length > 0 ? Math.round((cars.filter((car) => car.status === "busy").length / cars.length) * 100) : 0,
  }

  const handleStatusClick = (status: "all" | "free" | "busy" | "reserved" | "maintenance") => {
    const newFilters = {
      ...filters,
      status: filters.status === status ? "all" : status,
    }
    onFilterChange(newFilters)
  }

  const handleLowChargeClick = () => {
    const newFilters = {
      ...filters,
      fuelLevel: filters.fuelLevel === "low" ? "all" : "low" as "all" | "low" | "medium" | "high",
    }
    onFilterChange(newFilters)
  }

  const statCards = [
    {
      title: t("totalFleet"),
      value: stats.total,
      icon: Car,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      iconBg: "bg-blue-500",
      change: `+2 ${t("thisMonth")}`,
      changeType: "positive" as const,
      onClick: () => handleStatusClick("all"),
      isActive: filters.status === "all",
      filterKey: "all" as const,
    },
    {
      title: t("available"),
      value: stats.free,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      iconBg: "bg-emerald-500",
      percentage: Math.round((stats.free / stats.total) * 100),
      onClick: () => handleStatusClick("free"),
      isActive: filters.status === "free",
      filterKey: "free" as const,
    },
    {
      title: t("inUse"),
      value: stats.busy,
      icon: XCircle,
      color: "text-rose-600",
      bgColor: "bg-gradient-to-br from-rose-50 to-rose-100",
      iconBg: "bg-rose-500",
      percentage: Math.round((stats.busy / stats.total) * 100),
      onClick: () => handleStatusClick("busy"),
      isActive: filters.status === "busy",
      filterKey: "busy" as const,
    },
    {
      title: t("reserved"),
      value: stats.reserved,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-gradient-to-br from-amber-50 to-amber-100",
      iconBg: "bg-amber-500",
      percentage: Math.round((stats.reserved / stats.total) * 100),
      onClick: () => handleStatusClick("reserved"),
      isActive: filters.status === "reserved",
      filterKey: "reserved" as const,
    },
    {
      title: t("maintenance"),
      value: stats.maintenance,
      icon: Wrench,
      color: "text-slate-600",
      bgColor: "bg-gradient-to-br from-slate-50 to-slate-100",
      iconBg: "bg-slate-500",
      percentage: Math.round((stats.maintenance / stats.total) * 100),
      onClick: () => handleStatusClick("maintenance"),
      isActive: filters.status === "maintenance",
      filterKey: "maintenance" as const,
    },
    {
      title: t("utilization"),
      value: `${stats.utilization}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      iconBg: "bg-purple-500",
      trend: stats.utilization > 70 ? t("highUsage") : stats.utilization > 40 ? t("mediumUsage") : t("lowUsage"),
      trendType: stats.utilization > 70 ? "high" : stats.utilization > 40 ? "medium" : "low",
      onClick: () => {}, // No filter for utilization
      isActive: false,
      filterKey: null,
    },
  ]

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className={`
              card-hover professional-shadow border-0 overflow-hidden cursor-pointer transition-all duration-300
              ${stat.isActive ? "ring-2 ring-blue-500 ring-offset-2 scale-105" : "hover:scale-105"}
              ${stat.filterKey ? "hover:shadow-xl" : ""}
            `}
            onClick={stat.onClick}
          >
            <CardContent className="p-0">
              <div className={`${stat.bgColor} p-4 h-full relative`}>
                {stat.isActive && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2.5 rounded-xl ${stat.iconBg} shadow-lg transition-transform ${stat.isActive ? "scale-110" : ""}`}
                  >
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  {stat.percentage !== undefined && (
                    <Badge variant="secondary" className="text-xs font-semibold bg-white/80 text-slate-700">
                      {stat.percentage}%
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  <p
                    className={`text-2xl font-bold transition-colors ${stat.isActive ? "text-blue-600" : "text-slate-900"}`}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">{stat.title}</p>

                  {stat.change && (
                    <div className="flex items-center gap-1 mt-2">
                      <ArrowUp className="h-3 w-3 text-emerald-600" />
                      <p className="text-xs text-emerald-600 font-medium">{stat.change}</p>
                    </div>
                  )}

                  {stat.trend && (
                    <p
                      className={`text-xs font-medium ${
                        stat.trendType === "high"
                          ? "text-emerald-600"
                          : stat.trendType === "medium"
                            ? "text-amber-600"
                            : "text-rose-600"
                      }`}
                    >
                      {stat.trend}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Cards */}
      {stats.lowCharge > 0 && (
        <Card
          className={`
            border-0 overflow-hidden professional-shadow cursor-pointer transition-all duration-300
            ${filters.fuelLevel === "low" ? "ring-2 ring-rose-500 ring-offset-2 scale-105" : "hover:scale-105"}
          `}
          onClick={handleLowChargeClick}
        >
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-white p-4 relative">
              {filters.fuelLevel === "low" && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{t("lowChargeAlert")}</p>
                  <p className="text-xs opacity-90">
                    {stats.lowCharge} {stats.lowCharge > 1 ? t("vehicles") : t("vehicle")} {t("needRecharging")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
