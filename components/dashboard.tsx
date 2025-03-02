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

export function Dashboard() {
  const [scheduleData, setScheduleData] = useState([])
  const [salesData, setSalesData] = useState([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Fetch scheduling data
    const { data: scheduleData, error: scheduleError } = await supabase.from("schedule_predictions").select(`
        profile_id,
        predicted_shift_start,
        predicted_shift_end,
        profiles (first_name, last_name)
      `)

    if (scheduleError) {
      console.error("Error fetching schedule data:", scheduleError)
    } else {
      setScheduleData(scheduleData || [])
    }

    // Fetch sales data
    const { data: salesData, error: salesError } = await supabase.from("sales_predictions").select("*")

    if (salesError) {
      console.error("Error fetching sales data:", salesError)
    } else {
      setSalesData(salesData || [])
    }
  }

  const handleGenerateDocument = () => {
    generatePDF(scheduleData, salesData)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handleGenerateDocument}>Generate Document</Button>
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
              <EmployeeScheduling data={scheduleData} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sales-forecasting">
          <Card>
            <CardHeader>
              <CardTitle>Sales Forecasting</CardTitle>
            </CardHeader>
            <CardContent>
              <SalesForecasting data={salesData} />
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

