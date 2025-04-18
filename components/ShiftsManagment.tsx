"use client"

import React, { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function ShiftsManagement() {
  const [shifts, setShifts] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [predictionSchedules, setPredictionSchedules] = useState([])
  const [currentView, setCurrentView] = useState("timeGridWeek")
  const calendarRef = React.useRef(null)
  const supabase = createClientComponentClient()
  const tooltipRefs = React.useRef({})

  // Navigation functions
  const next = () => {
    const calendarApi = calendarRef.current.getApi()
    calendarApi.next()
    setCurrentDate(calendarApi.getDate())
  }

  const previous = () => {
    const calendarApi = calendarRef.current.getApi()
    calendarApi.prev()
    setCurrentDate(calendarApi.getDate())
  }

  const goToToday = () => {
    const calendarApi = calendarRef.current.getApi()
    calendarApi.today()
    setCurrentDate(calendarApi.getDate())
  }

  const changeView = (view) => {
    const calendarApi = calendarRef.current.getApi()
    calendarApi.changeView(view)
    setCurrentView(view)
  }

  // Clean up tooltips when component unmounts
  useEffect(() => {
    return () => {
      // Remove any lingering tooltips when component unmounts
      Object.values(tooltipRefs.current).forEach((tooltip) => {
        if (tooltip && document.body.contains(tooltip)) {
          document.body.removeChild(tooltip)
        }
      })
    }
  }, [])

  // Fetch shifts and employees data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Fetch schedules
        const { data: schedulesData, error: schedulesError } = await supabase.from("schedules").select("*")

        if (schedulesError) {
          console.error("Error fetching schedules:", schedulesError)
        } else {
          setShifts(schedulesData || [])
        }

        // Fetch schedule predictions
        const { data: predictionsData, error: predictionsError } = await supabase
          .from("schedule_predictions")
          .select("*")

        if (predictionsError) {
          console.error("Error fetching schedule predictions:", predictionsError)
        } else {
          setPredictionSchedules(predictionsData || [])
          console.log("Prediction data:", predictionsData)
        }

        // Fetch employees/profiles
        const { data: profilesData, error: profilesError } = await supabase.from("profiles").select("*")

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError)
        } else {
          // Filter out employees with no valid ID
          const validEmployees = (profilesData || []).filter((profile) => profile && profile.profile_id != null)
          setEmployees(validEmployees)
        }
      } catch (error) {
        console.error("Unexpected error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Create calendar events from shifts
  const calendarEvents = [
    // Regular shifts
    ...shifts
      .filter((shift) => !selectedEmployee || shift.profile_id === selectedEmployee)
      .map((shift) => {
        const employee = employees.find((emp) => emp.profile_id === shift.profile_id)
        const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : "Unknown"

        let backgroundColor, textColor, borderColor

        if (shift.schedule_type === "overtime") {
          backgroundColor = "rgba(180, 130, 50, 0.25)"
          borderColor = "rgba(180, 130, 50, 0.6)"
          textColor = "#e0c080"
        } else if (shift.schedule_type === "part-time") {
          backgroundColor = "rgba(70, 150, 130, 0.25)"
          borderColor = "rgba(70, 150, 130, 0.6)"
          textColor = "#80d0c0"
        } else {
          backgroundColor = "rgba(80, 120, 180, 0.25)"
          borderColor = "rgba(80, 120, 180, 0.6)"
          textColor = "#90b0e0"
        }

        return {
          id: shift.schedule_id,
          title: `${employeeName} - ${shift.schedule_type || "Shift"}`,
          start: shift.shift_start,
          end: shift.shift_end,
          backgroundColor,
          borderColor,
          textColor,
          extendedProps: {
            status: shift.status,
            type: shift.schedule_type || "regular",
            profileId: shift.profile_id,
            description: shift.description || "",
            location: shift.location || "",
            isPrediction: false,
          },
        }
      }),

    // Prediction shifts (with different styling)
    ...predictionSchedules
      .filter((prediction) => !selectedEmployee || prediction.profile_id === selectedEmployee)
      .map((prediction) => {
        const employee = employees.find((emp) => emp.profile_id === prediction.profile_id)
        const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : "Unknown"

        // Use a distinct style for predictions - dashed border and different opacity
        const backgroundColor = "rgba(90, 50, 160, 0.15)" // Subtle purple for predictions
        const borderColor = "rgba(90, 50, 160, 0.5)"
        const textColor = "#b090e0"

        // Fix: Use the correct field names from your prediction data
        return {
          id: `prediction-${prediction.prediction_id}`,
          title: `${employeeName} - Predicted`,
          start: prediction.predicted_shift_start || prediction.predicted_start,
          end: prediction.predicted_shift_end || prediction.predicted_end,
          backgroundColor,
          borderColor,
          textColor,
          dashed: true, // We'll use this for custom rendering
          extendedProps: {
            confidenceScore: prediction.confidence_score,
            predictedType: prediction.predicted_type,
            profileId: prediction.profile_id,
            basedOn: prediction.based_on_data || "Historical patterns",
            isPrediction: true,
          },
        }
      }),
  ]

  // Log the generated calendar events for debugging
  useEffect(() => {
    if (predictionSchedules.length > 0) {
      console.log("Prediction schedules:", predictionSchedules)
    }
  }, [predictionSchedules])

  // Handle calendar date click (for creating new shifts)
  const handleDateClick = (info) => {
    console.log("Date clicked:", info.date)
    // Here you could open a modal to create a new shift
  }

  // Handle event click (for editing shifts)
  const handleEventClick = (info) => {
    console.log("Event clicked:", info.event)
    // Here you could open a modal to edit the shift
  }

  // Generate view title based on current view
  const getViewTitle = () => {
    if (!calendarRef.current) return ""

    const calendarApi = calendarRef.current.getApi()
    const viewRange = calendarApi.currentData.dateProfile.currentRange

    if (currentView === "timeGridDay") {
      return format(viewRange.start, "EEEE, MMMM d, yyyy")
    } else {
      return `${format(viewRange.start, "MMMM d")} - ${format(viewRange.end, "MMMM d, yyyy")}`
    }
  }

  // Create a more reliable tooltip
  const createTooltip = (eventEl, event) => {
    const props = event.extendedProps
    const eventId = event.id

    // Remove existing tooltip if it exists
    if (tooltipRefs.current[eventId] && document.body.contains(tooltipRefs.current[eventId])) {
      document.body.removeChild(tooltipRefs.current[eventId])
    }

    // Create tooltip content based on event type
    let tooltipContent = ""

    if (props.isPrediction) {
      // Prediction event tooltip
      tooltipContent = `
        <div class="p-3 max-w-xs bg-zinc-800 rounded-md shadow-lg text-zinc-200 text-xs border border-zinc-700">
          <div class="font-bold mb-1 text-sm">${event.title}</div>
          <div class="mb-1">Confidence: ${(props.confidenceScore * 100).toFixed(1)}%</div>
          <div class="mb-1">Type: ${props.predictedType || "Regular"}</div>
          <div class="text-zinc-400 text-xs">Based on: ${props.basedOn}</div>
          <div class="text-amber-300 text-xs mt-1">⚠️ AI Predicted Shift</div>
        </div>
      `
    } else {
      // Regular shift tooltip
      tooltipContent = `
        <div class="p-3 max-w-xs bg-zinc-800 rounded-md shadow-lg text-zinc-200 text-xs border border-zinc-700">
          <div class="font-bold mb-1 text-sm">${event.title}</div>
          <div class="mb-1">Time: ${event.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${event.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          ${props.location ? `<div class="mb-1">Location: ${props.location}</div>` : ""}
          ${props.status ? `<div>Status: ${props.status}</div>` : ""}
          ${props.description ? `<div class="mt-1 text-zinc-400">${props.description}</div>` : ""}
        </div>
      `
    }

    // Create tooltip element
    const tooltip = document.createElement("div")
    tooltip.innerHTML = tooltipContent
    tooltip.className = "fixed z-[9999] hidden shadow-xl"
    tooltip.style.pointerEvents = "none" // Prevent tooltip from blocking mouse events
    document.body.appendChild(tooltip)

    // Store reference to tooltip
    tooltipRefs.current[eventId] = tooltip

    return tooltip
  }

  // Position tooltip relative to event
  const positionTooltip = (tooltip, eventEl) => {
    const rect = eventEl.getBoundingClientRect()
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft

    // Position to the right of the event by default
    let left = rect.right + 10 + scrollLeft
    let top = rect.top + scrollTop

    // Check if tooltip would go off the right edge of the screen
    const tooltipRect = tooltip.getBoundingClientRect()
    if (left + tooltipRect.width > window.innerWidth) {
      // Position to the left of the event instead
      left = rect.left - tooltipRect.width - 10 + scrollLeft
    }

    // Check if tooltip would go off the bottom of the screen
    if (top + tooltipRect.height > window.innerHeight + scrollTop) {
      // Adjust top position to keep tooltip within viewport
      top = window.innerHeight + scrollTop - tooltipRect.height - 10
    }

    tooltip.style.left = `${left}px`
    tooltip.style.top = `${top}px`
  }

  return (
    <div className="dark h-full">
      <TooltipProvider>
        <Card className="w-full border-zinc-800 bg-transparent shadow-md h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-zinc-800">
            <CardTitle className="text-xl font-bold text-zinc-100">Shifts Management</CardTitle>
            <div className="flex space-x-2">
              <div className="flex mr-4 space-x-1">
                <Button
                  variant={currentView === "timeGridDay" ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeView("timeGridDay")}
                  className={
                    currentView === "timeGridDay"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                  }
                >
                  Day
                </Button>
                <Button
                  variant={currentView === "timeGridWeek" ? "default" : "outline"}
                  size="sm"
                  onClick={() => changeView("timeGridWeek")}
                  className={
                    currentView === "timeGridWeek"
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                  }
                >
                  Week
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={previous}
                className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {currentView === "timeGridDay" ? "Previous Day" : "Previous Week"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={next}
                className="border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
              >
                {currentView === "timeGridDay" ? "Next Day" : "Next Week"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 h-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-zinc-200">{calendarRef.current ? getViewTitle() : ""}</h2>
              <Select
                value={selectedEmployee ? selectedEmployee.toString() : "all"}
                onValueChange={(value) => setSelectedEmployee(value === "all" ? null : Number.parseInt(value))}
              >
                <SelectTrigger className="w-[200px] border-zinc-700 bg-zinc-900 text-zinc-300">
                  <SelectValue placeholder="Filter by employee" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  <SelectItem value="all" className="text-zinc-300">
                    All Employees
                  </SelectItem>
                  {employees.map((employee) => (
                    <SelectItem
                      key={employee.profile_id}
                      value={employee.profile_id.toString()}
                      className="text-zinc-300"
                    >
                      {`${employee.first_name || ""} ${employee.last_name || ""}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-[calc(100vh-180px)] text-zinc-400">
                <div className="animate-pulse">Loading calendar...</div>
              </div>
            ) : (
              <div className="h-[calc(100vh-180px)]">
                <style jsx global>{`
                  .fc {
                    height: 100% !important;
                  }
                  
                  .fc-view-harness {
                    height: calc(100% - 1px) !important;
                  }
                  
                  .fc-timegrid-body, .fc-timegrid-body table, .fc-timegrid-body .fc-timegrid-cols,
                  .fc-timegrid-body .fc-timegrid-cols > table {
                    height: 100% !important;
                  }

                  .calendar-dark .fc {
                    --fc-border-color: rgba(82, 82, 91, 0.5);
                    --fc-page-bg-color: transparent;
                    --fc-neutral-bg-color: #18181b;
                    --fc-neutral-text-color: #a1a1aa;
                    --fc-today-bg-color: rgba(59, 130, 246, 0.08);
                    --fc-now-indicator-color: rgba(239, 68, 68, 0.7);
                    --fc-highlight-color: rgba(59, 130, 246, 0.1);
                  }
                  
                  .calendar-dark .fc-timegrid-slot {
                    height: auto !important;
                  }
                  
                  .calendar-dark .fc-col-header-cell {
                    padding: 4px 0;
                    background-color: rgba(24, 24, 27, 0.6);
                  }
                  
                  .calendar-dark .fc-col-header-cell-cushion {
                    color: #e4e4e7;
                    font-weight: 500;
                    padding: 4px;
                    font-size: 0.85rem;
                  }
                  
                  .calendar-dark .fc-timegrid-slot-label {
                    color: #a1a1aa;
                    font-size: 0.75rem;
                  }
                  
                  /* Add margin between events */
                  .calendar-dark .fc-event {
                    border-radius: 4px;
                    padding: 1px 3px;
                    font-size: 0.8rem;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                    margin: 1px 2px !important;
                  }
                  
                  .calendar-dark .fc-event-title {
                    font-weight: 500;
                  }
                  
                  .calendar-dark .fc-event-time {
                    font-size: 0.7rem;
                    opacity: 0.9;
                  }
                  
                  .calendar-dark .fc-timegrid-now-indicator-line {
                    border-width: 1px;
                  }
                  
                  .calendar-dark .fc-timegrid-now-indicator-arrow {
                    border-width: 3px;
                  }
                  
                  .calendar-dark .fc-day-today {
                    background-color: rgba(59, 130, 246, 0.05) !important;
                  }
                  
                  /* Styles for vertical text */
                  .event-container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    width: 100%;
                    overflow: hidden;
                    padding: 1px;
                  }
                  
                  .vertical-text {
                    display: flex;
                    flex-direction: column;
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                    transform: rotate(0deg);
                    height: 100%;
                    padding: 2px;
                    overflow: hidden;
                  }
                  
                  /* Fix for FullCalendar in dark mode */
                  .fc-theme-standard .fc-scrollgrid {
                    border-color: var(--fc-border-color);
                  }
                  
                  .fc-scrollgrid-section-header>th {
                    border-color: var(--fc-border-color);
                  }
                  
                  /* Make sure vertical slots fill the available height */
                  .fc-timegrid-slots td {
                    height: 1.5em;
                  }
                  
                  /* Improve time slot visibility */
                  .fc-timegrid-slot-label-cushion {
                    font-size: 0.75rem;
                  }
                  
                  /* Handle slot heights more efficiently */
                  .fc-timegrid-slot {
                    min-height: 20px;
                  }
                  
                  /* Prediction event styling - dashed border */
                  .prediction-event {
                    border-style: dashed !important;
                    border-width: 1px !important;
                  }
                  
                  /* Prevent events from overlapping */
                  .fc-timegrid-event-harness {
                    margin-left: 1px !important;
                    margin-right: 1px !important;
                  }
                  
                  /* Custom tooltip styling */
                  .shift-tooltip {
                    position: fixed;
                    z-index: 9999;
                    background-color: #27272a;
                    border: 1px solid #3f3f46;
                    border-radius: 6px;
                    padding: 8px;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    pointer-events: none;
                  }
                `}</style>
                <div className="calendar-dark h-full">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[timeGridPlugin, interactionPlugin]}
                    initialView={currentView}
                    headerToolbar={false} // Hide default header
                    allDaySlot={false}
                    slotMinTime="07:00:00"
                    slotMaxTime="22:00:00"
                    slotDuration="00:30:00"
                    weekends={true}
                    events={calendarEvents}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    initialDate={currentDate}
                    height="100%"
                    nowIndicator={true}
                    stickyHeaderDates={true}
                    stickyFooterScrollbar={true}
                    slotEventOverlap={false}
                    eventTimeFormat={{
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    }}
                    dayHeaderFormat={{
                      weekday: currentView === "timeGridDay" ? "long" : "short",
                      month: "numeric",
                      day: "numeric",
                      omitCommas: true,
                    }}
                    eventDidMount={(info) => {
                      // Add dashed border for prediction events
                      if (info.event.extendedProps.isPrediction) {
                        info.el.classList.add("prediction-event")
                      }

                      // Improved tooltip implementation
                      const eventEl = info.el
                      const event = info.event

                      // Create tooltip when mouse enters event
                      eventEl.addEventListener("mouseenter", () => {
                        const tooltip = createTooltip(eventEl, event)
                        tooltip.classList.remove("hidden")
                        positionTooltip(tooltip, eventEl)

                        // Update tooltip position on scroll
                        const handleScroll = () => {
                          if (!tooltip.classList.contains("hidden")) {
                            positionTooltip(tooltip, eventEl)
                          }
                        }

                        window.addEventListener("scroll", handleScroll)

                        // Clean up scroll listener when mouse leaves
                        eventEl.addEventListener(
                          "mouseleave",
                          () => {
                            window.removeEventListener("scroll", handleScroll)
                            tooltip.classList.add("hidden")
                          },
                          { once: true },
                        )
                      })
                    }}
                    eventContent={(eventInfo) => {
                      const eventEl = document.createElement("div")
                      eventEl.className = "event-container"

                      // Calculate if we need vertical text based on event duration and title length
                      const durationInMinutes = (eventInfo.event.end - eventInfo.event.start) / (1000 * 60)
                      const title = eventInfo.event.title

                      // Define a threshold - if the event is short or the title is long, use vertical text
                      const needsVerticalText = durationInMinutes < 60 || title.length > 15

                      if (needsVerticalText) {
                        // Vertical layout
                        const verticalDiv = document.createElement("div")
                        verticalDiv.className = "vertical-text"

                        const timeDiv = document.createElement("div")
                        timeDiv.className = "text-xs font-medium"
                        timeDiv.innerText = eventInfo.timeText

                        const titleDiv = document.createElement("div")
                        titleDiv.className = "text-xs font-medium mt-1"
                        titleDiv.innerText = title

                        // Add prediction indicator if applicable
                        if (eventInfo.event.extendedProps.isPrediction) {
                          const indicatorDiv = document.createElement("div")
                          indicatorDiv.className = "text-xs mt-1"
                          indicatorDiv.innerText = "(Predicted)"
                          verticalDiv.appendChild(indicatorDiv)
                        }

                        verticalDiv.appendChild(timeDiv)
                        verticalDiv.appendChild(titleDiv)
                        eventEl.appendChild(verticalDiv)
                      } else {
                        // Horizontal layout (original)
                        const timeDiv = document.createElement("div")
                        timeDiv.className = "text-xs opacity-90"
                        timeDiv.innerText = eventInfo.timeText

                        const titleDiv = document.createElement("div")
                        titleDiv.className = "text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis"
                        titleDiv.innerText = title

                        // Add prediction badge if applicable
                        if (eventInfo.event.extendedProps.isPrediction) {
                          const badgeDiv = document.createElement("div")
                          badgeDiv.className = "text-xs text-purple-300 mt-1"
                          badgeDiv.innerText = "Predicted"
                          eventEl.appendChild(badgeDiv)
                        }

                        eventEl.appendChild(timeDiv)
                        eventEl.appendChild(titleDiv)
                      }

                      return { domNodes: [eventEl] }
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  )
}
