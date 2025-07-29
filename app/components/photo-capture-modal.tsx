"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Camera, RotateCcw, Check, X, ArrowLeft, ArrowRight, Smartphone } from "lucide-react"
import type { CarData } from "../types/fleet"
import { useLanguage } from "../contexts/language-context"

interface PhotoCaptureModalProps {
  car: CarData
  isOpen: boolean
  onClose: () => void
  onComplete: (photos: { [key: string]: string }) => void
  type: "pickup" | "return"
}

type PhotoPosition = "front" | "back" | "right" | "left"

interface PhotoData {
  [key: string]: string
}

export default function PhotoCaptureModal({
  car,
  isOpen,
  onClose,
  onComplete,
  type,
}: PhotoCaptureModalProps) {
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState<PhotoPosition>("front")
  const [photos, setPhotos] = useState<PhotoData>({})
  const [isCapturing, setIsCapturing] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const photoPositions: PhotoPosition[] = ["front", "back", "right", "left"]
  const currentIndex = photoPositions.indexOf(currentStep)

  const getPositionLabel = (position: PhotoPosition) => {
    switch (position) {
      case "front":
        return t("front")
      case "back":
        return t("back")
      case "right":
        return t("right")
      case "left":
        return t("left")
      default:
        return position
    }
  }

  const getPositionIcon = (position: PhotoPosition) => {
    switch (position) {
      case "front":
        return "🚗"
      case "back":
        return "🚗"
      case "right":
        return "🚗"
      case "left":
        return "🚗"
      default:
        return "📷"
    }
  }

  const startCamera = async () => {
    try {
      setCameraError(null)
      const constraints = {
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: { ideal: 16/9 }
        }
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      setCameraError("Kamera ikke tilgjengelig. Vennligst tillat kamera-tilgang.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (context) {
      // Set canvas size to match video dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      const photoData = canvas.toDataURL("image/jpeg", 0.8)
      setPhotos((prev) => ({
        ...prev,
        [currentStep]: photoData,
      }))

      // Auto-advance to next step after a short delay
      setTimeout(() => {
        if (currentIndex < photoPositions.length - 1) {
          setCurrentStep(photoPositions[currentIndex + 1])
        }
        setIsCapturing(false)
      }, 1000)
    }
  }

  const retakePhoto = () => {
    setPhotos((prev) => {
      const newPhotos = { ...prev }
      delete newPhotos[currentStep]
      return newPhotos
    })
  }

  const handleComplete = async () => {
    if (Object.keys(photos).length === 4) {
      setIsCompleting(true)
      try {
        await onComplete(photos)
      } catch (error) {
        console.error('Error completing photo capture:', error)
      } finally {
        setIsCompleting(false)
      }
    }
  }

  const handleClose = () => {
    stopCamera()
    setPhotos({})
    setCurrentStep("front")
    setCameraError(null)
    onClose()
  }

  const handleNext = () => {
    if (currentIndex < photoPositions.length - 1) {
      setCurrentStep(photoPositions[currentIndex + 1])
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentStep(photoPositions[currentIndex - 1])
    }
  }

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }
  }, [isOpen])

  const progress = Math.min((Object.keys(photos).length / 4) * 100, 100)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="mobile-modal-content max-w-[80vw] w-[80vw] h-[65vh] md:max-w-2xl md:h-[60vh] p-0 bg-white dark:bg-black">
        <DialogHeader className="mobile-spacing p-1.5 md:p-2 pb-0.5 md:pb-1 bg-white dark:bg-black text-slate-900 dark:text-white">
          <DialogTitle className="mobile-heading text-xs font-bold text-slate-900 dark:text-white">
            {type === "pickup" ? t("photoCapturePickup") : t("photoCaptureReturn")} - {car.plate_number}
          </DialogTitle>
          <p className="mobile-text text-xs text-slate-600 dark:text-gray-300">
            {t("photoCaptureInstructions")}
          </p>
        </DialogHeader>

        <div className="flex-1 flex flex-col mobile-spacing p-1.5 md:p-2 pt-0 bg-white dark:bg-black text-slate-900 dark:text-white">
          {/* Progress Bar - Mobile First */}
          <div className="mb-1.5">
            <div className="flex justify-between mobile-text text-xs text-slate-600 dark:text-gray-300 mb-0.5">
              <span>{t("progress")}: {Object.keys(photos).length}/4</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Position Info - Mobile First */}
          <div className="text-center mb-1.5">
            <h3 className="mobile-heading text-xs font-semibold text-slate-900 dark:text-white mb-0.5">
              {t("currentPosition")}: {getPositionLabel(currentStep)}
            </h3>
            <p className="mobile-text text-xs text-slate-600 dark:text-gray-300">
              {t("positionInstructions")} {getPositionLabel(currentStep).toLowerCase()} {t("ofVehicle")}
            </p>
          </div>

          {/* Camera View - Mobile First - Much Smaller */}
          <div className="relative bg-slate-100 dark:bg-gray-900 rounded-lg overflow-hidden mb-2 min-h-[80px] md:min-h-[100px]">
            {cameraError ? (
              <div className="flex items-center justify-center h-full bg-slate-200 dark:bg-gray-800">
                <div className="text-center p-2">
                  <Smartphone className="h-4 w-4 text-slate-500 dark:text-gray-400 mx-auto mb-1" />
                  <p className="mobile-text text-xs text-slate-700 dark:text-gray-300 mb-1">{cameraError}</p>
                  <Button
                    onClick={startCamera}
                    className="mobile-button bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1"
                  >
                    Prøv igjen
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                {isCapturing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                    <div className="mobile-text text-white text-xs font-medium">{t("capturing")}...</div>
                  </div>
                )}
                
                {/* Mobile-First Capture Button - Small and Centered */}
                {!photos[currentStep] && !isCapturing && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <Button
                      onClick={capturePhoto}
                      size="sm"
                      className="mobile-touch-friendly bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 text-xs font-medium rounded-full shadow-lg min-w-[60px] min-h-[24px]"
                    >
                      <Camera className="h-2.5 w-2.5 mr-0.5" />
                      {t("capture")}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile-First Photo Grid - Compact */}
          <div className="grid grid-cols-4 gap-0.5 mb-1.5">
            {photoPositions.map((position) => (
              <div
                key={position}
                className={`relative aspect-square rounded border ${
                  currentStep === position
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : photos[position]
                      ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                      : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                }`}
              >
                {photos[position] ? (
                  <img
                    src={photos[position]}
                    alt={`${getPositionLabel(position)} photo`}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-xs mb-0.5">{getPositionIcon(position)}</div>
                      <div className="mobile-text text-xs font-medium text-slate-600 dark:text-slate-400">
                        {getPositionLabel(position)}
                      </div>
                    </div>
                  </div>
                )}
                {photos[position] && (
                  <div className="absolute top-0.5 right-0.5">
                    <Check className="h-2 w-2 text-green-600 dark:text-green-400 bg-white dark:bg-slate-800 rounded-full p-0.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile-First Navigation - Ultra Compact */}
          <div className="flex items-center justify-between gap-0.5 mb-1.5">
            <div className="flex gap-0.5">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="mobile-button-compact flex items-center gap-0.5 text-xs px-1 py-0.5 h-5"
              >
                <ArrowLeft className="h-2 w-2" />
                <span className="hidden sm:inline">{t("previous")}</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentIndex === photoPositions.length - 1}
                className="mobile-button-compact flex items-center gap-0.5 text-xs px-1 py-0.5 h-5"
              >
                <span className="hidden sm:inline">{t("next")}</span>
                <ArrowRight className="h-2 w-2" />
              </Button>
            </div>

            <div className="flex gap-0.5">
              {photos[currentStep] && (
                <Button
                  variant="outline"
                  onClick={retakePhoto}
                  className="mobile-button-compact flex items-center gap-0.5 text-xs px-1 py-0.5 h-5"
                >
                  <RotateCcw className="h-2 w-2" />
                  <span className="hidden sm:inline">{t("retake")}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile-First Complete Button - Compact */}
          {Object.keys(photos).length === 4 && (
            <div className="text-center">
              <Button
                onClick={handleComplete}
                className="mobile-button bg-green-600 hover:bg-green-700 text-white px-2 md:px-3 py-1 text-xs font-medium w-full md:w-auto min-h-[24px]"
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <svg className="animate-spin h-2.5 w-2.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <>
                    <Check className="h-2.5 w-2.5 mr-0.5" />
                    {t("completePhotoCapture")}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 