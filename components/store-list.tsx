"use client"
import React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, Plus, Pencil, Trash2, ChevronDown, ChevronRight, MapPin } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StoreType {
  storetype_id: number
  type_name: string
  description: string
}

interface City {
  city_id: number
  city_name: string
  region: string
}

interface Store {
  store_id: number
  store_name: string
  storetype_id: number
  city_id: number
  opening_date: string
  address: string
  store_types: StoreType
  cities: City
}

export function StoresList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [stores, setStores] = useState<Store[]>([])
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [expandedStores, setExpandedStores] = useState<number[]>([])

  const supabase = createClientComponentClient()

  const addForm = useForm<Omit<Store, "store_id" | "store_types" | "cities">>()
  const editForm = useForm<Omit<Store, "store_types" | "cities">>()

  useEffect(() => {
    fetchStores()
    fetchStoreTypes()
    fetchCities()
  }, [])

  async function fetchStores() {
    const { data, error } = await supabase.from("stores").select(`
      store_id,
      store_name,
      storetype_id,
      city_id,
      opening_date,
      address,
      store_types (
        storetype_id,
        type_name,
        description
      ),
      cities (
        city_id,
        city_name,
        region
      )
    `)

    if (error) {
      console.error("Error fetching stores:", error)
      toast.error("Failed to fetch stores")
    } else {
      setStores(data || [])
    }
  }

  async function fetchStoreTypes() {
    const { data, error } = await supabase.from("store_types").select("*")

    if (error) {
      console.error("Error fetching store types:", error)
    } else {
      setStoreTypes(data || [])
    }
  }

  async function fetchCities() {
    const { data, error } = await supabase.from("cities").select("*")

    if (error) {
      console.error("Error fetching cities:", error)
    } else {
      setCities(data || [])
    }
  }

  const filteredStores = stores.filter((store) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      store.store_name.toLowerCase().includes(searchLower) ||
      store.store_types?.type_name.toLowerCase().includes(searchLower) ||
      store.cities?.city_name.toLowerCase().includes(searchLower) ||
      store.cities?.region.toLowerCase().includes(searchLower) ||
      (store.address && store.address.toLowerCase().includes(searchLower))
    )
  })

  const handleStoreView = (store: Store, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setSelectedStore(store)
    setIsStoreModalOpen(true)
  }

  const handleLocationView = (store: Store, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setSelectedStore(store)
    setIsLocationModalOpen(true)
  }

  const handleAddStore = async (data: Omit<Store, "store_id" | "store_types" | "cities">) => {
    const { error } = await supabase.from("stores").insert([data])

    if (error) {
      console.error("Error adding store:", error)
      toast.error("Failed to add store")
    } else {
      setIsAddModalOpen(false)
      fetchStores()
      toast.success("Store added successfully")
    }
  }

  const handleEditStore = async (data: Omit<Store, "store_types" | "cities">) => {
    const { error } = await supabase.from("stores").update(data).eq("store_id", data.store_id)

    if (error) {
      console.error("Error updating store:", error)
      toast.error("Failed to update store")
    } else {
      setIsEditModalOpen(false)
      fetchStores()
      toast.success("Store updated successfully")
    }
  }

  const handleDeleteStore = async (storeId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    const { error } = await supabase.from("stores").delete().eq("store_id", storeId)

    if (error) {
      console.error("Error deleting store:", error)
      toast.error("Failed to delete store")
    } else {
      fetchStores()
      toast.success("Store deleted successfully")
    }
  }

  const toggleStoreExpansion = (storeId: number) => {
    setExpandedStores((prev) => (prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]))
  }

  const StoreForm = ({
    form,
    onSubmit,
    dialogTitle,
  }: {
    form: any
    onSubmit: (data: any) => void
    dialogTitle: string
  }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="store_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="storetype_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a store type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {storeTypes.map((type) => (
                    <SelectItem key={type.storetype_id} value={type.storetype_id.toString()}>
                      {type.type_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.city_id} value={city.city_id.toString()}>
                      {city.city_name}, {city.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="opening_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Opening Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date?.toISOString())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{dialogTitle}</Button>
      </form>
    </Form>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search stores..."
          className="max-w-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Store
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Store Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Opening Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStores.map((store) => (
              <React.Fragment key={store.store_id}>
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={5}>
                    <Button variant="ghost" onClick={() => toggleStoreExpansion(store.store_id)} className="p-0">
                      {expandedStores.includes(store.store_id) ? (
                        <ChevronDown className="mr-2 h-4 w-4" />
                      ) : (
                        <ChevronRight className="mr-2 h-4 w-4" />
                      )}
                      {store.store_name}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => handleLocationView(store, e)} className="ml-1">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedStores.includes(store.store_id) && (
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>{store.store_types?.type_name}</TableCell>
                    <TableCell>{store.store_types?.description}</TableCell>
                    <TableCell>{store.opening_date ? format(new Date(store.opening_date), "PPP") : "N/A"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={(e) => handleStoreView(store, e)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedStore(store)
                          editForm.reset(store)
                          setIsEditModalOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={(e) => handleDeleteStore(store.store_id, e)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isLocationModalOpen} onOpenChange={setIsLocationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Location Details</DialogTitle>
          </DialogHeader>
          {selectedStore && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <p>
                  <strong>Name:</strong> {selectedStore.store_name}
                </p>
                <p>
                  <strong>Address:</strong> {selectedStore.address || "N/A"}
                </p>
                <p>
                  <strong>City:</strong> {selectedStore.cities?.city_name}
                </p>
                <p>
                  <strong>Region:</strong> {selectedStore.cities?.region}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Store</DialogTitle>
          </DialogHeader>
          <StoreForm form={addForm} onSubmit={handleAddStore} dialogTitle="Add Store" />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Store</DialogTitle>
          </DialogHeader>
          <StoreForm form={editForm} onSubmit={handleEditStore} dialogTitle="Update Store" />
        </DialogContent>
      </Dialog>
    </div>
  )
}