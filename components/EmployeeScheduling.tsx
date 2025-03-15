"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { GanttChart } from "./charts/GanttChart"
import { BarChart } from "./charts/BarChart"
import { LineChart } from "./charts/LineChart"
import { EmployeeHoursChart } from "./charts/EmployeeHoursChart"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DateRange } from "react-day-picker"

interface Profile {
  first_name?: string
  last_name?: string
}

interface ScheduleEntry {
  schedule_id: number
  profile_id: number
  store_id: number
  shift_start: string
  shift_end: string
  schedule_type: string
  status: string
}

interface SchedulePrediction {
  prediction_id: number
  profile_id: number
  store_id: number
  predicted_shift_start: string
  predicted_shift_end: string
  prediction_date: string
  confidence_score: number
}

interface Store {
  store_id: number
  store_name: string
}

const staticStores: Store[] = [
  { store_id: 1, store_name: "Downtown Store" },
  { store_id: 2, store_name: "Uptown Store" },
  { store_id: 3, store_name: "Suburban Store" },
]

interface EmployeeSchedulingProps {
  data: ScheduleEntry[]
  predictionData: SchedulePrediction[]
}

export function EmployeeScheduling({ data = [], predictionData = [] }: EmployeeSchedulingProps) {
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>(data)
  const [predictionSchedules, setPredictionSchedules] = useState<SchedulePrediction[]>(predictionData)
  const [stores, setStores] = useState<Store[]>(staticStores)
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(new Date().setDate(new Date().getDate() + 7)),
  })
  const [hoursDateRange, setHoursDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(new Date().setDate(new Date().getDate())),
  })
  const [selectedChart, setSelectedChart] = useState("gantt")
  const [showHoursChart, setShowHoursChart] = useState(true)

  useEffect(() => {
    if (data && data.length > 0) {
      setScheduleData(data)
    }
    
    if (predictionData && predictionData.length > 0) {
      setPredictionSchedules(predictionData)
    }
  }, [data, predictionData])

  const processedScheduleData = scheduleData.map((schedule) => ({
    id: schedule.schedule_id,
    profile_id: schedule.profile_id,
    store_id: schedule.store_id,
    start: schedule.shift_start,
    end: schedule.shift_end,
    type: "actual",
    confidence_score: 1.0,
  }))
  
  const processedPredictionData = predictionSchedules.map((prediction) => ({
    id: prediction.prediction_id,
    profile_id: prediction.profile_id,
    store_id: prediction.store_id,
    start: prediction.predicted_shift_start,
    end: prediction.predicted_shift_end,
    type: "predicted",
    confidence_score: prediction.confidence_score,
    prediction_date: prediction.prediction_date,
  }))
  
  const combinedData = [...processedScheduleData, ...processedPredictionData]

  // Filter data for the Gantt chart
  const filteredGanttData = combinedData.filter((item) => {
    // Store filter
    if (selectedStore && selectedStore !== -1 && item.store_id !== selectedStore) {
      return false
    }

    // Confidence threshold filter
    if (item.confidence_score < confidenceThreshold) {
      return false
    }

    // Date range filter for Gantt
    try {
      const itemDate = new Date(item.start)
      if (isNaN(itemDate.getTime())) {
        return false
      }

      const fromDate = dateRange?.from ? new Date(dateRange.from) : null
      const toDate = dateRange?.to ? new Date(dateRange.to) : null

      if (fromDate) fromDate.setHours(0, 0, 0, 0)
      if (toDate) {
        toDate.setHours(23, 59, 59, 999)
      }

      if (fromDate && itemDate < fromDate) {
        return false
      }
      if (toDate && itemDate > toDate) {
        return false
      }
    } catch (error) {
      console.error("Error filtering by date:", error)
      return false
    }

    return true
  })

  // Filter data for the Hours chart with its own date range
  const filteredHoursData = combinedData.filter((item) => {
    // Store filter (same as Gantt)
    if (selectedStore && selectedStore !== -1 && item.store_id !== selectedStore) {
      return false
    }

    // Confidence threshold filter (same as Gantt)
    if (item.confidence_score < confidenceThreshold) {
      return false
    }

    // Date range filter specifically for Hours chart
    try {
      const itemDate = new Date(item.start)
      if (isNaN(itemDate.getTime())) {
        return false
      }

      const fromDate = hoursDateRange?.from ? new Date(hoursDateRange.from) : null
      const toDate = hoursDateRange?.to ? new Date(hoursDateRange.to) : null

      if (fromDate) fromDate.setHours(0, 0, 0, 0)
      if (toDate) {
        toDate.setHours(23, 59, 59, 999)
      }

      if (fromDate && itemDate < fromDate) {
        return false
      }
      if (toDate && itemDate > toDate) {
        return false
      }
    } catch (error) {
      console.error("Error filtering by date:", error)
      return false
    }

    return true
  })

  const chartDateRange =
    dateRange.from && dateRange.to
      ? {
          from: new Date(dateRange.from),
          to: new Date(dateRange.to),
        }
      : undefined

  const hoursChartDateRange =
    hoursDateRange.from && hoursDateRange.to
      ? {
          from: new Date(hoursDateRange.from),
          to: new Date(hoursDateRange.to),
        }
      : undefined

  return (
    <div className="space-y-6">
      {/* Common filters */}
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
        
        <div className="flex items-center gap-2">
          <span>Schedule Range:</span>
          <DateRangePicker date={dateRange} setDate={setDateRange} />
        </div>
      </div>

      {/* Main Chart */}
      <div className="h-[400px] border rounded-lg p-4">
        {selectedChart === "gantt" && <GanttChart data={filteredGanttData} dateRange={chartDateRange} />}
        {selectedChart === "bar" && <BarChart data={filteredGanttData} />}
        {selectedChart === "line" && <LineChart data={filteredGanttData} />}
      </div>

      {/* Hours Chart Section */}
      <div className="border rounded-lg p-4">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Employee Hours Analysis</h3>
          <div className="flex items-center gap-100">
            <span>Hours Analysis Range:</span>
            <DateRangePicker date={hoursDateRange} setDate={setHoursDateRange} />
          </div>
        </div>
        <div className="h-[300px]">
          <EmployeeHoursChart data={filteredHoursData} dateRange={hoursChartDateRange} />
        </div>
      </div>
    </div>
  )
}