"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, List, ArrowUpDown, Pencil, Trash2, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Product {
  product_id: number
  product_name: string
  brand_id: number
  product_length: number
  product_depth: number
  product_width: number
  base_price: number
  qr_code: string
}

export function InventoryList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    const { data, error } = await supabase.from("products").select("*")

    if (error) {
      console.error("Error fetching products:", error)
    } else {
      setProducts(data || [])
    }
  }

  const addForm = useForm<Product>({
    defaultValues: {
      product_name: "",
      brand_id: 0,
      product_length: 0,
      product_depth: 0,
      product_width: 0,
      base_price: 0,
      qr_code: "",
    },
  })

  const updateForm = useForm<Product>({
    defaultValues: {
      product_name: "",
      brand_id: 0,
      product_length: 0,
      product_depth: 0,
      product_width: 0,
      base_price: 0,
      qr_code: "",
    },
  })

  const onAddSubmit = async (data: Product) => {
    const { error } = await supabase.from("products").insert([data])

    if (error) {
      console.error("Error adding product:", error)
    } else {
      setIsAddDialogOpen(false)
      fetchProducts()
    }
  }

  const onUpdateSubmit = async (data: Product) => {
    const { error } = await supabase.from("products").update(data).eq("product_id", selectedProduct?.product_id)

    if (error) {
      console.error("Error updating product:", error)
    } else {
      setIsUpdateDialogOpen(false)
      fetchProducts()
    }
  }

  const handleDelete = async (product: Product) => {
    const { error } = await supabase.from("products").delete().eq("product_id", product.product_id)

    if (error) {
      console.error("Error deleting product:", error)
    } else {
      fetchProducts()
    }
  }

  const handleUpdate = (product: Product) => {
    setSelectedProduct(product)
    updateForm.reset(product)
    setIsUpdateDialogOpen(true)
  }

  const handleView = (product: Product) => {
    setSelectedProduct(product)
    setIsViewDialogOpen(true)
  }

  const ProductForm = ({
    form,
    onSubmit,
    dialogTitle,
  }: { form: any; onSubmit: (data: Product) => void; dialogTitle: string }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="product_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Product Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="brand_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Brand ID</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Brand ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="product_length"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Length</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Length" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="product_depth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Depth</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Depth" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="product_width"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Width</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Width" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="base_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Price</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="Base Price" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="qr_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>QR Code</FormLabel>
              <FormControl>
                <Input placeholder="QR Code" {...field} />
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
        <div className="flex items-center space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <ProductForm form={addForm} onSubmit={onAddSubmit} dialogTitle="Add Product" />
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="icon">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
        <Input
          placeholder="Search"
          className="max-w-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Brand ID</TableHead>
              <TableHead>Dimensions (L x W x D)</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>QR Code</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.product_id}>
                <TableCell>{product.product_id}</TableCell>
                <TableCell>{product.product_name}</TableCell>
                <TableCell>{product.brand_id}</TableCell>
                <TableCell>{`${product.product_length} x ${product.product_width} x ${product.product_depth}`}</TableCell>
                <TableCell>{product.base_price}</TableCell>
                <TableCell>{product.qr_code}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        ⋮
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(product)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdate(product)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Update
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(product)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Product</DialogTitle>
          </DialogHeader>
          <ProductForm form={updateForm} onSubmit={onUpdateSubmit} dialogTitle="Update Product" />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <p>
                  <strong>ID:</strong> {selectedProduct.product_id}
                </p>
                <p>
                  <strong>Name:</strong> {selectedProduct.product_name}
                </p>
                <p>
                  <strong>Brand ID:</strong> {selectedProduct.brand_id}
                </p>
                <p>
                  <strong>Length:</strong> {selectedProduct.product_length}
                </p>
                <p>
                  <strong>Width:</strong> {selectedProduct.product_width}
                </p>
                <p>
                  <strong>Depth:</strong> {selectedProduct.product_depth}
                </p>
                <p>
                  <strong>Base Price:</strong> {selectedProduct.base_price}
                </p>
                <p>
                  <strong>QR Code:</strong> {selectedProduct.qr_code}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

