"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { FilterOptions, CarData } from "../types/fleet"
import { useLanguage } from "../contexts/language-context"

interface FilterPanelProps {
  filters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  cars: CarData[]
}

export default function FilterPanel({ filters, onFiltersChange, cars }: FilterPanelProps) {
  const { t } = useLanguage()
  const uniqueLocations = Array.from(new Set(cars.map((car) => car.location)))

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      status: "all",
      location: "all",
      batteryLevel: "all",
      fuelLevel: "all",
    })
  }

  const hasActiveFilters = Object.values(filters).some((value) => value !== "all")

  return (
    <Card className="glass-effect border-white/20 professional-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Filtre</h3>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-slate-600 hover:text-slate-900">
              <X className="h-4 w-4 mr-1" />
              Tøm alle
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">{t("status")}</Label>
            <Select value={filters.status} onValueChange={(value) => updateFilter("status", value)}>
              <SelectTrigger className="h-10 bg-white/60 border-white/30 focus:bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatus")}</SelectItem>
                <SelectItem value="free">{t("available")}</SelectItem>
                <SelectItem value="busy">{t("inUse")}</SelectItem>
                <SelectItem value="reserved">{t("reserved")}</SelectItem>
                <SelectItem value="maintenance">{t("maintenance")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">{t("location")}</Label>
            <Select value={filters.location} onValueChange={(value) => updateFilter("location", value)}>
              <SelectTrigger className="h-10 bg-white/60 border-white/30 focus:bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allLocations")}</SelectItem>
                {uniqueLocations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">{t("chargeLevel")}</Label>
            <Select value={filters.batteryLevel} onValueChange={(value) => updateFilter("batteryLevel", value)}>
              <SelectTrigger className="h-10 bg-white/60 border-white/30 focus:bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allLevels")}</SelectItem>
                <SelectItem value="high">{t("high")}</SelectItem>
                <SelectItem value="medium">{t("medium")}</SelectItem>
                <SelectItem value="low">{t("low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">{t("chargeLevel")}</Label>
            <Select value={filters.fuelLevel} onValueChange={(value) => updateFilter("fuelLevel", value)}>
              <SelectTrigger className="h-10 bg-white/60 border-white/30 focus:bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allLevels")}</SelectItem>
                <SelectItem value="high">{t("high")}</SelectItem>
                <SelectItem value="medium">{t("medium")}</SelectItem>
                <SelectItem value="low">{t("low")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
