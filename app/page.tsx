import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { RightPanel } from "@/components/right-panel"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <Dashboard />
        </main>
      </div>
      
    </div>
  )
}
