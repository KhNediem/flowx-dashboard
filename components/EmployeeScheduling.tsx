"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { GanttChart } from "./charts/GanttChart"
import { BarChart } from "./charts/BarChart"
import { LineChart } from "./charts/LineChart"
import type { DateRange } from "react-day-picker"

// Define the data structure
interface Profile {
  first_name?: string
  last_name?: string
}

interface ShiftData {
  profile_id: number
  store_id?: number
  predicted_shift_start?: string
  predicted_shift_end?: string
  confidence_score?: number
  prediction_date?: string
  profiles?: Profile[]
  // Add potential alternative field names
  start_time?: string
  end_time?: string
  shift_start?: string
  shift_end?: string
}

// Static data as fallback
const staticShiftData = [
  {
    profile_id: 1,
    store_id: 1,
    predicted_shift_start: "2023-06-01T09:00:00",
    predicted_shift_end: "2023-06-01T17:00:00",
    confidence_score: 0.9,
    prediction_date: "2023-05-25",
  },
  {
    profile_id: 2,
    store_id: 1,
    predicted_shift_start: "2023-06-01T10:00:00",
    predicted_shift_end: "2023-06-01T18:00:00",
    confidence_score: 0.8,
    prediction_date: "2023-05-25",
  },
  {
    profile_id: 3,
    store_id: 2,
    predicted_shift_start: "2023-06-01T12:00:00",
    predicted_shift_end: "2023-06-01T20:00:00",
    confidence_score: 0.7,
    prediction_date: "2023-05-26",
  },
  {
    profile_id: 4,
    store_id: 2,
    predicted_shift_start: "2023-06-02T09:00:00",
    predicted_shift_end: "2023-06-02T17:00:00",
    confidence_score: 0.85,
    prediction_date: "2023-05-26",
  },
  {
    profile_id: 5,
    store_id: 3,
    predicted_shift_start: "2023-06-02T11:00:00",
    predicted_shift_end: "2023-06-02T19:00:00",
    confidence_score: 0.75,
    prediction_date: "2023-05-27",
  },
]

const staticStores = [
  { store_id: 1, store_name: "Downtown Store" },
  { store_id: 2, store_name: "Uptown Store" },
  { store_id: 3, store_name: "Suburban Store" },
]

interface EmployeeSchedulingProps {
  data?: ShiftData[]
}

export function EmployeeScheduling({ data = [] }: EmployeeSchedulingProps) {
  // Use provided data or fallback to static data if empty
  const [shiftData, setShiftData] = useState<ShiftData[]>(data.length > 0 ? data : staticShiftData)
  const [stores, setStores] = useState(staticStores)
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(new Date().setDate(new Date().getDate() + 7)),
  })
  const [selectedChart, setSelectedChart] = useState("gantt")

  // Update shift data when prop changes
  useEffect(() => {
    if (data && data.length > 0) {
      data.forEach((shift, index) => {
        // Try to find the start and end times from various possible field names
        const startTime = shift.predicted_shift_start || shift.start_time || shift.shift_start
        const endTime = shift.predicted_shift_end || shift.end_time || shift.shift_end
      })
      setShiftData(data)
    }
  }, [data])

  const normalizedData = shiftData.map((shift) => {
    const startTime = shift.predicted_shift_start || shift.start_time || shift.shift_start
    const endTime = shift.predicted_shift_end || shift.end_time || shift.shift_end

    let normalizedStartTime = startTime
    let normalizedEndTime = endTime

    if (!normalizedStartTime || !normalizedEndTime) {
      const baseDate = new Date()
      baseDate.setHours(9, 0, 0, 0) // Start at 9 AM

      const shiftOffset = (shift.profile_id % 5) * 60 * 60 * 1000 // Offset by profile_id (in hours)
      const shiftStart = new Date(baseDate.getTime() + shiftOffset)
      const shiftEnd = new Date(shiftStart.getTime() + 8 * 60 * 60 * 1000) // 8 hour shift

      normalizedStartTime = shiftStart.toISOString()
      normalizedEndTime = shiftEnd.toISOString()
    }

    let predictionDate = shift.prediction_date
    if (!predictionDate) {
      try {
        const shiftDate = new Date(normalizedStartTime)
        if (!isNaN(shiftDate.getTime())) {
          predictionDate = shiftDate.toISOString().split("T")[0]
        } else {
          predictionDate = new Date().toISOString().split("T")[0]
        }
      } catch (error) {
        predictionDate = new Date().toISOString().split("T")[0]
      }
    }

    return {
      ...shift,
      predicted_shift_start: normalizedStartTime,
      predicted_shift_end: normalizedEndTime,
      confidence_score: shift.confidence_score || 0.5,
      store_id: shift.store_id || 1,
      prediction_date: predictionDate,
    }
  })

  const filteredData = normalizedData.filter((shift) => {
    // Store filter
    if (selectedStore && selectedStore !== -1 && shift.store_id !== selectedStore) {
      return false
    }

    // Confidence threshold filter
    if ((shift.confidence_score || 0) < confidenceThreshold) {
      return false
    }

    // Date range filter
    try {
      const shiftDate = new Date(shift.predicted_shift_start || "")
      if (isNaN(shiftDate.getTime())) {
        return false
      }

      const fromDate = dateRange?.from ? new Date(dateRange.from) : null
      const toDate = dateRange?.to ? new Date(dateRange.to) : null

      // Set times to midnight for proper comparison
      if (fromDate) fromDate.setHours(0, 0, 0, 0)
      if (toDate) {
        toDate.setHours(23, 59, 59, 999)
        // Add one day to include the end date fully
        toDate.setDate(toDate.getDate() + 1)
      }

      if (fromDate && shiftDate < fromDate) {
        return false
      }
      if (toDate && shiftDate > toDate) {
        return false
      }
    } catch (error) {
      console.error("Error filtering by date:", error)
      return false
    }

    return true
  })

  // Convert dateRange to the format expected by GanttChart
  const chartDateRange =
    dateRange.from && dateRange.to
      ? {
          from: new Date(dateRange.from),
          to: new Date(dateRange.to),
        }
      : undefined

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <Select onValueChange={(value) => setSelectedStore(Number(value))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Store" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-1">All Stores</SelectItem>
            {stores.map((store) => (
              <SelectItem key={store.store_id} value={store.store_id.toString()}>
                {store.store_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select defaultValue="gantt" onValueChange={(value) => setSelectedChart(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Chart Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gantt">Gantt Chart</SelectItem>
            <SelectItem value="bar">Bar Chart</SelectItem>
            <SelectItem value="line">Line Chart</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center space-x-2">
          <span>Confidence:</span>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={[confidenceThreshold]}
            onValueChange={([value]) => setConfidenceThreshold(value)}
            className="w-[100px]"
          />
          <span>{confidenceThreshold.toFixed(1)}</span>
        </div>
        <DateRangePicker date={dateRange} setDate={setDateRange} />
      </div>

      <div className="h-[400px] border rounded-lg p-4">
        {selectedChart === "gantt" && <GanttChart data={filteredData} dateRange={chartDateRange} />}
        {selectedChart === "bar" && <BarChart data={filteredData} />}
        {selectedChart === "line" && <LineChart data={filteredData} />}
      </div>
    </div>
  )
}

