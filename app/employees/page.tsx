"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { EmployeeList } from "@/components/employee-list";
import ShiftsManagment from "@/components/ShiftsManagment";
import { Button } from "@/components/ui/button";

export default function EmployeesPage() {
  const [showShifts, setShowShifts] = useState(false);
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="flex h-14 items-center justify-between border-b px-6">
            <h1 className="text-lg font-semibold">Employees</h1>
            <Button onClick={() => setShowShifts(!showShifts)}>
              {showShifts ? "Back to Employees" : "Manage Shifts"}
            </Button>
          </div>
          <div className="p-6">
            {showShifts ? <ShiftsManagment /> : <EmployeeList />}
          </div>
        </main>
      </div>
    </div>
  );
}