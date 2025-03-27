"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

interface DateRangePickerProps {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({ date, setDate, className }: DateRangePickerProps) {
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

  // This function properly handles the date range selection
  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      return setDate(undefined)
    }

    // If no date is selected yet or both dates are already selected, start a new selection
    if (!date?.from || (date.from && date.to)) {
      setDate({
        from: selectedDate,
        to: undefined,
      })
      return
    }

    // If we already have a start date but no end date
    if (date.from && !date.to) {
      // Don't allow end date to be before start date
      if (selectedDate < date.from) {
        setDate({
          from: selectedDate,
          to: date.from,
        })
      } else {
        setDate({
          from: date.from,
          to: selectedDate,
        })
      }

      // Close the calendar after selecting the end date
      setIsCalendarOpen(false)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn("w-[280px] justify-start text-left font-normal", !date?.from && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, yyyy")} - {format(date.to, "LLL dd, yyyy")}
                </>
              ) : (
                format(date.from, "LLL dd, yyyy")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="single"
            defaultMonth={date?.from}
            selected={date?.to || date?.from}
            onSelect={handleSelect}
            numberOfMonths={2}
          />

          {/* Show instructions */}
          <div className="p-3 border-t text-center text-sm text-muted-foreground">
            {!date?.from ? "Select start date" : !date?.to ? "Select end date" : "Date range selected"}
          </div>

          {/* Reset button */}
          {(date?.from || date?.to) && (
            <div className="p-3 border-t text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDate(undefined)
                }}
              >
                Reset
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

