"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

// Define the schema for the form
const formSchema = z
  .object({
    profile_id: z.string().min(1, { message: "Employee is required" }),
    store_id: z.string().min(1, { message: "Store is required" }),
    shift_start_date: z.date({ required_error: "Start date is required" }),
    shift_start_time: z.string().min(1, { message: "Start time is required" }),
    shift_end_date: z.date({ required_error: "End date is required" }),
    shift_end_time: z.string().min(1, { message: "End time is required" }),
    schedule_type: z.string().min(1, { message: "Schedule type is required" }),
    status: z.string().min(1, { message: "Status is required" }),
  })
  .refine(
    (data) => {
      // Create Date objects for start and end times
      const startDateTime = new Date(`${format(data.shift_start_date, "yyyy-MM-dd")}T${data.shift_start_time}`)
      const endDateTime = new Date(`${format(data.shift_end_date, "yyyy-MM-dd")}T${data.shift_end_time}`)

      // Check that end time is after start time
      return endDateTime > startDateTime
    },
    {
      message: "End time must be after start time",
      path: ["shift_end_time"],
    },
  )

type Profile = {
  id: string
  first_name?: string
  last_name?: string
  full_name?: string
  [key: string]: any
}

type Store = {
  store_id: string
  store_name: string
  address?: string
  [key: string]: any
}

type Shift = {
  schedule_id: string
  profile_id: string
  shift_start: string
  shift_end: string
  [key: string]: any
}

const scheduleTypes = ["Regular", "Overtime", "Training", "Meeting", "On-call"]

const statusOptions = ["Scheduled", "Confirmed", "Completed", "Cancelled"]

interface AddShiftModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddShiftModal({ open, onOpenChange }: AddShiftModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overlapError, setOverlapError] = useState<string | null>(null)

  const supabase = createClientComponentClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profile_id: "",
      store_id: "",
      shift_start_time: "09:00",
      shift_end_time: "17:00",
      schedule_type: "Regular",
      status: "Scheduled",
    },
  })

  // Fetch profiles and stores when component mounts
  useEffect(() => {
    async function fetchData() {
      setIsLoadingData(true)
      setError(null)

      try {
        // Fetch profiles
        const { data: profilesData, error: profilesError } = await supabase.from("profiles").select("*")

        if (profilesError) {
          throw new Error(`Error fetching profiles: ${profilesError.message}`)
        }

        // Fetch stores
        const { data: storesData, error: storesError } = await supabase.from("stores").select("*")

        if (storesError) {
          throw new Error(`Error fetching stores: ${storesError.message}`)
        }

        setProfiles(profilesData || [])
        setStores(storesData || [])
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [supabase])

  // Helper function to get employee display name
  const getEmployeeDisplayName = (profile: Profile) => {
    if (profile.full_name) return profile.full_name
    if (profile.first_name && profile.last_name) return `${profile.first_name} ${profile.last_name}`
    if (profile.first_name) return profile.first_name
    return `Employee ${profile.id}`
  }

  // Check for overlapping shifts
  const checkForOverlappingShifts = async (
    profileId: string,
    shiftStart: string,
    shiftEnd: string,
  ): Promise<boolean> => {
    try {
      // Get all shifts for this employee
      const { data: existingShifts, error } = await supabase.from("schedules").select("*").eq("profile_id", profileId)

      if (error) throw error

      if (!existingShifts || existingShifts.length === 0) return false

      // Convert the new shift times to Date objects for comparison
      const newShiftStart = new Date(shiftStart)
      const newShiftEnd = new Date(shiftEnd)

      // Check each existing shift for overlap
      for (const shift of existingShifts) {
        const existingShiftStart = new Date(shift.shift_start)
        const existingShiftEnd = new Date(shift.shift_end)

        // Check for overlap
        // Overlap occurs when:
        // 1. New shift starts during an existing shift (newStart >= existingStart && newStart < existingEnd)
        // 2. New shift ends during an existing shift (newEnd > existingStart && newEnd <= existingEnd)
        // 3. New shift completely contains an existing shift (newStart <= existingStart && newEnd >= existingEnd)
        // 4. New shift is completely contained by an existing shift (newStart >= existingStart && newEnd <= existingEnd)
        const overlap =
          (newShiftStart >= existingShiftStart && newShiftStart < existingShiftEnd) ||
          (newShiftEnd > existingShiftStart && newShiftEnd <= existingShiftEnd) ||
          (newShiftStart <= existingShiftStart && newShiftEnd >= existingShiftEnd) ||
          (newShiftStart >= existingShiftStart && newShiftEnd <= existingShiftEnd)

        if (overlap) {
          // Format the overlapping shift times for the error message
          const existingShiftStartStr = format(existingShiftStart, "MMM d, yyyy h:mm a")
          const existingShiftEndStr = format(existingShiftEnd, "MMM d, yyyy h:mm a")

          setOverlapError(
            `This shift overlaps with an existing shift from ${existingShiftStartStr} to ${existingShiftEndStr}`,
          )
          return true
        }
      }

      // No overlaps found
      setOverlapError(null)
      return false
    } catch (error) {
      console.error("Error checking for overlapping shifts:", error)
      setOverlapError("Error checking for shift overlaps. Please try again.")
      return true // Assume overlap on error to prevent creating potentially conflicting shifts
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    setOverlapError(null)

    try {
      // Combine date and time for shift_start and shift_end
      const shift_start = new Date(
        `${format(values.shift_start_date, "yyyy-MM-dd")}T${values.shift_start_time}`,
      ).toISOString()

      const shift_end = new Date(
        `${format(values.shift_end_date, "yyyy-MM-dd")}T${values.shift_end_time}`,
      ).toISOString()

      // Check for overlapping shifts
      const hasOverlap = await checkForOverlappingShifts(values.profile_id, shift_start, shift_end)

      if (hasOverlap) {
        setIsLoading(false)
        return // Stop the submission if there's an overlap
      }

      // Insert the new shift
      const { error: insertError } = await supabase.from("schedules").insert([
        {
          profile_id: values.profile_id,
          store_id: values.store_id,
          shift_start,
          shift_end,
          schedule_type: values.schedule_type,
          status: values.status,
        },
      ])

      if (insertError) throw insertError

      alert("Shift has been added successfully")

      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error("Error adding shift:", error)
      alert("Failed to add shift. Please check for duplicates or try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-black text-white border-gray-800">
        <DialogHeader>
          <DialogTitle>Add New Shift</DialogTitle>
          <DialogDescription>Create a new shift for an employee. Fill out all fields below.</DialogDescription>
        </DialogHeader>

        {error && <div className="bg-red-900/20 border border-red-800 text-red-100 p-3 rounded-md mb-4">{error}</div>}

        {overlapError && (
          <div className="bg-amber-900/20 border border-amber-800 text-amber-100 p-3 rounded-md mb-4">
            {overlapError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="profile_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value)
                        setOverlapError(null) // Clear overlap error when employee changes
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-gray-900 border-gray-700" disabled={isLoadingData}>
                          {isLoadingData ? (
                            <div className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span>Loading...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Select employee" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {profiles.map((profile) => (
                          <SelectItem key={profile.profile_id} value={profile.profile_id.toString()}>
                            {getEmployeeDisplayName(profile)}
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
                name="store_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-900 border-gray-700" disabled={isLoadingData}>
                          {isLoadingData ? (
                            <div className="flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              <span>Loading...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder="Select store" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {stores.map((store) => (
                          <SelectItem key={store.store_id} value={store.store_id.toString()}>
                            {store.store_name} - {store.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shift_start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="bg-gray-900 border-gray-700 text-white">
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date)
                            setOverlapError(null) // Clear overlap error when date changes
                          }}
                          initialFocus
                          className="bg-gray-900"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shift_start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="bg-gray-900 border-gray-700 text-white"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          setOverlapError(null) // Clear overlap error when time changes
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="shift_end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className="bg-gray-900 border-gray-700 text-white">
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date)
                            setOverlapError(null) // Clear overlap error when date changes
                          }}
                          initialFocus
                          className="bg-gray-900"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shift_end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        className="bg-gray-900 border-gray-700 text-white"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e)
                          setOverlapError(null) // Clear overlap error when time changes
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="schedule_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-900 border-gray-700">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {scheduleTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-gray-900 border-gray-700">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isLoadingData}
                className="bg-white text-black hover:bg-gray-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Add Shift"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
