"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Pencil, Trash2, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Sale {
  sale_id: number
  store_id: number
  product_id: number
  date: string
  units: number
  store_name?: string
  product_name?: string
}

interface Store {
  store_id: number
  store_name: string
}

interface Product {
  product_id: number
  product_name: string
}

// Static stores for when the database is empty
const staticStores: Store[] = [
  { store_id: 1, store_name: "Store A" },
  { store_id: 2, store_name: "Store B" },
  { store_id: 3, store_name: "Store C" },
]

// Static products for when the database is empty
const staticProducts: Product[] = [
  { product_id: 1, product_name: "Product 1" },
  { product_id: 2, product_name: "Product 2" },
  { product_id: 3, product_name: "Product 3" },
]

// Static sales for when the database is empty
const staticSales: Sale[] = [
  {
    sale_id: 1,
    store_id: 1,
    product_id: 1,
    date: "2023-05-15",
    units: 5,
    store_name: "Store A",
    product_name: "Product 1",
  },
  {
    sale_id: 2,
    store_id: 2,
    product_id: 2,
    date: "2023-05-16",
    units: 3,
    store_name: "Store B",
    product_name: "Product 2",
  },
  {
    sale_id: 3,
    store_id: 3,
    product_id: 3,
    date: "2023-05-17",
    units: 7,
    store_name: "Store C",
    product_name: "Product 3",
  },
]

export function SalesList() {
  const [sales, setSales] = useState<Sale[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const supabase = createClientComponentClient()

  const addForm = useForm<Omit<Sale, "sale_id" | "store_name" | "product_name">>()
  const editForm = useForm<Omit<Sale, "store_name" | "product_name">>()

  useEffect(() => {
    fetchSales()
    fetchStores()
    fetchProducts()
  }, [])

  async function fetchSales() {
    // Using a join to get store_name and product_name
    const { data, error } = await supabase.from("sales").select(`
        sale_id,
        store_id,
        product_id,
        date,
        units,
        stores(store_name),
        products(product_name)
      `)

    if (error) {
      console.error("Error fetching sales:", error)
      setSales(staticSales)
    } else if (data && data.length > 0) {
      // Transform the joined data to match our Sale interface
      const formattedSales = data.map((sale) => ({
        sale_id: sale.sale_id,
        store_id: sale.store_id,
        product_id: sale.product_id,
        date: sale.date,
        units: sale.units,
        store_name: sale.stores?.store_name,
        product_name: sale.products?.product_name,
      }))
      setSales(formattedSales)
    } else {
      setSales(staticSales)
    }
  }

  async function fetchStores() {
    const { data, error } = await supabase.from("stores").select("store_id, store_name")

    if (error) {
      console.error("Error fetching stores:", error)
      setStores(staticStores)
    } else {
      setStores(data && data.length > 0 ? data : staticStores)
    }
  }

  async function fetchProducts() {
    const { data, error } = await supabase.from("products").select("product_id, product_name")

    if (error) {
      console.error("Error fetching products:", error)
      setProducts(staticProducts)
    } else {
      setProducts(data && data.length > 0 ? data : staticProducts)
    }
  }

  const handleAddSale = async (data: Omit<Sale, "sale_id" | "store_name" | "product_name">) => {
    const { error } = await supabase.from("sales").insert([data])

    if (error) {
      console.error("Error adding sale:", error)
    } else {
      setIsAddDialogOpen(false)
      fetchSales()
    }
  }

  const handleEditSale = async (data: Omit<Sale, "store_name" | "product_name">) => {
    const { error } = await supabase
      .from("sales")
      .update({
        store_id: data.store_id,
        product_id: data.product_id,
        date: data.date,
        units: data.units,
      })
      .eq("sale_id", data.sale_id)

    if (error) {
      console.error("Error updating sale:", error)
    } else {
      setIsEditDialogOpen(false)
      fetchSales()
    }
  }

  const handleDeleteSale = async (saleId: number) => {
    const { error } = await supabase.from("sales").delete().eq("sale_id", saleId)

    if (error) {
      console.error("Error deleting sale:", error)
    } else {
      fetchSales()
    }
  }

  const filteredSales = sales.filter((sale) => {
    const storeName = sale.store_name?.toLowerCase() || ""
    const productName = sale.product_name?.toLowerCase() || ""
    const query = searchQuery.toLowerCase()

    return storeName.includes(query) || productName.includes(query) || sale.date.includes(query)
  })

  const getStoreName = (storeId: number) => {
    const store = stores.find((s) => s.store_id === storeId)
    return store ? store.store_name : `Store ${storeId}`
  }

  const getProductName = (productId: number) => {
    const product = products.find((p) => p.product_id === productId)
    return product ? product.product_name : `Product ${productId}`
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP")
    } catch (error) {
      return dateString
    }
  }

  const SaleForm = ({
    form,
    onSubmit,
    dialogTitle,
  }: {
    form: any
    onSubmit: (data: any) => void
    dialogTitle: string
  }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="store_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number.parseInt(value))}
                defaultValue={field.value?.toString()}
              >
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
              <Select
                onValueChange={(value) => field.onChange(Number.parseInt(value))}
                defaultValue={field.value?.toString()}
              >
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
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(new Date(field.value), "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="units"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Units Sold</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  {...field}
                  onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                />
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
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">Sales</h2>
          <Input
            placeholder="Search sales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Sale
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Store</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Units Sold</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSales.map((sale) => (
            <TableRow key={sale.sale_id}>
              <TableCell>{sale.store_name || getStoreName(sale.store_id)}</TableCell>
              <TableCell>{sale.product_name || getProductName(sale.product_id)}</TableCell>
              <TableCell>{formatDate(sale.date)}</TableCell>
              <TableCell>{sale.units}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSale(sale)
                    setIsViewDialogOpen(true)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedSale(sale)
                    editForm.reset({
                      sale_id: sale.sale_id,
                      store_id: sale.store_id,
                      product_id: sale.product_id,
                      date: sale.date,
                      units: sale.units,
                    })
                    setIsEditDialogOpen(true)
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteSale(sale.sale_id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sale</DialogTitle>
          </DialogHeader>
          <SaleForm form={addForm} onSubmit={handleAddSale} dialogTitle="Add Sale" />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
          </DialogHeader>
          <SaleForm form={editForm} onSubmit={handleEditSale} dialogTitle="Update Sale" />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <p>
                  <strong>Store:</strong> {selectedSale.store_name || getStoreName(selectedSale.store_id)}
                </p>
                <p>
                  <strong>Product:</strong> {selectedSale.product_name || getProductName(selectedSale.product_id)}
                </p>
                <p>
                  <strong>Date:</strong> {formatDate(selectedSale.date)}
                </p>
                <p>
                  <strong>Units Sold:</strong> {selectedSale.units}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
