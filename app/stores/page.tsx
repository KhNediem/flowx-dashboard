import { StoresList } from "@/components/store-list"
import { Sidebar } from "@/components/sidebar"

export default function StoresPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="flex h-14 items-center border-b px-6">
          <h1 className="text-lg font-semibold">Stores</h1>
        </div>
        <div className="p-6">
        <StoresList/>
        </div>
      </main>
    </div>
  )
}

