"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, ChevronRight, ChevronDown, Plus, Pencil, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface Product {
  product_id: number
  product_name: string
  brand_id: number
  base_price: number
  photo_url: string
}

interface Store {
  store_id: number
  store_name: string
  address: string
}

interface InventoryItem {
  inventory_id: number
  store_id: number
  product_id: number
  current_quantity: number
  last_updated: string
  products: Product
  stores: Store
}

export function InventoryList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [expandedStores, setExpandedStores] = useState<number[]>([])
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null)
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [initialLoad, setInitialLoad] = useState(true)

  const supabase = createClientComponentClient()

  const addForm = useForm<Omit<InventoryItem, "inventory_id" | "last_updated" | "products" | "stores">>()
  const editForm = useForm<Omit<InventoryItem, "last_updated" | "products" | "stores">>()

  useEffect(() => {
    fetchInventory()
    fetchStores()
    fetchProducts()

    // Set initialLoad to false after first load
    setInitialLoad(false)
  }, [])

  async function fetchInventory() {
    const { data, error } = await supabase.from("real_time_inventory").select(`
        inventory_id,
        store_id,
        product_id,
        current_quantity,
        last_updated,
        products (
          product_id,
          product_name,
          brand_id,
          base_price,
          photo_url
        ),
        stores (
          store_id,
          store_name,
          address
        )
      `)

    if (error) {
      console.error("Error fetching inventory:", error)
    } else {
      setInventoryItems(data || [])

      // Check for low stock items
      const lowStockItems = data?.filter((item) => item.current_quantity < 3) || []
      if (lowStockItems.length > 0 && !initialLoad) {
        toast.error(
          `Low Stock Alert: ${lowStockItems.length} ${lowStockItems.length === 1 ? "item" : "items"} need attention`,
          {
            description: "Some inventory items are running low on stock.",
            duration: 5000,
          },
        )
      }
    }
  }

  async function fetchStores() {
    const { data, error } = await supabase.from("stores").select("*")

    if (error) {
      console.error("Error fetching stores:", error)
    } else {
      setStores(data || [])
    }
  }

  async function fetchProducts() {
    const { data, error } = await supabase.from("products").select("*")

    if (error) {
      console.error("Error fetching products:", error)
    } else {
      setProducts(data || [])
    }
  }

  const groupedInventory = inventoryItems.reduce(
    (acc, item) => {
      if (!acc[item.store_id]) {
        acc[item.store_id] = {
          store: item.stores,
          items: [],
        }
      }
      acc[item.store_id].items.push({ ...item, product: item.products })
      return acc
    },
    {} as Record<number, { store: Store; items: (InventoryItem & { product: Product })[] }>,
  )

  const toggleStoreExpansion = (storeId: number) => {
    setExpandedStores((prev) => (prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]))
  }

  const handleProductView = (product: Product) => {
    setSelectedProduct(product)
    setIsProductModalOpen(true)
  }

  const handleStoreView = (store: Store) => {
    setSelectedStore(store)
    setIsStoreModalOpen(true)
  }

  const handleAddInventory = async (
    data: Omit<InventoryItem, "inventory_id" | "last_updated" | "products" | "stores">,
  ) => {
    const { error } = await supabase.from("real_time_inventory").insert([data])

    if (error) {
      console.error("Error adding inventory item:", error)
      toast.error("Failed to add inventory item")
    } else {
      setIsAddModalOpen(false)
      fetchInventory()
      toast.success("Inventory item added successfully")
    }
  }

  const handleEditInventory = async (data: Omit<InventoryItem, "last_updated" | "products" | "stores">) => {
    const { error } = await supabase.from("real_time_inventory").update(data).eq("inventory_id", data.inventory_id)

    if (error) {
      console.error("Error updating inventory item:", error)
      toast.error("Failed to update inventory item")
    } else {
      setIsEditModalOpen(false)
      fetchInventory()
      toast.success("Inventory item updated successfully")
    }
  }

  const handleDeleteInventory = async (inventoryId: number) => {
    const { error } = await supabase.from("real_time_inventory").delete().eq("inventory_id", inventoryId)

    if (error) {
      console.error("Error deleting inventory item:", error)
      toast.error("Failed to delete inventory item")
    } else {
      fetchInventory()
      toast.success("Inventory item deleted successfully")
    }
  }

  const InventoryForm = ({
    form,
    onSubmit,
    dialogTitle,
  }: { form: any; onSubmit: (data: any) => void; dialogTitle: string }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="store_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a store" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.store_id} value={store.store_id.toString()}>
                      {store.store_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.product_id} value={product.product_id.toString()}>
                      {product.product_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="current_quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{dialogTitle}</Button>
      </form>
    </Form>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search by product or store"
          className="max-w-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Inventory
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Store</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedInventory).map(([storeId, { store, items }]) => (
              <React.Fragment key={storeId}>
                {store ? (
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={5}>
                      <Button variant="ghost" onClick={() => toggleStoreExpansion(store.store_id)} className="p-0">
                        {expandedStores.includes(store.store_id) ? (
                          <ChevronDown className="mr-2 h-4 w-4" />
                        ) : (
                          <ChevronRight className="mr-2 h-4 w-4" />
                        )}
                        {store.store_name}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleStoreView(store)} className="ml-2">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>Error: Store data is missing</TableCell>
                  </TableRow>
                )}
                {expandedStores.includes(Number.parseInt(storeId)) &&
                  items.map((item) => (
                    <TableRow key={item.inventory_id} className={item.current_quantity < 3 ? "bg-destructive/10" : ""}>
                      <TableCell></TableCell>
                      <TableCell>{item.product.product_name}</TableCell>
                      <TableCell className={item.current_quantity < 3 ? "font-bold text-destructive" : ""}>
                        {item.current_quantity}
                      </TableCell>
                      <TableCell>{new Date(item.last_updated).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleProductView(item.product)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInventoryItem(item)
                            editForm.reset(item)
                            setIsEditModalOpen(true)
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteInventory(item.inventory_id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <p>
                  <strong>Name:</strong> {selectedProduct.product_name}
                </p>
                <p>
                  <strong>Brand ID:</strong> {selectedProduct.brand_id}
                </p>
                <p>
                  <strong>Base Price:</strong> ${selectedProduct.base_price.toFixed(2)}
                </p>
                {selectedProduct.photo_url && (
                  <img
                    src={selectedProduct.photo_url || "/placeholder.svg"}
                    alt={selectedProduct.product_name}
                    className="max-w-full h-auto"
                  />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isStoreModalOpen} onOpenChange={setIsStoreModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Store Details</DialogTitle>
          </DialogHeader>
          {selectedStore && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <p>
                  <strong>Name:</strong> {selectedStore.store_name}
                </p>
                <p>
                  <strong>Address:</strong> {selectedStore.address}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <InventoryForm form={addForm} onSubmit={handleAddInventory} dialogTitle="Add Item" />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <InventoryForm form={editForm} onSubmit={handleEditInventory} dialogTitle="Update Item" />
        </DialogContent>
      </Dialog>
    </div>
  )
}

