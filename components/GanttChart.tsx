"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface ShiftData {
  profile_id: number
  predicted_shift_start: string
  predicted_shift_end: string
  confidence_score: number
}

interface GanttChartProps {
  confidenceThreshold: number
  selectedStore: number | null
}

// Static data for when the database is empty
const staticShiftData: ShiftData[] = [
  {
    profile_id: 1,
    predicted_shift_start: "2023-06-01T09:00:00",
    predicted_shift_end: "2023-06-01T17:00:00",
    confidence_score: 0.9,
  },
  {
    profile_id: 2,
    predicted_shift_start: "2023-06-01T10:00:00",
    predicted_shift_end: "2023-06-01T18:00:00",
    confidence_score: 0.8,
  },
  {
    profile_id: 3,
    predicted_shift_start: "2023-06-01T12:00:00",
    predicted_shift_end: "2023-06-01T20:00:00",
    confidence_score: 0.7,
  },
  {
    profile_id: 4,
    predicted_shift_start: "2023-06-02T09:00:00",
    predicted_shift_end: "2023-06-02T17:00:00",
    confidence_score: 0.85,
  },
  {
    profile_id: 5,
    predicted_shift_start: "2023-06-02T11:00:00",
    predicted_shift_end: "2023-06-02T19:00:00",
    confidence_score: 0.75,
  },
]

export function GanttChart({ confidenceThreshold, selectedStore }: GanttChartProps) {
  const [shiftData, setShiftData] = useState<ShiftData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const fetchShiftData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    let query = supabase
      .from("schedule_predictions")
      .select("profile_id, predicted_shift_start, predicted_shift_end, confidence_score")

    if (selectedStore !== null) {
      query = query.eq("store_id", selectedStore)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching shift data:", error)
      setError("Failed to fetch shift data")
    } else {
      console.log("Fetched shift data:", data)
      setShiftData(data && data.length > 0 ? data : staticShiftData)
    }
    setIsLoading(false)
  }, [supabase, selectedStore])

  useEffect(() => {
    fetchShiftData()
  }, [fetchShiftData])

  const prepareChartData = useCallback(() => {
    console.log("Preparing chart data with threshold:", confidenceThreshold)
    const filteredData = shiftData
      .filter((shift) => shift.confidence_score >= confidenceThreshold)
      .map((shift) => ({
        profile_id: shift.profile_id,
        start: new Date(shift.predicted_shift_start).getTime(),
        end: new Date(shift.predicted_shift_end).getTime(),
        duration: new Date(shift.predicted_shift_end).getTime() - new Date(shift.predicted_shift_start).getTime(),
        confidence_score: shift.confidence_score,
      }))
      .sort((a, b) => a.start - b.start)
    console.log("Filtered and prepared data:", filteredData)
    return filteredData
  }, [shiftData, confidenceThreshold])

  const chartData = prepareChartData()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (chartData.length === 0) return <div>No data available for the selected criteria</div>

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis
          type="number"
          dataKey="start"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString()}
        />
        <YAxis type="category" dataKey="profile_id" />
        <Tooltip
          labelFormatter={(value) => `Start: ${new Date(value).toLocaleString()}`}
          formatter={(value, name, props) => {
            if (name === "duration") {
              const hours = Math.floor(value / 3600000)
              const minutes = Math.floor((value % 3600000) / 60000)
              return [`${hours}h ${minutes}m`, "Duration"]
            }
            return [value, name]
          }}
        />
        <Bar dataKey="duration" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}

