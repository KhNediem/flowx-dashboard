import { Sidebar } from "@/components/sidebar"
import { EmployeeList } from "@/components/employee-list"

export default function EmployeesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="flex h-14 items-center border-b px-6">
            <h1 className="text-lg font-semibold">Employees</h1>
          </div>
          <div className="p-6">
            <EmployeeList />
          </div>
        </main>
      </div>
    </div>
  )
}

