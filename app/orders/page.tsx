import { Sidebar } from "@/components/sidebar"

export default function OrdersPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="flex h-14 items-center border-b px-6">
          <h1 className="text-lg font-semibold">Orders</h1>
        </div>
        <div className="p-6">
          {/* Orders content will go here */}
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h2 className="text-lg font-semibold">Orders Page</h2>
            <p className="text-muted-foreground">This page is under construction</p>
          </div>
        </div>
      </main>
    </div>
  )
}

