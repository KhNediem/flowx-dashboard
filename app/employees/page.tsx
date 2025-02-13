import { EmployeeList } from "@/components/employee-list"
import { Sidebar } from "@/components/sidebar"

export default function EmployeesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="flex h-14 items-center border-b px-6">
          <h1 className="text-lg font-semibold">Employees</h1>
        </div>
        <div className="p-6">
          <EmployeeList />
        </div>
      </main>
    </div>
  )
}

