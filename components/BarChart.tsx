"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface ShiftData {
  store_id: number
  predicted_shift_start: string
  confidence_score: number
}

interface BarChartProps {
  confidenceThreshold: number
}

// Static data for when the database is empty
const staticShiftData: ShiftData[] = [
  { store_id: 1, predicted_shift_start: "2023-06-01T09:00:00", confidence_score: 0.9 },
  { store_id: 1, predicted_shift_start: "2023-06-01T10:00:00", confidence_score: 0.8 },
  { store_id: 2, predicted_shift_start: "2023-06-01T12:00:00", confidence_score: 0.7 },
  { store_id: 2, predicted_shift_start: "2023-06-02T09:00:00", confidence_score: 0.85 },
  { store_id: 3, predicted_shift_start: "2023-06-02T11:00:00", confidence_score: 0.75 },
  { store_id: 3, predicted_shift_start: "2023-06-03T10:00:00", confidence_score: 0.95 },
  { store_id: 4, predicted_shift_start: "2023-06-03T12:00:00", confidence_score: 0.8 },
]

export function BarChart({ confidenceThreshold }: BarChartProps) {
  const [shiftData, setShiftData] = useState<ShiftData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const fetchShiftData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from("schedule_predictions")
      .select("store_id, predicted_shift_start, confidence_score")

    if (error) {
      console.error("Error fetching shift data:", error)
      setError("Failed to fetch shift data")
    } else {
      console.log("Fetched shift data:", data)
      setShiftData(data && data.length > 0 ? data : staticShiftData)
    }
    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchShiftData()
  }, [fetchShiftData])

  const prepareChartData = useCallback(() => {
    console.log("Preparing chart data with threshold:", confidenceThreshold)
    const filteredShiftData = shiftData.filter((shift) => shift.confidence_score >= confidenceThreshold)

    const shiftsByStore = filteredShiftData.reduce(
      (acc, shift) => {
        acc[shift.store_id] = (acc[shift.store_id] || 0) + 1
        return acc
      },
      {} as Record<number, number>,
    )

    const preparedData = Object.entries(shiftsByStore).map(([store_id, count]) => ({
      store_id: Number(store_id),
      shiftCount: count,
      averageConfidence:
        filteredShiftData
          .filter((shift) => shift.store_id === Number(store_id))
          .reduce((sum, shift) => sum + shift.confidence_score, 0) / count,
    }))
    console.log("Prepared chart data:", preparedData)
    return preparedData
  }, [shiftData, confidenceThreshold])

  const chartData = prepareChartData()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (chartData.length === 0) return <div>No data available for the selected criteria</div>

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis dataKey="store_id" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="shiftCount" fill="#8884d8" name="Number of Shifts" />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

