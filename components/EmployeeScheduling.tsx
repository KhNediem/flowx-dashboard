"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { GanttChart } from "./charts/GanttChart"
import { BarChart } from "./charts/BarChart"
import { LineChart } from "./charts/LineChart"

// Static data
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

export function EmployeeScheduling() {
  const [shiftData, setShiftData] = useState(staticShiftData)
  const [stores, setStores] = useState(staticStores)
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0)
  const [dateRange, setDateRange] = useState({ from: new Date(2023, 5, 1), to: new Date(2023, 6, 1) })
  const [selectedChart, setSelectedChart] = useState("gantt")

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Fetch shift data
    const { data: shiftData, error: shiftError } = await supabase.from("schedule_predictions").select("*")
    if (shiftError) {
      console.error("Error fetching shift data:", shiftError)
    } else {
      setShiftData(shiftData && shiftData.length > 0 ? shiftData : staticShiftData)
    }

    // Fetch store data
    const { data: storeData, error: storeError } = await supabase.from("stores").select("store_id, store_name")
    if (storeError) {
      console.error("Error fetching store data:", storeError)
    } else {
      setStores(storeData && storeData.length > 0 ? storeData : staticStores)
    }
  }

  const filteredData = shiftData.filter(
    (shift) =>
      (!selectedStore || shift.store_id === selectedStore) &&
      shift.confidence_score >= confidenceThreshold &&
      new Date(shift.predicted_shift_start) >= dateRange.from &&
      new Date(shift.predicted_shift_start) <= dateRange.to,
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
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
        <Select onValueChange={(value) => setSelectedChart(value)}>
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
          <span>Confidence Threshold:</span>
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

      <div className="h-[400px]">
        {selectedChart === "gantt" && <GanttChart data={filteredData} />}
        {selectedChart === "bar" && <BarChart data={filteredData} />}
        {selectedChart === "line" && <LineChart data={filteredData} />}
      </div>
    </div>
  )
}

