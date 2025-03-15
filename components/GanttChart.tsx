"use client";
import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
interface Profile {
  first_name?: string;
  last_name?: string;
}

interface ShiftData {
  profile_id: number;
  store_id?: number;
  predicted_shift_start: string;
  predicted_shift_end: string;
  confidence_score?: number;
  prediction_date?: string;
  profiles?: Profile[];
}

interface GanttChartProps {
  data: ShiftData[];
  dateRange?: DateRange;
}

export function GanttChart({ data, dateRange }: GanttChartProps) {
  // State for time range view - either daily or show the entire date range
  const [viewMode, setViewMode] = useState<"daily" | "full">("full");

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        No data to display. Try adjusting your filters.
      </div>
    );
  }

  // Get date range boundaries
  const startDate = dateRange?.from ? new Date(dateRange.from) : null;
  const endDate = dateRange?.to ? new Date(dateRange.to) : null;

  // Ensure startDate has time set to midnight
  if (startDate) {
    startDate.setHours(0, 0, 0, 0);
  }

  // Ensure endDate has time set to end of day
  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  // Transform data for the chart
  const chartData = data.map((shift) => {
    const employeeName = shift.profiles?.[0]
      ? `${shift.profiles[0].first_name || ""} ${
          shift.profiles[0].last_name || ""
        }`.trim()
      : `Employee ${shift.profile_id}`;

    const startTime = new Date(shift.predicted_shift_start);
    const endTime = new Date(shift.predicted_shift_end);

    // For daily view: calculate hours since start of day
    const dayStart = new Date(startTime);
    dayStart.setHours(0, 0, 0, 0);

    const startHours =
      (startTime.getTime() - dayStart.getTime()) / (1000 * 60 * 60);
    const endHours =
      (endTime.getTime() - dayStart.getTime()) / (1000 * 60 * 60);
    const duration = endHours - startHours;

    // Format for tooltip
    const durationHours = Math.floor(duration);
    const durationMinutes = Math.floor((duration - durationHours) * 60);
    const durationFormatted = `${durationHours}h ${durationMinutes}m`;

    // Format date for display
    const dateStr = startTime.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    // Calculate days since period start (for full range view)
    const daysSinceStart = startDate
      ? (startTime.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      : 0;

    return {
      profile_id: shift.profile_id,
      employeeName: `${employeeName}`,
      dateLabel: dateStr,
      date: startTime.toISOString().split("T")[0],
      startTime,
      endTime,
      startHours,
      endHours,
      duration,
      durationFormatted,
      confidence: shift.confidence_score || 0.5,
      daysSinceStart,
    };
  });

  // Group shifts by date and employee
  const groupedData = chartData.reduce((acc, shift) => {
    const key = `${shift.date}:${shift.profile_id}`;
    if (!acc[key]) {
      acc[key] = {
        ...shift,
        employeeName: `${shift.employeeName} (${shift.dateLabel})`,
        shifts: [shift],
      };
    } else {
      acc[key].shifts.push(shift);
    }
    return acc;
  }, {} as Record<string, any>);

  // Convert grouped data back to array and sort
  const finalChartData = Object.values(groupedData).sort((a: any, b: any) => {
    // First sort by date
    const dateCompare = a.startTime.getTime() - b.startTime.getTime();
    if (dateCompare !== 0) return dateCompare;

    // Then by employee name
    return a.employeeName.localeCompare(b.employeeName);
  });

  // Set domain based on view mode
  const domainMin = 0;
  const domainMax = 24;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium">View Mode:</div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("daily")}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === "daily"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Daily Hours
          </button>
          <button
            onClick={() => setViewMode("full")}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === "full"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Full Range
          </button>
        </div>
      </div>

      {viewMode === "daily" ? (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={finalChartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
            >
              <XAxis
                type="number"
                domain={[domainMin, domainMax]}
                tickCount={domainMax - domainMin > 7 * 24 ? undefined : 13} // Hide hours if range > 7 days
                tickFormatter={(hour) =>
                  domainMax - domainMin > 7 * 24
                    ? format(new Date(hour), "MMM d")
                    : `${hour}:00`
                }
                label={{
                  value:
                    domainMax - domainMin > 7 * 24 ? "Date" : "Hour of Day",
                  position: "insideBottom",
                  offset: -10,
                }}
              />

              <YAxis type="category" dataKey="employeeName" width={120} />
              <Tooltip
                labelFormatter={(_, payload) => {
                  if (payload && payload[0]) {
                    const item = payload[0].payload;
                    return `${item.employeeName}`;
                  }
                  return "";
                }}
                formatter={(value, name, props) => {
                  if (name === "duration") {
                    const start = props.payload.startTime.toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    );

                    const end = props.payload.endTime.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return [
                      `${start} - ${end} (${props.payload.durationFormatted})`,
                      "Shift Time",
                    ];
                  }
                  if (name === "confidence") {
                    return [
                      `${(value as number).toFixed(2)}`,
                      "Confidence Score",
                    ];
                  }
                  return [value, name];
                }}
              />

              <Bar
                dataKey={() => domainMax - domainMin}
                stackId="background"
                fill="transparent"
                isAnimationActive={false}
                shape={(props) => {
                  const { x, width, height } = props;
                  const bars = [];

                  // Add vertical grid lines for each hour
                  for (
                    let hour = Math.ceil(domainMin);
                    hour <= Math.floor(domainMax);
                    hour++
                  ) {
                    const hourPos =
                      x +
                      (hour - domainMin) * (width / (domainMax - domainMin));
                    bars.push(
                      <line
                        key={`gridline-${hour}`}
                        x1={hourPos}
                        y1={0}
                        x2={hourPos}
                        y2={height * finalChartData.length}
                        stroke="#eee"
                        strokeWidth={1}
                      />
                    );
                  }

                  return <g>{bars}</g>;
                }}
              />

              {/* Bars represent the shifts */}
              <Bar
                dataKey="duration"
                name="Shift Duration"
                shape={(props) => {
                  const { x, y, width, height, fill, payload } = props;

                  // Calculate position on x-axis
                  const barStartX =
                    x +
                    (payload.startHours - domainMin) *
                      (width / (domainMax - domainMin));
                  const barWidth =
                    payload.duration * (width / (domainMax - domainMin));

                  return (
                    <rect
                      x={barStartX}
                      y={y + 2}
                      width={Math.max(barWidth, 8)} // Ensure minimum width for visibility
                      height={height - 4}
                      fill="#8884d8"
                      fillOpacity={payload.confidence}
                      rx={4}
                      stroke="#5151a8"
                      strokeWidth={1}
                    />
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={finalChartData}
              layout="vertical"
              margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
            >
              <XAxis
                type="number"
                domain={[
                  startDate ? 0 : "auto",
                  startDate && endDate
                    ? Math.ceil(
                        (endDate.getTime() - startDate.getTime()) /
                          (24 * 60 * 60 * 1000)
                      )
                    : "auto",
                ]}
                tickFormatter={(value) => {
                  if (!startDate) return value.toFixed(0);
                  const date = new Date(startDate);
                  date.setDate(startDate.getDate() + value); // Add days to startDate
                  return date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  });
                }}
                label={{
                  value: "Date Range",
                  position: "insideBottom",
                  offset: -10,
                }}
              />

              <YAxis type="category" dataKey="employeeName" width={120} />
              <Tooltip
                labelFormatter={(_, payload) => {
                  if (payload && payload[0]) {
                    return payload[0].payload.dateLabel;
                  }
                  return "";
                }}
                formatter={(value, name, props) => {
                  if (name === "daysSinceStart") {
                    const start = props.payload.startTime.toLocaleString([], {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    const end = props.payload.endTime.toLocaleString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return [`${start} - ${end}`, "Shift Time"];
                  }
                  if (name === "confidence") {
                    return [
                      `${(value as number).toFixed(2)}`,
                      "Confidence Score",
                    ];
                  }
                  return [value, name];
                }}
              />

              {/* Bars represent the shifts in the date range */}
              <Bar
                dataKey="daysSinceStart"
                name="Day in Range"
                shape={(props) => {
                  const { x, y, width, height, payload } = props;

                  // Get the total range in days
                  const totalDays =
                    startDate && endDate
                      ? (endDate.getTime() - startDate.getTime()) /
                        (24 * 60 * 60 * 1000)
                      : chartData.length
                      ? Math.ceil(
                          Math.max(...chartData.map((d) => d.daysSinceStart)) +
                            1
                        )
                      : 7;

                  // Calculate bar position and width
                  const barStartX =
                    x + (payload.daysSinceStart * width) / totalDays;

                  // Calculate bar width based on duration in days
                  const durationInDays = payload.duration / 24; // Convert hours to fraction of day
                  const barWidth = (durationInDays * width) / totalDays;

                  return (
                    <rect
                      x={barStartX}
                      y={y + 2}
                      width={Math.max(barWidth, 4)} // Ensure minimum width for visibility
                      height={height - 4}
                      fill="#8884d8"
                      fillOpacity={payload.confidence}
                      rx={4}
                      stroke="#5151a8"
                      strokeWidth={1}
                    />
                  );
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
