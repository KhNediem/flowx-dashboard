"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { EmployeeScheduling } from "./EmployeeScheduling";
import { SalesForecasting } from "./SalesForecasting";
import { DemandForecasting } from "./DemandForecasting";
import { generatePDF } from "@/lib/pdfGenerator";

interface Profile {
  first_name: string;
  last_name: string;
}

interface ScheduleEntry {
  profile_id: number;
  predicted_shift_start: string;
  predicted_shift_end: string;
  profiles: Profile[];
}

interface SalesEntry {
  id: number;
  product: string;
  predicted_sales: number;
  date: string;
}

export function Dashboard() {
  const [scheduleData, setScheduleData] = useState<ScheduleEntry[]>([]);
  const [salesData, setSalesData] = useState<SalesEntry[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch scheduling data
      const { data: fetchedScheduleData, error: scheduleError } = await supabase
        .from("schedules")
        .select("*");

      if (scheduleError) {
        console.error(
          "Error fetching schedule data:",
          scheduleError.message || scheduleError
        );
        return;
      }

      setScheduleData(fetchedScheduleData ?? []);

      const { data: fetchedSalesData, error: salesError } = await supabase
        .from("sales_forecasts")
        .select("*");

      if (salesError) {
        console.error("Error fetching sales data:", salesError);
      } else {
        setSalesData(fetchedSalesData ?? []);
      }
    } catch (error) {
      console.error("Unexpected error fetching data:", error);
    }
  }

  const handleGenerateDocument = () => {
    generatePDF(scheduleData, salesData);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handleGenerateDocument}>Generate Document</Button>
      </div>
      <Tabs defaultValue="employee-scheduling" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employee-scheduling">
            Employee Scheduling
          </TabsTrigger>
          <TabsTrigger value="sales-forecasting">Sales Forecasting</TabsTrigger>
          <TabsTrigger value="demand-forecasting">
            Demand Forecasting
          </TabsTrigger>
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
  );
}
