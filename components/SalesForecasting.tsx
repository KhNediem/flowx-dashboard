"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { LineChart } from "./charts/LineChart"
import { ScatterPlot } from "./charts/ScatterPlot"
import { TimeSeriesComparison } from "./charts/TimeSeriesComparison"

// Static data
const staticSalesData = [
  { store_id: 1, predicted_sales: 1000, confidence_score: 0.9, prediction_date: "2023-06-01", actual_sales: 980 },
  { store_id: 1, predicted_sales: 1200, confidence_score: 0.85, prediction_date: "2023-06-02", actual_sales: 1150 },
  { store_id: 2, predicted_sales: 800, confidence_score: 0.8, prediction_date: "2023-06-01", actual_sales: 820 },
  { store_id: 2, predicted_sales: 900, confidence_score: 0.75, prediction_date: "2023-06-02", actual_sales: 880 },
  { store_id: 3, predicted_sales: 1500, confidence_score: 0.95, prediction_date: "2023-06-01", actual_sales: 1520 },
  { store_id: 3, predicted_sales: 1600, confidence_score: 0.9, prediction_date: "2023-06-02", actual_sales: 1580 },
]

const staticStores = [
  { store_id: 1, store_name: "Downtown Store" },
  { store_id: 2, store_name: "Uptown Store" },
  { store_id: 3, store_name: "Suburban Store" },
]

export function SalesForecasting() {
  const [salesData, setSalesData] = useState(staticSalesData)
  const [stores, setStores] = useState(staticStores)
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState({ from: new Date(2023, 5, 1), to: new Date(2023, 6, 1) })
  const [selectedChart, setSelectedChart] = useState("line")

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Fetch sales data
    const { data: fetchedSalesData, error: salesError } = await supabase.from("sales_predictions").select("*")
    if (salesError) {
      console.error("Error fetching sales data:", salesError)
    } else {
      setSalesData(fetchedSalesData && fetchedSalesData.length > 0 ? fetchedSalesData : staticSalesData)
    }

    // Fetch store data
    const { data: storeData, error: storeError } = await supabase.from("stores").select("store_id, store_name")
    if (storeError) {
      console.error("Error fetching store data:", storeError)
    } else {
      setStores(storeData && storeData.length > 0 ? storeData : staticStores)
    }
  }

  const filteredData = salesData.filter(
    (sale) =>
      (!selectedStore || sale.store_id === selectedStore) &&
      new Date(sale.prediction_date) >= dateRange.from &&
      new Date(sale.prediction_date) <= dateRange.to,
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select onValueChange={(value) => setSelectedStore(Number(value))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Store" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
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
            <SelectItem value="line">Sales Trends</SelectItem>
            <SelectItem value="scatter">Confidence vs Sales</SelectItem>
            <SelectItem value="comparison">Predicted vs Actual</SelectItem>
          </SelectContent>
        </Select>
        <DateRangePicker date={dateRange} setDate={setDateRange} />
      </div>

      <div className="h-[400px]">
        {selectedChart === "line" && <LineChart data={filteredData} />}
        {selectedChart === "scatter" && <ScatterPlot data={filteredData} />}
        {selectedChart === "comparison" && <TimeSeriesComparison data={filteredData} />}
      </div>
    </div>
  )
}