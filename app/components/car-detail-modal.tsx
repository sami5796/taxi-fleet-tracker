"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Clock, 
  User, 
  Car, 
  Battery, 
  Fuel, 
  MapPin, 
  Check, 
  AlertCircle, 
  CheckCircle,
  Camera,
  Upload,
  ArrowRight,
  ArrowLeft
} from "lucide-react"
import type { CarData } from "../types/fleet"
import { driverAuthService, type DriverAuth } from "../../lib/driver-auth-service"

interface CarDetailModalProps {
  car: CarData
  onClose: () => void
  onUpdateStatus: (id: string, status: CarData["status"], additionalData?: Partial<CarData>) => void
}

type FlowStep = 'driver-auth' | 'photo-capture' | 'action-confirmation'

export default function CarDetailModal({ car, onClose, onUpdateStatus }: CarDetailModalProps) {
  const [beforePhoto, setBeforePhoto] = useState<string | null>(car.before_photo || null)
  const [afterPhoto, setAfterPhoto] = useState<string | null>(car.after_photo || null)
  const [notes, setNotes] = useState(car.notes || "")
  const [driverId, setDriverId] = useState("")
  const [driverName, setDriverName] = useState("")
  const [isValidatingDriver, setIsValidatingDriver] = useState(false)
  const [validatedDriver, setValidatedDriver] = useState<DriverAuth | null>(null)
  const [driverErrors, setDriverErrors] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState<FlowStep>('driver-auth')
  const [pendingAction, setPendingAction] = useState<CarData["status"] | null>(null)

  const handlePhotoUpload = (type: "before" | "after", event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (type === "before") {
          setBeforePhoto(result)
        } else {
          setAfterPhoto(result)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const validateDriverCredentials = async () => {
    if (!driverId.trim() || !driverName.trim()) {
      setDriverErrors(["Please enter both Driver ID and Driver Name"])
      return false
    }

    setIsValidatingDriver(true)
    setDriverErrors([])

    try {
      const driver = await driverAuthService.validateDriverCredentials(driverId.trim(), driverName.trim())
      
      if (driver) {
        setValidatedDriver(driver)
        setDriverErrors([])
        return true
      } else {
        setValidatedDriver(null)
        setDriverErrors(["Invalid Driver ID or Driver Name. Please check your credentials."])
        return false
      }
    } catch (error) {
      console.error('Error validating driver:', error)
      setDriverErrors(["Error validating driver credentials. Please try again."])
      return false
    } finally {
      setIsValidatingDriver(false)
    }
  }

  const handleActionClick = async (action: CarData["status"]) => {
    if (!validatedDriver) {
      const isValidDriver = await validateDriverCredentials()
      if (!isValidDriver) {
        return
      }
    }

    setPendingAction(action)
    setCurrentStep('photo-capture')
  }

  const handlePhotoComplete = () => {
    setCurrentStep('action-confirmation')
  }

  const handleActionConfirm = async () => {
    if (!validatedDriver || !pendingAction) return

    const additionalData: Partial<CarData> = {
      before_photo: beforePhoto,
      after_photo: afterPhoto,
      notes,
    }

    if (pendingAction === "busy" && validatedDriver) {
      additionalData.driver_id = validatedDriver.id
      additionalData.driver_name = validatedDriver.name
      additionalData.location = "In Transit"
    }

    if (pendingAction === "free") {
      additionalData.driver_id = undefined
      additionalData.driver_name = undefined
      additionalData.reserved_by = undefined
      additionalData.reserved_from = undefined
      additionalData.reserved_to = undefined
      additionalData.location = "Available at Last Location"
    }

    onUpdateStatus(car.id, pendingAction, additionalData)
    onClose()
  }

  const resetFlow = () => {
    setCurrentStep('driver-auth')
    setPendingAction(null)
    setDriverId("")
    setDriverName("")
    setValidatedDriver(null)
    setDriverErrors([])
  }

  const renderDriverAuthStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-center mb-2">
          <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Sample Drivers</span>
        </div>
        <p className="text-sm text-blue-700 mb-3">
          Use Driver ID: <strong>1234</strong> and Driver Name: <strong>Bruker 1</strong> through <strong>Bruker 10</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="driver-id">Driver ID *</Label>
          <Input
            id="driver-id"
            placeholder="Enter your driver ID (1234)"
            value={driverId}
            onChange={(e) => {
              setDriverId(e.target.value)
              setDriverErrors([])
              setValidatedDriver(null)
            }}
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
              setDriverErrors([])
              setValidatedDriver(null)
            }}
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
      {driverErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
          {driverErrors.map((error, index) => (
            <div key={index} className="flex items-center text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 pt-4 border-t">
        {car.status === "free" && (
          <Button
            onClick={() => handleActionClick("busy")}
            disabled={!validatedDriver}
            className="bg-red-500 hover:bg-red-600"
          >
            <Check className="h-4 w-4 mr-2" />
            Take Vehicle
          </Button>
        )}

        {car.status === "busy" && (
          <Button 
            onClick={() => handleActionClick("free")} 
            className="bg-green-500 hover:bg-green-600"
            disabled={!validatedDriver}
          >
            <Check className="h-4 w-4 mr-2" />
            Return Vehicle
          </Button>
        )}

        {car.status === "reserved" && (
          <>
            <Button 
              onClick={() => handleActionClick("busy")} 
              className="bg-red-500 hover:bg-red-600"
              disabled={!validatedDriver}
            >
              <Check className="h-4 w-4 mr-2" />
              Start Trip
            </Button>
            <Button 
              onClick={() => handleActionClick("free")} 
              variant="outline"
              disabled={!validatedDriver}
            >
              Cancel Reservation
            </Button>
          </>
        )}

        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )

  const renderPhotoCaptureStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <div className="flex items-center mb-2">
          <Camera className="h-4 w-4 mr-2 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Photo Capture Required</span>
        </div>
        <p className="text-sm text-blue-700">
          Please take photos before {pendingAction === "busy" ? "taking" : "returning"} the vehicle.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before Photo */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">
            {pendingAction === "busy" ? "Before Photo (Pickup)" : "Before Photo (Return)"}
          </h3>
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {beforePhoto ? (
                <div className="space-y-2">
                  <img src={beforePhoto} alt="Before" className="w-full h-48 object-cover rounded" />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('before-photo')?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Replace
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBeforePhoto(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Camera className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">No before photo uploaded</p>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('before-photo')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>
              )}
            </div>
            <input
              id="before-photo"
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload("before", e)}
              className="hidden"
            />
          </div>
        </div>

        {/* After Photo */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">
            {pendingAction === "busy" ? "After Photo (Return)" : "After Photo (Pickup)"}
          </h3>
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {afterPhoto ? (
                <div className="space-y-2">
                  <img src={afterPhoto} alt="After" className="w-full h-48 object-cover rounded" />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('after-photo')?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Replace
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAfterPhoto(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Camera className="h-8 w-8 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">No after photo uploaded</p>
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('after-photo')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Photo
                  </Button>
                </div>
              )}
            </div>
            <input
              id="after-photo"
              type="file"
              accept="image/*"
              onChange={(e) => handlePhotoUpload("after", e)}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any notes about the vehicle condition..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => setCurrentStep('driver-auth')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handlePhotoComplete}
          className="flex-1"
          disabled={!beforePhoto && !afterPhoto}
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )

  const renderActionConfirmationStep = () => (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
        <div className="flex items-center mb-2">
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          <span className="text-sm font-medium text-green-800">Ready to {pendingAction === "busy" ? "Take" : "Return"} Vehicle</span>
        </div>
        <p className="text-sm text-green-700">
          Driver: <strong>{validatedDriver?.name}</strong><br/>
          Vehicle: <strong>{car.plate_number}</strong><br/>
          Photos: <strong>{beforePhoto ? "Before" : "No before"}, {afterPhoto ? "After" : "No after"}</strong>
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Confirmation</h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Driver:</span>
            <span className="font-medium">{validatedDriver?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Vehicle:</span>
            <span className="font-medium">{car.plate_number} - {car.model}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Action:</span>
            <span className="font-medium">
              {pendingAction === "busy" ? "Take Vehicle" : "Return Vehicle"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Photos:</span>
            <span className="font-medium">
              {beforePhoto ? "✅ Before" : "❌ No before"}, {afterPhoto ? "✅ After" : "❌ No after"}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button variant="outline" onClick={() => setCurrentStep('photo-capture')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Photos
        </Button>
        <Button 
          onClick={handleActionConfirm}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <Check className="h-4 w-4 mr-2" />
          {pendingAction === "busy" ? "Take Vehicle" : "Return Vehicle"}
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{car.plate_number}</h2>
              <p className="text-sm text-gray-600 font-normal">{car.model}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep === 'driver-auth' ? '1' : currentStep === 'photo-capture' ? '2' : '3'} of 3</span>
            <span className="text-sm text-gray-500">
              {currentStep === 'driver-auth' ? 'Driver Authentication' : 
               currentStep === 'photo-capture' ? 'Photo Capture' : 'Confirmation'}
            </span>
          </div>
          <Progress 
            value={currentStep === 'driver-auth' ? 33 : currentStep === 'photo-capture' ? 66 : 100} 
            className="h-2" 
          />
        </div>

        {/* Step Content */}
        {currentStep === 'driver-auth' && renderDriverAuthStep()}
        {currentStep === 'photo-capture' && renderPhotoCaptureStep()}
        {currentStep === 'action-confirmation' && renderActionConfirmationStep()}

        {/* Vehicle Information (always visible) */}
        <Tabs defaultValue="overview" className="w-full mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Vehicle Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Vehicle Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium px-2 py-1 rounded text-sm ${
                      car.status === 'free' ? 'bg-green-100 text-green-800' :
                      car.status === 'busy' ? 'bg-red-100 text-red-800' :
                      car.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {car.status.charAt(0).toUpperCase() + car.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{car.location || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Floor:</span>
                    <span className="font-medium">{car.floor || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Side:</span>
                    <span className="font-medium">{car.side || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mileage:</span>
                    <span className="font-medium">{car.mileage.toLocaleString()} km</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Status Indicators</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Battery className="h-4 w-4 mr-2 text-green-600" />
                        <span className="text-sm font-medium">Battery Level</span>
                      </div>
                      <span className="text-sm font-medium">{car.battery_level}%</span>
                    </div>
                    <Progress value={car.battery_level} className="h-2" />
                  </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Fuel className="h-4 w-4 mr-2 text-blue-600" />
                        <span className="text-sm font-medium">Fuel Level</span>
                      </div>
                      <span className="text-sm font-medium">{car.fuel_level}%</span>
                    </div>
                    <Progress value={car.fuel_level} className="h-2" />
                  </div>
                </div>

                {car.driver_name && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Current Driver</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-medium">{car.driver_name}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {car.notes && (
            <div className="space-y-2">
                <h4 className="font-medium">Notes</h4>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{car.notes}</p>
                </div>
            </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before Photo */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Before Photo (Pickup)</h3>
              <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {beforePhoto ? (
                      <div className="space-y-2">
                        <img src={beforePhoto} alt="Before" className="w-full h-48 object-cover rounded" />
                      <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('before-photo-details')?.click()}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Replace
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setBeforePhoto(null)}
                          >
                          Remove
                          </Button>
                      </div>
                    </div>
                  ) : (
                      <div className="space-y-2">
                        <Camera className="h-8 w-8 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">No before photo uploaded</p>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('before-photo-details')?.click()}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                          Upload Photo
                        </Button>
                      </div>
                    )}
                  </div>
                  <input
                    id="before-photo-details"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload("before", e)}
                          className="hidden"
                        />
                </div>
              </div>

              {/* After Photo */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">After Photo (Return)</h3>
              <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {afterPhoto ? (
                      <div className="space-y-2">
                        <img src={afterPhoto} alt="After" className="w-full h-48 object-cover rounded" />
                      <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('after-photo-details')?.click()}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            Replace
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAfterPhoto(null)}
                          >
                          Remove
                          </Button>
                      </div>
                    </div>
                  ) : (
                      <div className="space-y-2">
                        <Camera className="h-8 w-8 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">No after photo uploaded</p>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('after-photo-details')?.click()}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                          Upload Photo
                        </Button>
                      </div>
                    )}
                  </div>
                  <input
                    id="after-photo-details"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload("after", e)}
                          className="hidden"
                        />
                </div>
              </div>
            </div>

                  <div className="space-y-2">
              <Label htmlFor="notes-details">Notes</Label>
              <Textarea
                id="notes-details"
                placeholder="Add any notes about the vehicle condition..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
