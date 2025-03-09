"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

interface LowStockItem {
  inventory_id: number
  store_id: number
  product_id: number
  current_quantity: number
  products: {
    product_name: string
  }
  stores: {
    store_name: string
  }
}

export function LowStockAlert() {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchLowStockItems()
  }, [])

  async function fetchLowStockItems() {
    const { data, error } = await supabase
      .from("real_time_inventory")
      .select(`
        inventory_id,
        store_id,
        product_id,
        current_quantity,
        products (
          product_name
        ),
        stores (
          store_name
        )
      `)
      .lt("current_quantity", 3)

    if (error) {
      console.error("Error fetching low stock items:", error)
    } else {
      setLowStockItems(data || [])

      // Show toast notification for each low stock item
      if (data && data.length > 0) {
        toast.error(`Low Stock Alert: ${data.length} ${data.length === 1 ? "item" : "items"} need attention`, {
          description: "Some inventory items are running low on stock.",
          duration: 5000,
        })
      }
    }
  }

  if (lowStockItems.length === 0) {
    return null
  }

  return (
    <div className="mb-6 space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Low Stock Alert</AlertTitle>
        <AlertDescription>The following items are running low on stock (less than 3 units):</AlertDescription>
      </Alert>

      <div className="grid gap-2">
        {lowStockItems.map((item) => (
          <Alert key={item.inventory_id} variant="destructive" className="bg-destructive/10">
            <AlertDescription>
              <span className="font-medium">{item.products.product_name}</span> at{" "}
              <span className="font-medium">{item.stores.store_name}</span> has only{" "}
              <span className="font-bold">{item.current_quantity}</span> units left.
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  )
}

