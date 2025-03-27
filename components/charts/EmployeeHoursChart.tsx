"use client";

import React from "react";
import { Bar } from "recharts";
import { BarChart as RechartsBarChart, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface HoursChartProps {
  data: any[];
  dateRange?: { from: Date; to: Date };
}

export function EmployeeHoursChart({ data, dateRange }: HoursChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
        No data to display. Try adjusting your filters.
      </div>
    );
  }

  const employeeHours: Record<string, { actual: number }> = {};

  data.forEach((shift) => {
    const employeeName = `Employee ${shift.profile_id}`;
    if (!employeeHours[employeeName]) {
      employeeHours[employeeName] = { actual: 0 };
    }

    // Only process actual hours, ignore predicted
    if (shift.type === "actual") {
      const startTime = new Date(shift.start);
      const endTime = new Date(shift.end);
      const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      employeeHours[employeeName].actual += durationHours;
    }
  });

  // Convert to chart data format - now only with actual hours
  const chartData = Object.entries(employeeHours).map(([employee, hours]) => ({
    name: employee,
    actual: parseFloat(hours.actual.toFixed(2)),
  }));

  // Sort by employee ID
  chartData.sort((a, b) => {
    const idA = parseInt(a.name.split(" ")[1]);
    const idB = parseInt(b.name.split(" ")[1]);
    return idA - idB;
  });

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%" >
        <RechartsBarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
        >
          <XAxis 
            dataKey="name"
            tick={{ fontSize: 12 ,fill: "#ffffff"}}
            height={70}
          />
          <YAxis
            label={{
              value: 'Hours',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
          <Tooltip
            formatter={(value) => [`${value} hours`, "working hours"]}
          />
          <Legend />
          <Bar dataKey="actual" name="working hours" fill="#4f46e5" />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}