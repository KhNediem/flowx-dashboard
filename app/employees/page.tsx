"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { EmployeeList } from "@/components/employee-list"
import ShiftsManagment from "@/components/ShiftsManagment"
import { Button } from "@/components/ui/button"
import { AddShiftModal } from "@/components/add-shift-modal"

export default function EmployeesPage() {
  // Changed initial state to true so ShiftsManagment is shown by default
  const [showShifts, setShowShifts] = useState(true)
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="flex h-14 items-center justify-between border-b px-6">
            <h1 className="text-lg font-semibold">Employees</h1>
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsAddShiftModalOpen(true)} className="bg-white text-black hover:bg-gray-200">
                Add Shift
              </Button>
              <Button onClick={() => setShowShifts(!showShifts)} className="bg-white text-black hover:bg-gray-200">
                {showShifts ? "Employees" : "Manage Shifts"}
              </Button>
            </div>
          </div>
          <div className="p-6">{showShifts ? <ShiftsManagment /> : <EmployeeList />}</div>
        </main>
      </div>

      <AddShiftModal open={isAddShiftModalOpen} onOpenChange={setIsAddShiftModalOpen} />
    </div>
  )
}
