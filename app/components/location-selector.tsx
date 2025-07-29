"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Building } from "lucide-react"
import { useLanguage } from "../contexts/language-context"

interface LocationSelectorProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (location: string, floor: string, side: string) => void
  currentLocation?: string
  currentFloor?: string
  currentSide?: string
}

export default function LocationSelector({
  isOpen,
  onClose,
  onConfirm,
  currentLocation = "SNØ P-hus | APCOA PARKING",
  currentFloor = "2. etasje",
  currentSide = "Venstre",
}: LocationSelectorProps) {
  const { t } = useLanguage()
  const [location, setLocation] = useState(currentLocation)
  const [floor, setFloor] = useState(currentFloor)
  const [side, setSide] = useState(currentSide)

  const handleConfirm = () => {
    onConfirm(location, floor, side)
    onClose()
  }

  const floors = ["1. etasje", "2. etasje", "3. etasje", "4. etasje", "5. etasje"]

  const sides = ["Venstre", "Høyre"]

  const locations = [
    "SNØ P-hus | APCOA PARKING",
    "Service Senter",
    "Flyplass Terminal",
    "Sentrum Stasjon",
    "Hovedterminal",
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Velg Parkering</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="h-4 w-4 inline mr-2" />
              Lokasjon
            </Label>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {location === "SNØ P-hus | APCOA PARKING" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="floor">Etasje</Label>
                <Select value={floor} onValueChange={setFloor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {floors.map((flr) => (
                      <SelectItem key={flr} value={flr}>
                        {flr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="side">Side</Label>
                <Select value={side} onValueChange={setSide}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sides.map((sd) => (
                      <SelectItem key={sd} value={sd}>
                        {sd}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Valgt Lokasjon</h4>
            <div className="text-sm text-blue-700">
              <div className="font-medium">{location}</div>
              {location === "SNØ P-hus | APCOA PARKING" && (
                <div className="text-xs mt-1">
                  {floor} • {side} side
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              {t("cancel")}
            </Button>
            <Button onClick={handleConfirm} className="flex-1 bg-blue-600 hover:bg-blue-700">
              <MapPin className="h-4 w-4 mr-2" />
              Bekreft Lokasjon
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
