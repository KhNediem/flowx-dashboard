import { Sidebar } from "@/components/sidebar"
import { Dashboard } from "@/components/dashboard"
import { CollapsibleRightPanel } from "@/components/CollapsibleRightPanel"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <main className="overflow-y-auto p-6 h-full">
          <Dashboard />
        </main>
      </div>
      <CollapsibleRightPanel />
    </div>
  )
}

