"use client";

import type React from "react";
import { useRef, useEffect, useState } from "react";
import { format, eachDayOfInterval, addHours } from "date-fns";

interface ShiftData {
  schedule_id?: number;
  id?: number;
  profile_id: number;
  store_id: number;
  shift_start?: string;
  shift_end?: string;
  start?: string;
  end?: string;
  type?: string;
  confidence_score?: number;
  // Additional fields for tooltip
  employee_name?: string;
  position?: string;
  department?: string;
  notes?: string;
  prediction_date?: string;
}

interface TooltipData {
  visible: boolean;
  x: number;
  y: number;
  content: React.ReactNode;
}

export function GanttChart({
  data,
  dateRange,
}: {
  data: ShiftData[];
  dateRange?: { from: Date; to: Date };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  if (!data || data.length === 0) {
    return (
      <div
        ref={containerRef}
        className="h-96 w-full flex items-center justify-center text-muted-foreground"
      >
        No data to display. Try adjusting your filters.
      </div>
    );
  }

  // Calculate date range
  let minDate: Date, maxDate: Date;

  if (dateRange?.from && dateRange?.to) {
    // Create new Date objects to avoid mutation
    minDate = new Date(dateRange.from);
    maxDate = new Date(dateRange.to);
  } else {
    // Auto-calculate from data
    const allDates = data.flatMap((shift) => [
      new Date(shift.shift_start || shift.start || ""),
      new Date(shift.shift_end || shift.end || ""),
    ]);
    minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
    maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
    minDate.setDate(minDate.getDate() - 1);
    maxDate.setDate(maxDate.getDate() + 1);
  }

  // Ensure proper date objects and set to beginning/end of day
  minDate.setHours(0, 0, 0, 0);
  maxDate.setHours(23, 59, 59, 999);

  // Process shifts
  const processedShifts = data.map((shift) => {
    const startTime = new Date(shift.shift_start || shift.start || "");
    const endTime = new Date(shift.shift_end || shift.end || "");
    const uniqueId = shift.schedule_id || shift.id;

    return {
      ...shift,
      uniqueId,
      startTime,
      endTime,
      employeeName: shift.employee_name || `Employee ${shift.profile_id}`,
      isPrediction: shift.type === "predicted",
    };
  });

  // Group shifts by employee
  const employeeGroups: Record<string, any[]> = {};
  processedShifts.forEach((shift) => {
    const employeeName = shift.employeeName;
    if (!employeeGroups[employeeName]) {
      employeeGroups[employeeName] = [];
    }
    employeeGroups[employeeName].push(shift);
  });

  // Sort employees by ID
  const employees = Object.keys(employeeGroups).sort((a, b) => {
    // If using real names, sort alphabetically
    if (!a.startsWith("Employee") || !b.startsWith("Employee")) {
      return a.localeCompare(b);
    }
    // Otherwise sort by ID
    const idA = Number.parseInt(a.split(" ")[1]);
    const idB = Number.parseInt(b.split(" ")[1]);
    return idA - idB;
  });

  // Chart constants
  const margin = { top: 20, right: 30, left: 100, bottom: 60 };
  const rowHeight = 40;
  const chartWidth = dimensions.width - margin.left - margin.right;
  const chartHeight = employees.length * rowHeight;

  // Calculate time scale
  const timeRange = maxDate.getTime() - minDate.getTime();
  const pixelsPerMs = chartWidth / timeRange;

  // Generate day markers for the ENTIRE date range using date-fns
  const days = eachDayOfInterval({ start: minDate, end: maxDate });

  const hourMarkers = [];
  for (const day of days) {
    for (let hour = 0; hour < 24; hour += 4) {
      hourMarkers.push(addHours(day, hour));
    }
  }

  const totalDays = days.length;
  let tickInterval = 1; 

  if (totalDays > 14) {
    tickInterval = Math.ceil(totalDays / 14); 
  }

  const tickDays = days.filter((_, index) => index % tickInterval === 0);

  // Different colors for predicted and actual shifts
  const shiftColors: Record<string, { fill: string; stroke: string }> = {
    predicted: {
      fill: "#10b981", // Green
      stroke: "#047857",
    },
    actual: {
      fill: "#4f46e5", // Blue
      stroke: "#3730a3",
    },
  };

  // Store colors as a fallback
  const storeColors: Record<number, { fill: string; stroke: string }> = {
    1: {
      fill: "#4f46e5",
      stroke: "#3730a3",
    },
    2: {
      fill: "#10b981", 
      stroke: "#047857",
    },
  };

  // Default colors
  const defaultColors = {
    fill: "#6b7280", // Gray
    stroke: "#4b5563",
  };

  // Helper function to get x position from date
  const getXPosition = (date: Date) => {
    return (date.getTime() - minDate.getTime()) * pixelsPerMs;
  };

  // Handle shift hover with enhanced tooltip
  const handleShiftHover = (e: React.MouseEvent, shift: any) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const startTime = shift.startTime;
    const endTime = shift.endTime;
    const startTimeStr = format(startTime, "h:mm a");
    const endTimeStr = format(endTime, "h:mm a");
    const dateStr = format(startTime, "EEE, MMM d, yyyy");

    // Calculate duration
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const durationHours = Math.floor(duration);
    const durationMinutes = Math.floor((duration - durationHours) * 60);
    const durationFormatted = `${durationHours}h ${durationMinutes}m`;

    setTooltip({
      visible: true,
      x: rect.left + window.scrollX, 
      y: rect.top + window.scrollY,
      content: (
        <div className="bg-white p-3 rounded-md shadow-md border border-gray-200 max-w-xs">
          <p className="text-black font-semibold mb-1">
            {shift.employeeName}
          </p>
          <div className="grid grid-cols-2 gap-x-2 text-sm">
            <p className="text-black">Date:</p>
            <p className="text-black">{dateStr}</p>

            <p className="text-black">Time:</p>
            <p className="text-black">
              {startTimeStr} - {endTimeStr}
            </p>

            <p className="text-black">Duration:</p>
            <p className="text-black">{durationFormatted}</p>

            <p className="text-black">Type:</p>
            <p className="text-black">{shift.isPrediction ? "Predicted" : "Actual"}</p>

            {shift.isPrediction && (
              <>
                <p className="text-black">Confidence:</p>
                <p className="text-black">{(shift.confidence_score * 100).toFixed(0)}%</p>
                
                {shift.prediction_date && (
                  <>
                    <p className="text-black">Prediction Date:</p>
                    <p className="text-black">{shift.prediction_date}</p>
                  </>
                )}
              </>
            )}
          </div>

          {shift.notes && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-black text-sm">Notes:</p>
              <p className="text-black text-sm">{shift.notes}</p>
            </div>
          )}
        </div>
      ),
    });
  };

  const handleShiftLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  return (
    <div ref={containerRef} className="h-96 w-full relative">
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${dimensions.width} ${
          chartHeight + margin.top + margin.bottom
        }`}
      >
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Y-axis (employee names) */}
          {employees.map((employee, index) => (
            <text
              key={`employee-${index}`}
              x={-10}
              y={index * rowHeight + rowHeight / 2}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={14}
              fill="currentColor"
            >
              {employee}
            </text>
          ))}

          {/* X-axis (days) */}
          {days.map((day, index) => (
            <g key={`day-${index}`}>
              {/* Vertical grid line */}
              <line
                x1={getXPosition(day)}
                y1={0}
                x2={getXPosition(day)}
                y2={chartHeight}
                stroke="#e5e7eb"
                strokeWidth={0.5}
              />

              {/* Day label - only show for tick days */}
              {tickDays.includes(day) && (
                <text
                  x={getXPosition(day)}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize={12}
                  fill="currentColor"
                >
                  {format(day, "MMM d")}
                </text>
              )}
            </g>
          ))}

          {/* X-axis (hours) - Only show if range is 7 days or less */}
          {days.length <= 7 &&
            hourMarkers.map((hour, index) => {
              const isStartOfDay = hour.getHours() === 0;
              return (
                <g key={`hour-${index}`}>
                  {/* Vertical grid line for hours (lighter than days) */}
                  <line
                    x1={getXPosition(hour)}
                    y1={0}
                    x2={getXPosition(hour)}
                    y2={chartHeight}
                    stroke={isStartOfDay ? "#e5e7eb" : "#f3f4f6"}
                    strokeWidth={isStartOfDay ? 0.5 : 0.25}
                    strokeDasharray={isStartOfDay ? "none" : "2,2"}
                  />

                  {/* Hour label */}
                  <text
                    x={getXPosition(hour)}
                    y={chartHeight + 40}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#6b7280"
                  >
                    {format(hour, "ha")}
                  </text>
                </g>
              );
            })}

          {/* Timeline label */}
          <text
            x={chartWidth / 2}
            y={chartHeight + 55}
            textAnchor="middle"
            fontSize={14}
            fill="currentColor"
          >
            Schedule Timeline
          </text>

          {/* Shifts */}
          {employees.map((employee, employeeIndex) =>
            employeeGroups[employee].map((shift, shiftIndex) => {
              const startX = getXPosition(shift.startTime);
              const endX = getXPosition(shift.endTime);
              const width = Math.max(2, endX - startX);
              const y = employeeIndex * rowHeight + rowHeight * 0.2;
              const height = rowHeight * 0.6;

              // Choose color based on shift type
              const colorKey = shift.isPrediction ? "predicted" : "actual";
              const colorSet = shiftColors[colorKey];

              return (
                <rect
                  key={`shift-${shift.uniqueId}-${shiftIndex}`}
                  x={startX}
                  y={y}
                  width={width}
                  height={height}
                  rx={4}
                  fill={colorSet.fill}
                  fillOpacity={0.8}
                  stroke={colorSet.stroke}
                  strokeWidth={1}
                  className="cursor-pointer hover:opacity-90 transition-opacity"
                  onMouseEnter={(e) => handleShiftHover(e, shift)}
                  onMouseLeave={handleShiftLeave}
                />
              );
            })
          )}
        </g>
      </svg>

      {tooltip.visible && (
        <div
          className="absolute z-10 pointer-events-none"
          style={{
            left: `${tooltip.x -250}px`,
            top: `${tooltip.y - 250}px`, 
          }}
        >
          {tooltip.content}
        </div>
      )}

      <div className="flex justify-center gap-4 mt-2">
        <div className="flex items-center">
          <div
            className="w-4 h-4 mr-2 rounded"
            style={{ backgroundColor: shiftColors.actual.fill }}
          ></div>
          <span className="text-sm">Actual Shifts</span>
        </div>
        <div className="flex items-center">
          <div
            className="w-4 h-4 mr-2 rounded"
            style={{ backgroundColor: shiftColors.predicted.fill }}
          ></div>
          <span className="text-sm">Predicted Shifts</span>
        </div>
      </div>
    </div>
  );
}