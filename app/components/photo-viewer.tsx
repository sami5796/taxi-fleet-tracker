"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Search, Download, Trash2, Eye, Calendar, User, Car } from "lucide-react"
import { photoService, type PhotoData } from "@/lib/photo-service"
import { useLanguage } from "../contexts/language-context"
import { useToast } from "@/hooks/use-toast"

interface PhotoViewerProps {
  carId?: string
  isOpen: boolean
  onClose: () => void
}

interface GroupedPhotos {
  [key: string]: {
    tripDate: string
    driverName: string
    tripType: 'pickup' | 'return'
    photos: PhotoData[]
  }
}

export default function PhotoViewer({ carId, isOpen, onClose }: PhotoViewerProps) {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [photos, setPhotos] = useState<PhotoData[]>([])
  const [groupedPhotos, setGroupedPhotos] = useState<GroupedPhotos>({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterTripType, setFilterTripType] = useState<"all" | "pickup" | "return">("all")
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)

  // Load photos
  useEffect(() => {
    if (isOpen && carId) {
      loadPhotos()
    }
  }, [isOpen, carId])

  const loadPhotos = async () => {
    try {
      setLoading(true)
      const photoData = await photoService.getPhotosForCar(carId!)
      setPhotos(photoData)
      
      // Group photos by trip
      const grouped: GroupedPhotos = {}
      photoData.forEach(photo => {
        const key = `${photo.trip_type}_${photo.uploaded_at.split('T')[0]}_${photo.driver_name}`
        if (!grouped[key]) {
          grouped[key] = {
            tripDate: new Date(photo.uploaded_at).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            driverName: photo.driver_name,
            tripType: photo.trip_type,
            photos: []
          }
        }
        grouped[key].photos.push(photo)
      })
      
      setGroupedPhotos(grouped)
    } catch (error) {
      console.error('Error loading photos:', error)
      toast({
        title: t("error"),
        description: "Failed to load photos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      const success = await photoService.deletePhoto(photoId)
      if (success) {
        toast({
          title: "Photo deleted",
          description: "Photo has been deleted successfully.",
          variant: "default",
        })
        loadPhotos() // Reload photos
      } else {
        toast({
          title: "Delete failed",
          description: "Failed to delete photo.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      toast({
        title: t("error"),
        description: "Failed to delete photo.",
        variant: "destructive",
      })
    }
  }

  const handleDownloadPhoto = (photo: PhotoData) => {
    const link = document.createElement('a')
    link.href = photo.photo_url
    link.download = photo.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredPhotos = Object.entries(groupedPhotos).filter(([key, group]) => {
    const matchesSearch = 
      group.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.tripDate.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTripType = filterTripType === "all" || group.tripType === filterTripType
    
    return matchesSearch && matchesTripType
  })

  const getTripTypeLabel = (type: 'pickup' | 'return') => {
    return type === 'pickup' ? t("pickup") : t("return")
  }

  const getPhotoTypeLabel = (type: string) => {
    switch (type) {
      case 'front': return t("front")
      case 'back': return t("back")
      case 'right': return t("right")
      case 'left': return t("left")
      default: return type
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="mobile-modal-content max-w-6xl h-[90vh] p-0">
          <DialogHeader className="mobile-spacing p-6 pb-4">
            <DialogTitle className="mobile-heading text-xl font-bold">
              {t("photoGallery")} - {carId}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 mobile-spacing p-6 pt-0 space-y-4">
            {/* Filters - Mobile Optimized */}
            <div className="mobile-grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={t("searchPhotos")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mobile-input pl-10"
                  />
                </div>
              </div>
              <Select value={filterTripType} onValueChange={(value: any) => setFilterTripType(value)}>
                <SelectTrigger className="mobile-input w-full sm:w-48">
                  <SelectValue placeholder={t("filterByTripType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allTrips")}</SelectItem>
                  <SelectItem value="pickup">{t("pickup")}</SelectItem>
                  <SelectItem value="return">{t("return")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Photos Grid - Mobile Optimized */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="text-center py-12">
                <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="mobile-heading text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {t("noPhotosFound")}
                </h3>
                <p className="mobile-text text-gray-500 dark:text-gray-400">
                  {t("noPhotosDescription")}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredPhotos.map(([key, group]) => (
                  <Card key={key} className="mobile-card overflow-hidden">
                    <CardHeader className="bg-gray-50 dark:bg-gray-800">
                      <div className="mobile-flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="mobile-flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="mobile-text font-medium">{group.tripDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="mobile-text font-medium">{group.driverName}</span>
                          </div>
                          <Badge variant={group.tripType === 'pickup' ? 'default' : 'secondary'}>
                            {getTripTypeLabel(group.tripType)}
                          </Badge>
                        </div>
                        <div className="mobile-text text-sm text-gray-500">
                          {group.photos.length} {t("photos")}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="mobile-spacing p-4">
                      <div className="mobile-grid grid-cols-2 md:grid-cols-4 gap-4">
                        {group.photos.map((photo) => (
                          <div key={photo.id} className="relative group">
                            <div className="aspect-square overflow-hidden rounded-lg border">
                              <img
                                src={photo.photo_url}
                                alt={`${getPhotoTypeLabel(photo.photo_type)} view`}
                                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                                onClick={() => {
                                  setSelectedPhoto(photo)
                                  setShowPhotoModal(true)
                                }}
                              />
                            </div>
                            
                            {/* Overlay with actions - Mobile Optimized */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg">
                              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Badge variant="secondary" className="mobile-text text-xs">
                                  {getPhotoTypeLabel(photo.photo_type)}
                                </Badge>
                              </div>
                              
                              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDownloadPhoto(photo)}
                                  className="mobile-touch-friendly h-8 w-8 p-0"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeletePhoto(photo.id)}
                                  className="mobile-touch-friendly h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Modal - Mobile Optimized */}
      <Dialog open={showPhotoModal} onOpenChange={setShowPhotoModal}>
        <DialogContent className="mobile-modal-content max-w-4xl">
          <DialogHeader>
            <DialogTitle className="mobile-heading">
              {selectedPhoto && (
                <div className="mobile-flex items-center gap-2">
                  <span>{getPhotoTypeLabel(selectedPhoto.photo_type)}</span>
                  <Badge variant="outline">{getTripTypeLabel(selectedPhoto.trip_type)}</Badge>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="mobile-spacing space-y-4">
              <div className="aspect-video overflow-hidden rounded-lg">
                <img
                  src={selectedPhoto.photo_url}
                  alt="Full size photo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mobile-grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="mobile-text font-medium">{t("driver")}:</span> {selectedPhoto.driver_name}
                </div>
                <div>
                  <span className="mobile-text font-medium">{t("date")}:</span> {new Date(selectedPhoto.uploaded_at).toLocaleString()}
                </div>
                <div>
                  <span className="mobile-text font-medium">{t("file")}:</span> {selectedPhoto.file_name}
                </div>
                <div>
                  <span className="mobile-text font-medium">{t("type")}:</span> {getPhotoTypeLabel(selectedPhoto.photo_type)}
                </div>
              </div>
              <div className="mobile-flex gap-2">
                <Button onClick={() => handleDownloadPhoto(selectedPhoto)} className="mobile-button">
                  <Download className="h-4 w-4 mr-2" />
                  {t("download")}
                </Button>
                <Button variant="destructive" onClick={() => handleDeletePhoto(selectedPhoto.id)} className="mobile-button">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("delete")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 