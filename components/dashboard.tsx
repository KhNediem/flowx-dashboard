"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { GanttChart } from "./GanttChart"
import { BarChart } from "./BarChart"

// Static store data
const staticStores = [
  { store_id: 1, store_name: "Downtown Store" },
  { store_id: 2, store_name: "Uptown Store" },
  { store_id: 3, store_name: "Suburban Store" },
  { store_id: 4, store_name: "Mall Store" },
]

export function Dashboard() {
  const [stores, setStores] = useState(staticStores)
  const [selectedStore, setSelectedStore] = useState(null)
  const [confidenceThreshold, setConfidenceThreshold] = useState(0)
  const [selectedChart, setSelectedChart] = useState("gantt")

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchStores()
  }, [])

  async function fetchStores() {
    const { data, error } = await supabase.from("stores").select("store_id, store_name")
    if (error) {
      console.error("Error fetching stores:", error)
    } else {
      console.log("Fetched stores:", data)
      setStores(data && data.length > 0 ? data : staticStores)
    }
  }

  const renderSelectedChart = () => {
    console.log("Rendering chart:", selectedChart)
    switch (selectedChart) {
      case "gantt":
        return <GanttChart confidenceThreshold={confidenceThreshold} selectedStore={selectedStore} />
      case "bar":
        return <BarChart confidenceThreshold={confidenceThreshold} />
      default:
        return <p>Select a chart type</p>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Select
            onValueChange={(value) => {
              console.log("Selected store:", value)
              setSelectedStore(value)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>All Stores</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.store_id} value={store.store_id}>
                  {store.store_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => {
              console.log("Selected chart:", value)
              setSelectedChart(value)
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gantt">Gantt Chart</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <span>Confidence Threshold:</span>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[confidenceThreshold]}
              onValueChange={([value]) => {
                console.log("Confidence threshold changed:", value)
                setConfidenceThreshold(value)
              }}
              className="w-[100px]"
            />
            <span>{confidenceThreshold.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Predicted Shifts Chart</CardTitle>
          </CardHeader>
          <CardContent>{renderSelectedChart()}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Inventory status visualization will be added here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Employee performance metrics will be added here.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Order Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Order trend analysis will be added here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

