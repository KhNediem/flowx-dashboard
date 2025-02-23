import { Sidebar } from "@/components/sidebar"
import { MainContent } from "@/components/main-content"
import { RightPanel } from "@/components/right-panel"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <MainContent />
      </div>
      <RightPanel />
    </div>
  )
}

