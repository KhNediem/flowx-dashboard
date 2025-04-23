"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { EmployeeScheduling } from "./EmployeeScheduling"
import { SalesForecasting } from "./SalesForecasting"
import { DemandForecasting } from "./DemandForecasting"
import { generatePDF } from "@/lib/pdfGenerator"
import { useRouter } from "next/navigation"
import { CalendarClock, FileText, Package } from "lucide-react"

interface SalesEntry {
  id: number
  product: string
  predicted_sales: number
  date: string
}

export function Dashboard() {
  const [salesData, setSalesData] = useState<SalesEntry[]>([])
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      // Only fetch sales data now
      const { data: fetchedSalesData, error: salesError } = await supabase.from("sales_forecasts").select("*")

      if (salesError) {
        console.error("Error fetching sales data:", salesError)
      } else {
        setSalesData(fetchedSalesData ?? [])
      }
    } catch (error) {
      console.error("Unexpected error fetching data:", error)
    }
  }

  const handleGenerateDocument = () => {
    generatePDF([], salesData)
  }

  const handleManageShifts = () => {
    router.push("/employees") // Navigate to the employees/shifts page
  }

  const handleManageInventory = () => {
    router.push("/inventory") // Navigate to the inventory page
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-3">
        
          <Button onClick={handleManageShifts} variant="outline" className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Manage Shifts
          </Button>
          <Button onClick={handleManageInventory} variant="outline" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Manage Inventory
          </Button>
          <Button onClick={handleGenerateDocument} variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>
      <Tabs defaultValue="employee-scheduling" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employee-scheduling">Employee Scheduling</TabsTrigger>
          <TabsTrigger value="sales-forecasting">Sales Forecasting</TabsTrigger>
          <TabsTrigger value="demand-forecasting">Demand Forecasting</TabsTrigger>
        </TabsList>
        <TabsContent value="employee-scheduling">
          <Card>
            <CardHeader>
              <CardTitle>Employee Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeeScheduling />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sales-forecasting">
          <Card>
            <CardHeader>
              <CardTitle>Sales Forecasting</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesForecasting />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="demand-forecasting">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecasting</CardTitle>
            </CardHeader>
            <CardContent>
              <DemandForecasting />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
