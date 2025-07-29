"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Camera, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  Calendar, 
  User, 
  Car,
  BarChart3,
  Users, 
  Clock,
  Image,
  RefreshCw,
  Plus, 
  Edit, 
  Settings,
  Wrench,
  Fuel,
  Battery,
  MapPin,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CalendarDays,
  Clock4
} from "lucide-react"
import { carService, reservationService } from "@/lib/data-service"
import { photoService, type PhotoData } from "@/lib/photo-service"
import PhotoViewer from "../components/photo-viewer"
import { useLanguage } from "../contexts/language-context"
import { useToast } from "@/hooks/use-toast"
import type { CarData } from "../types/fleet"

export default function AdminPage() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [cars, setCars] = useState<CarData[]>([])
  const [recentPhotos, setRecentPhotos] = useState<PhotoData[]>([])
  const [photoStats, setPhotoStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null)
  const [showPhotoViewer, setShowPhotoViewer] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "free" | "busy" | "reserved" | "maintenance">("all")
  
  // Car management states
  const [showAddCar, setShowAddCar] = useState(false)
  const [showEditCar, setShowEditCar] = useState(false)
  const [selectedCar, setSelectedCar] = useState<CarData | null>(null)
  const [newCar, setNewCar] = useState({
    plate_number: "",
    model: "",
    location: "",
    battery_level: 100,
    fuel_level: 100,
    mileage: 0,
    status: "free" as const
  })

  // Scheduling states
  const [showScheduleCar, setShowScheduleCar] = useState(false)
  const [showEditSchedule, setShowEditSchedule] = useState(false)
  const [scheduleData, setScheduleData] = useState({
    driver_name: "",
    reserved_from: "",
    reserved_to: "",
    notes: ""
  })

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load cars
      const carsData = await carService.getAllCarsWithSchedule()
      setCars(carsData)
      
      // Load recent photos
      const photosData = await photoService.getRecentPhotos(20)
      setRecentPhotos(photosData)
      
      // Load photo stats
      const stats = await photoService.getPhotoStats()
      setPhotoStats(stats)
      
    } catch (error) {
      console.error('Error loading admin data:', error)
      toast({
        title: t("error"),
        description: "Failed to load admin data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCar = async () => {
    try {
      const carData = {
        plate_number: newCar.plate_number,
        model: newCar.model,
        status: newCar.status,
        location: newCar.location,
        battery_level: Number(newCar.battery_level),
        fuel_level: Number(newCar.fuel_level),
        mileage: Number(newCar.mileage),
      }
      
      await carService.addCar(carData)
      
      toast({
        title: t("success"),
        description: "Bil lagt til vellykket.",
        variant: "default",
      })
      
      setShowAddCar(false)
      setNewCar({
        plate_number: "",
        model: "",
        location: "",
        battery_level: 100,
        fuel_level: 100,
        mileage: 0,
        status: "free"
      })
      
      loadData()
    } catch (error) {
      console.error('Error adding car:', error)
      toast({
        title: t("error"),
        description: "Kunne ikke legge til bil.",
        variant: "destructive",
      })
    }
  }

  const handleEditCar = async () => {
    if (!selectedCar) return
    
    try {
      await carService.updateCar(selectedCar.id, selectedCar)
      
      toast({
        title: t("success"),
        description: "Bil oppdatert vellykket.",
        variant: "default",
      })
      
      setShowEditCar(false)
      setSelectedCar(null)
      loadData()
    } catch (error) {
      console.error('Error updating car:', error)
      toast({
        title: t("error"),
        description: "Kunne ikke oppdatere bil.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCar = async (carId: string) => {
    if (!confirm("Er du sikker på at du vil slette denne bilen?")) return
    
    try {
      await carService.deleteCar(carId)
      
      toast({
        title: t("success"),
        description: "Bil slettet vellykket.",
        variant: "default",
      })
      
        loadData()
    } catch (error) {
      console.error('Error deleting car:', error)
      toast({
        title: t("error"),
        description: "Kunne ikke slette bil.",
        variant: "destructive",
      })
    }
  }

  const handleScheduleCar = async () => {
    if (!selectedCar) return
    
    try {
      // Create reservation
      const reservationData = {
        car_id: selectedCar.id,
        driver_id: `driver_${Date.now()}`, // Generate a temporary driver ID
        driver_name: scheduleData.driver_name,
        reserved_from: scheduleData.reserved_from,
        reserved_to: scheduleData.reserved_to,
        status: 'active' as const,
        notes: scheduleData.notes
      }
      
      await reservationService.addReservation(reservationData)
      
      // Update car status to reserved
      await carService.updateCar(selectedCar.id, {
        status: 'reserved',
        driver_name: scheduleData.driver_name,
        reserved_by: scheduleData.driver_name,
        reserved_from: scheduleData.reserved_from,
        reserved_to: scheduleData.reserved_to
      })
      
      toast({
        title: t("success"),
        description: "Bil planlagt vellykket.",
        variant: "default",
      })
      
      setShowScheduleCar(false)
      setSelectedCar(null)
      setScheduleData({
        driver_name: "",
        reserved_from: "",
        reserved_to: "",
        notes: ""
      })
      
      loadData()
    } catch (error) {
      console.error('Error scheduling car:', error)
      toast({
        title: t("error"),
        description: "Kunne ikke planlegge bil.",
        variant: "destructive",
      })
    }
  }

  const handleEditSchedule = async () => {
    if (!selectedCar) return
    
    try {
      // Update car with new schedule data
      await carService.updateCar(selectedCar.id, {
        driver_name: scheduleData.driver_name,
        reserved_by: scheduleData.driver_name,
        reserved_from: scheduleData.reserved_from,
        reserved_to: scheduleData.reserved_to
      })
      
      toast({
        title: t("success"),
        description: "Plan oppdatert vellykket.",
        variant: "default",
      })
      
      setShowEditSchedule(false)
      setSelectedCar(null)
      setScheduleData({
        driver_name: "",
        reserved_from: "",
        reserved_to: "",
        notes: ""
      })
      
      loadData()
    } catch (error) {
      console.error('Error updating schedule:', error)
      toast({
        title: t("error"),
        description: "Kunne ikke oppdatere plan.",
        variant: "destructive",
      })
    }
  }

  const handleCancelReservation = async (carId: string) => {
    if (!confirm("Er du sikker på at du vil avbryte denne reservasjonen?")) return
    
    try {
      // Update car status back to free
      await carService.updateCar(carId, {
        status: 'free',
        driver_name: undefined,
        reserved_by: undefined,
        reserved_from: undefined,
        reserved_to: undefined
      })
      
      toast({
        title: t("success"),
        description: "Reservasjon avbrutt vellykket.",
        variant: "default",
      })
      
      loadData()
    } catch (error) {
      console.error('Error cancelling reservation:', error)
      toast({
        title: t("error"),
        description: "Kunne ikke avbryte reservasjon.",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (carId: string, newStatus: "free" | "busy" | "reserved" | "maintenance") => {
    try {
      await carService.updateCar(carId, { status: newStatus })
      
      toast({
        title: t("success"),
        description: "Bilstatus oppdatert vellykket.",
        variant: "default",
      })
      
      loadData()
    } catch (error) {
      console.error('Error updating car status:', error)
      toast({
        title: t("error"),
        description: "Kunne ikke oppdatere bilstatus.",
        variant: "destructive",
      })
    }
  }

  const filteredCars = cars.filter(car => {
    const matchesSearch = 
      car.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (car.driver_name && car.driver_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === "all" || car.status === filterStatus
    
    return matchesSearch && matchesStatus
  })

  const handleViewPhotos = (carId: string) => {
    setSelectedCarId(carId)
    setShowPhotoViewer(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'free': return 'bg-green-500'
      case 'busy': return 'bg-red-500'
      case 'reserved': return 'bg-yellow-500'
      case 'maintenance': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'free': return t("available")
      case 'busy': return t("inUse")
      case 'reserved': return t("reserved")
      case 'maintenance': return t("maintenance")
      default: return status
    }
  }

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-500'
    if (level > 20) return 'text-yellow-500'
    return 'text-red-500'
  }

  const isCarScheduled = (car: CarData) => {
    return car.status === 'reserved' && car.reserved_from && car.reserved_to
  }

  const getScheduledTimeText = (car: CarData) => {
    if (!isCarScheduled(car) || !car.reserved_from || !car.reserved_to) return null
    
    const from = new Date(car.reserved_from)
    const to = new Date(car.reserved_to)
    
    return `${from.toLocaleDateString()} ${from.toLocaleTimeString()} - ${to.toLocaleTimeString()}`
  }

  const openEditSchedule = (car: CarData) => {
    setSelectedCar(car)
    setScheduleData({
      driver_name: car.driver_name || "",
      reserved_from: car.reserved_from || "",
      reserved_to: car.reserved_to || "",
      notes: ""
    })
    setShowEditSchedule(true)
  }

  // Helper to group photos
  const getGroupedPhotos = () => {
    const grouped: {
      [date: string]: {
        [carId: string]: {
          [driverKey: string]: PhotoData[]
        }
      }
    } = {}

    recentPhotos.forEach(p => {
      const day = new Date(p.uploaded_at).toISOString().split('T')[0]
      if (!grouped[day]) grouped[day] = {}
      if (!grouped[day][p.car_id]) grouped[day][p.car_id] = {}
      const driverKey = `${p.driver_name}-${p.trip_type}`
      if (!grouped[day][p.car_id][driverKey]) grouped[day][p.car_id][driverKey] = []
      grouped[day][p.car_id][driverKey].push(p)
    })
    return grouped
  }

  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())

  const togglePhotoSelect = (id:string)=>{
    setSelectedPhotos(prev=>{
      const newSet=new Set(prev)
      if(newSet.has(id)) newSet.delete(id); else newSet.add(id)
      return newSet
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedPhotos.size === 0) return
    if (!confirm(`Slett ${selectedPhotos.size} valgte bilder?`)) return
    const ids = Array.from(selectedPhotos)
    // optimistic UI update
    setRecentPhotos(prev => prev.filter(p => !selectedPhotos.has(p.id)))
    setSelectedPhotos(new Set())
    try {
      await Promise.all(ids.map(id => photoService.deletePhoto(id)))
      toast({ title: t("success"), description: `Slettet ${ids.length} bilder.` })
    } catch (e) {
      console.error('Bulk delete error', e)
      toast({ title: t("error"), description: "Kunne ikke slette noen bilder", variant: "destructive" })
      // reload to sync
      loadData()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("adminDashboard")}
                </h1>
              </div>
        <div className="flex gap-2">
          <Dialog open={showAddCar} onOpenChange={setShowAddCar}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("addCar")}
                    </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("addNewCar")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="plate_number">{t("plateNumber")}</Label>
                  <Input
                    id="plate_number"
                    value={newCar.plate_number}
                    onChange={(e) => setNewCar({...newCar, plate_number: e.target.value})}
                    placeholder="EL12345"
                  />
            </div>
                <div>
                  <Label htmlFor="model">{t("model")}</Label>
                  <Input
                    id="model"
                    value={newCar.model}
                    onChange={(e) => setNewCar({...newCar, model: e.target.value})}
                    placeholder="Tesla Model 3"
                  />
          </div>
                <div>
                  <Label htmlFor="location">{t("location")}</Label>
                  <Input
                    id="location"
                    value={newCar.location}
                    onChange={(e) => setNewCar({...newCar, location: e.target.value})}
                    placeholder="SNØ P-hus"
                  />
        </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="battery_level">{t("battery")} (%)</Label>
                    <Input
                      id="battery_level"
                      type="number"
                      value={newCar.battery_level}
                      onChange={(e) => setNewCar({...newCar, battery_level: Number(e.target.value)})}
                      min="0"
                      max="100"
                    />
      </div>
                  <div>
                    <Label htmlFor="mileage">{t("mileage")} (km)</Label>
                    <Input
                      id="mileage"
                      type="number"
                      value={newCar.mileage}
                      onChange={(e) => setNewCar({...newCar, mileage: Number(e.target.value)})}
                      min="0"
                    />
              </div>
            </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowAddCar(false)}>
                    {t("cancel")}
                  </Button>
                  <Button onClick={handleAddCar}>
                    {t("addCar")}
                  </Button>
          </div>
                  </div>
            </DialogContent>
          </Dialog>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("refresh")}
          </Button>
                  </div>
                </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalVehicles")}</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cars.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("available")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{cars.filter(car => car.status === 'free').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("inUse")}</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{cars.filter(car => car.status === 'busy').length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("maintenance")}</CardTitle>
            <Wrench className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{cars.filter(car => car.status === 'maintenance').length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="fleet" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fleet">{t("fleet")}</TabsTrigger>
          <TabsTrigger value="photos">{t("photos")}</TabsTrigger>
        </TabsList>

            {/* Fleet Management */}
        <TabsContent value="fleet" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t("searchVehicles")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
                  </div>
                </div>
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={t("filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allStatuses")}</SelectItem>
                <SelectItem value="free">{t("available")}</SelectItem>
                <SelectItem value="busy">{t("inUse")}</SelectItem>
                <SelectItem value="reserved">{t("reserved")}</SelectItem>
                <SelectItem value="maintenance">{t("maintenance")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fleet Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCars.map((car) => (
              <Card 
                key={car.id} 
                className={`hover:shadow-lg transition-shadow ${
                  isCarScheduled(car) ? 'opacity-75 bg-gray-50 dark:bg-gray-800' : ''
                }`}
              >
            <CardHeader>
                  <div className="flex items-center justify-between">
                <div>
                      <CardTitle className="text-lg">{car.plate_number}</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{car.model}</p>
                </div>
                    <Badge className={getStatusColor(car.status)}>
                      {getStatusText(car.status)}
                    </Badge>
                </div>
                  {isCarScheduled(car) && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                      <CalendarDays className="h-3 w-3" />
                      <span>{getScheduledTimeText(car)}</span>
              </div>
                  )}
            </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {t("location")}:
                    </span>
                    <span>{car.location}</span>
                            </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Battery className="h-3 w-3" />
                      {t("battery")}:
                    </span>
                    <span className={getBatteryColor(car.battery_level)}>{car.battery_level}%</span>
                          </div>
                  {car.driver_name && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {t("driver")}:
                              </span>
                      <span>{car.driver_name}</span>
                            </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t("lastUpdated")}:
                              </span>
                    <span>{new Date(car.last_updated).toLocaleString()}</span>
                          </div>
                          
                          {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                            <Button
                      onClick={() => handleViewPhotos(car.id)}
                              className="flex-1"
                              variant="outline"
                              size="sm"
                            >
                      <Camera className="h-4 w-4 mr-1" />
                      {t("viewPhotos")}
                            </Button>
                    
                    {!isCarScheduled(car) ? (
                      <>
                        <Dialog>
                          <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                              onClick={() => setSelectedCar(car)}
                    >
                              <Edit className="h-4 w-4" />
                    </Button>
                          </DialogTrigger>
                          <DialogContent>
          <DialogHeader>
                              <DialogTitle>{t("editCar")}</DialogTitle>
          </DialogHeader>
                            {selectedCar && (
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="edit_plate_number">{t("plateNumber")}</Label>
                                  <Input
                                    id="edit_plate_number"
                                    value={selectedCar.plate_number}
                                    onChange={(e) => setSelectedCar({...selectedCar, plate_number: e.target.value})}
                                  />
            </div>
                                <div>
                                  <Label htmlFor="edit_model">{t("model")}</Label>
                <Input
                                    id="edit_model"
                                    value={selectedCar.model}
                                    onChange={(e) => setSelectedCar({...selectedCar, model: e.target.value})}
                />
              </div>
                                <div>
                                  <Label htmlFor="edit_location">{t("location")}</Label>
                <Input
                                    id="edit_location"
                                    value={selectedCar.location}
                                    onChange={(e) => setSelectedCar({...selectedCar, location: e.target.value})}
                />
              </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="edit_battery_level">{t("battery")} (%)</Label>
                                    <Input
                                      id="edit_battery_level"
                                      type="number"
                                      value={selectedCar.battery_level}
                                      onChange={(e) => setSelectedCar({...selectedCar, battery_level: Number(e.target.value)})}
                                      min="0"
                                      max="100"
                          />
                        </div>
                                  <div>
                                    <Label htmlFor="edit_mileage">{t("mileage")} (km)</Label>
                                    <Input
                                      id="edit_mileage"
                                      type="number"
                                      value={selectedCar.mileage}
                                      onChange={(e) => setSelectedCar({...selectedCar, mileage: Number(e.target.value)})}
                                      min="0"
                          />
                        </div>
                                </div>
                                <div>
                                  <Label htmlFor="edit_status">{t("status")}</Label>
                          <Select 
                                    value={selectedCar.status}
                                    onValueChange={(value: "free" | "busy" | "reserved" | "maintenance") => setSelectedCar({...selectedCar, status: value})}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                      <SelectItem value="free">{t("available")}</SelectItem>
                                      <SelectItem value="busy">{t("inUse")}</SelectItem>
                                      <SelectItem value="reserved">{t("reserved")}</SelectItem>
                                      <SelectItem value="maintenance">{t("maintenance")}</SelectItem>
                            </SelectContent>
                          </Select>
                                    </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setSelectedCar(null)}>
                                    {t("cancel")}
              </Button>
                                  <Button onClick={handleEditCar}>
                                    {t("save")}
              </Button>
            </div>
          </div>
                            )}
        </DialogContent>
      </Dialog>

                        <Dialog open={showScheduleCar} onOpenChange={setShowScheduleCar}>
                          <DialogTrigger asChild>
              <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCar(car)
                                setShowScheduleCar(true)
                              }}
                            >
                              <CalendarDays className="h-4 w-4" />
              </Button>
                          </DialogTrigger>
                          <DialogContent>
          <DialogHeader>
                              <DialogTitle>{t("scheduleCar")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
                              <div>
                                <Label htmlFor="driver_name">{t("driverName")}</Label>
                <Input
                                  id="driver_name"
                                  value={scheduleData.driver_name}
                                  onChange={(e) => setScheduleData({...scheduleData, driver_name: e.target.value})}
                                  placeholder="Enter driver name"
                />
              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="reserved_from">{t("from")}</Label>
                <Input
                                    id="reserved_from"
                                    type="datetime-local"
                                    value={scheduleData.reserved_from}
                                    onChange={(e) => setScheduleData({...scheduleData, reserved_from: e.target.value})}
                />
              </div>
                                <div>
                                  <Label htmlFor="reserved_to">{t("to")}</Label>
              <Input
                                    id="reserved_to"
                                    type="datetime-local"
                                    value={scheduleData.reserved_to}
                                    onChange={(e) => setScheduleData({...scheduleData, reserved_to: e.target.value})}
              />
            </div>
            </div>
                        <div>
                                <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                                  id="notes"
                                  value={scheduleData.notes}
                                  onChange={(e) => setScheduleData({...scheduleData, notes: e.target.value})}
                                  placeholder="Optional notes"
              />
            </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowScheduleCar(false)}>
                                  {t("cancel")}
                </Button>
                                <Button onClick={handleScheduleCar}>
                                  {t("schedule")}
                </Button>
              </div>
          </div>
        </DialogContent>
      </Dialog>
                      </>
                    ) : (
                      <>
                      <Button 
                        variant="outline"
                          size="sm"
                          onClick={() => openEditSchedule(car)}
                          className="text-blue-600 hover:text-blue-700"
                      >
                          <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                          variant="outline"
                        size="sm" 
                          onClick={() => handleCancelReservation(car.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                      <Button 
                        variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCar(car.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                      <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        </TabsContent>

        {/* Photo Management */}
        <TabsContent value="photos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {t("recentPhotos")}
              </CardTitle>
              {recentPhotos.length>0 && (
                <Button size="sm" variant="outline" onClick={()=>setSelectedPhotos(new Set(recentPhotos.map(p=>p.id)))} className="ml-2">Velg Alle</Button>
              )}
              {recentPhotos.length>0 && (
                <Button size="sm" variant="destructive" onClick={()=>{setSelectedPhotos(new Set(recentPhotos.map(p=>p.id))); handleDeleteSelected();}} className="ml-2 flex items-center gap-1">
                  <Trash2 className="h-4 w-4" /> Slett Alle
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {recentPhotos.length === 0 ? (
              <div className="text-center py-8">
                  <Camera className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {t("noPhotosYet")}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {t("noPhotosDescription")}
                </p>
              </div>
              ) : (
                Object.entries(getGroupedPhotos()).sort((a,b)=>b[0].localeCompare(a[0])).map(([day, carsMap]) => (
                  <div key={day} className="mb-6">
                    <h3 className="font-semibold text-lg mb-2 flex items-center gap-2"><Calendar className="h-4 w-4" /> {day}</h3>
                    {Object.entries(carsMap).map(([carId, driversMap]) => (
                      <div key={carId} className="mb-4 ml-4">
                        <h4 className="font-medium mb-1 flex items-center gap-2"><Car className="h-4 w-4" /> {carId}</h4>
                        {Object.entries(driversMap).map(([driverKey, photosArr]) => {
                          const [driverName, trip] = driverKey.split('-')
                          return (
                            <div key={driverKey} className="mb-3 ml-4">
                              <div className="text-sm text-slate-600 mb-1 flex items-center gap-2">
                                <User className="h-4 w-4" /> {driverName} <Badge variant="secondary" className="ml-1 text-xs">{trip}</Badge>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                {photosArr.map(p => (
                                  <div key={p.id} className={`relative group ${selectedPhotos.has(p.id)?'ring-2 ring-blue-500':''}` }>
                                    <img src={p.photo_url} alt="photo" className="w-full h-32 object-cover rounded border" />
                                    {/* checkbox for multi select */}
                                    <input type="checkbox" className="absolute top-1 left-1 h-4 w-4" checked={selectedPhotos.has(p.id)} onChange={()=>togglePhotoSelect(p.id)} />
                                    {/* single delete button */}
                                    <button className="absolute top-1 right-1 bg-white/70 rounded p-0.5" onClick={async()=>{ if(confirm('Slett bilde?')){ setRecentPhotos(prev=>prev.filter(ph=>ph.id!==p.id)); await photoService.deletePhoto(p.id); } }}>
                                       <Trash2 className="h-3 w-3 text-red-600" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Photo Viewer Modal */}
      {selectedCarId && (
        <PhotoViewer
          carId={selectedCarId}
          isOpen={showPhotoViewer}
          onClose={() => {
            setShowPhotoViewer(false)
            setSelectedCarId(null)
          }}
        />
      )}

      {/* Edit Schedule Dialog */}
      {selectedCar && (
      <Dialog open={showEditSchedule} onOpenChange={setShowEditSchedule}>
          <DialogContent>
          <DialogHeader>
              <DialogTitle>Rediger Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
              <div>
                <Label htmlFor="edit_driver_name">{t("driverName")}</Label>
                <Input
                  id="edit_driver_name"
                  value={scheduleData.driver_name}
                  onChange={(e) => setScheduleData({...scheduleData, driver_name: e.target.value})}
                  placeholder="Enter driver name"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_reserved_from">{t("from")}</Label>
                  <Input
                    id="edit_reserved_from"
                    type="datetime-local"
                    value={scheduleData.reserved_from}
                    onChange={(e) => setScheduleData({...scheduleData, reserved_from: e.target.value})}
                />
              </div>
                <div>
                  <Label htmlFor="edit_reserved_to">{t("to")}</Label>
                  <Input
                    id="edit_reserved_to"
                    type="datetime-local"
                    value={scheduleData.reserved_to}
                    onChange={(e) => setScheduleData({...scheduleData, reserved_to: e.target.value})}
                />
              </div>
            </div>
              <div>
                <Label htmlFor="edit_notes">{t("notes")}</Label>
              <Textarea
                  id="edit_notes"
                  value={scheduleData.notes}
                  onChange={(e) => setScheduleData({...scheduleData, notes: e.target.value})}
                  placeholder="Optional notes"
              />
            </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedCar(null)}>
                  {t("cancel")}
              </Button>
                <Button onClick={handleEditSchedule}>
                  {t("save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      )}
    </div>
  )
} 