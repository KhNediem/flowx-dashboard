"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface Product {
  product_id: number;
  product_name: string;
  brand_id: number;
  product_length: number;
  product_depth: number;
  product_width: number;
  base_price: number;
  qr_code: string;
  photo_url: string;
  product_threshold: number;
}

interface Brand {
  brand_id: number;
  brand_name: string;
}

// Static brands for when the database is empty
const staticBrands: Brand[] = [
  { brand_id: 1, brand_name: "Brand A" },
  { brand_id: 2, brand_name: "Brand B" },
  { brand_id: 3, brand_name: "Brand C" },
];

// Static products for when the database is empty
const staticProducts: Product[] = [
  {
    product_id: 1,
    product_name: "Product 1",
    brand_id: 1,
    product_length: 10.5,
    product_depth: 5.2,
    product_width: 3.1,
    base_price: 19.99,
    qr_code: "QR12345",
    photo_url: "https://api.dicebear.com/6.x/shapes/svg?seed=Product1",
    product_threshold: 100,
  },
  {
    product_id: 2,
    product_name: "Product 2",
    brand_id: 2,
    product_length: 15.0,
    product_depth: 7.5,
    product_width: 4.2,
    base_price: 29.99,
    qr_code: "QR67890",
    photo_url: "https://api.dicebear.com/6.x/shapes/svg?seed=Product2",
    product_threshold: 100,
  },
  {
    product_id: 3,
    product_name: "Product 3",
    brand_id: 3,
    product_length: 8.3,
    product_depth: 4.1,
    product_width: 2.5,
    base_price: 14.99,
    qr_code: "QR24680",
    photo_url: "https://api.dicebear.com/6.x/shapes/svg?seed=Product3",
    product_threshold: 100,
  },
];

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClientComponentClient();

  const addForm = useForm<Omit<Product, "product_id">>();
  const editForm = useForm<Product>();

  useEffect(() => {
    fetchProducts();
    fetchBrands();
  }, []);

  async function fetchProducts() {
    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      console.error("Error fetching products:", error);
      setProducts(staticProducts);
    } else {
      setProducts(data && data.length > 0 ? data : staticProducts);
    }
  }

  async function fetchBrands() {
    const { data, error } = await supabase
      .from("brands")
      .select("brand_id, brand_name");

    if (error) {
      console.error("Error fetching brands:", error);
      setBrands(staticBrands);
    } else {
      setBrands(data && data.length > 0 ? data : staticBrands);
    }
  }

  const handleAddProduct = async (data: Omit<Product, "product_id">) => {
    const { error } = await supabase.from("products").insert([data]);

    if (error) {
      console.error("Error adding product:", error);
    } else {
      setIsAddDialogOpen(false);
      fetchProducts();
    }
  };

  const handleEditProduct = async (data: Product) => {
    const { error } = await supabase
      .from("products")
      .update(data)
      .eq("product_id", data.product_id);

    if (error) {
      console.error("Error updating product:", error);
    } else {
      setIsEditDialogOpen(false);
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("product_id", productId);

    if (error) {
      console.error("Error deleting product:", error);
    } else {
      fetchProducts();
    }
  };

  const filteredProducts = products.filter((product) =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getBrandName = (brandId: number) => {
    const brand = brands.find((b) => b.brand_id === brandId);
    return brand ? brand.brand_name : `Brand ${brandId}`;
  };

  const ProductForm = ({
    form,
    onSubmit,
    dialogTitle,
  }: {
    form: any;
    onSubmit: (data: any) => void;
    dialogTitle: string;
  }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="product_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>Brand</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(Number.parseInt(value))
                }
                defaultValue={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a brand" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem
                      key={brand.brand_id}
                      value={brand.brand_id.toString()}
                    >
                      {brand.brand_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="product_length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseFloat(e.target.value))
                    }
                  />
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
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseFloat(e.target.value))
                    }
                  />
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
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) =>
                      field.onChange(Number.parseFloat(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="base_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) =>
                    field.onChange(Number.parseFloat(e.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="product_threshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Threshold</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="1"
                  {...field}
                  onChange={(e) =>
                    field.onChange(Number.parseInt(e.target.value))
                  }
                />
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="photo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Photo URL</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{dialogTitle}</Button>
      </form>
    </Form>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">Products</h2>
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Dimensions (L×D×W)</TableHead>
            <TableHead>Base Price</TableHead>
            <TableHead>Product Threshold</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product) => (
            <TableRow key={product.product_id}>
              <TableCell>{product.product_name}</TableCell>
              <TableCell>{getBrandName(product.brand_id)}</TableCell>
              <TableCell>{`${product.product_length} × ${product.product_depth} × ${product.product_width}`}</TableCell>
              <TableCell>${product.base_price.toFixed(2)}</TableCell>
              <TableCell>{product.product_threshold}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedProduct(product);
                    setIsViewDialogOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedProduct(product);
                    editForm.reset(product);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteProduct(product.product_id)}
                >
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
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            form={addForm}
            onSubmit={handleAddProduct}
            dialogTitle="Add Product"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductForm
            form={editForm}
            onSubmit={handleEditProduct}
            dialogTitle="Update Product"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="grid gap-2">
                    <p>
                      <strong>Name:</strong> {selectedProduct.product_name}
                    </p>
                    <p>
                      <strong>Brand:</strong>{" "}
                      {getBrandName(selectedProduct.brand_id)}
                    </p>
                    <p>
                      <strong>Dimensions:</strong>{" "}
                      {`${selectedProduct.product_length} × ${selectedProduct.product_depth} × ${selectedProduct.product_width}`}
                    </p>
                    <p>
                      <strong>Base Price:</strong> $
                      {selectedProduct.base_price.toFixed(2)}
                    </p>
                    <p>
                      <strong>Product Threshold:</strong>{" "}
                      {selectedProduct.product_threshold}
                    </p>
                    <p>
                      <strong>QR Code:</strong> {selectedProduct.qr_code}
                    </p>
                  </div>
                </div>
                <div>
                {selectedProduct && (
                  <img
                    src={selectedProduct.photo_url || "/placeholder.svg"}
                    alt={selectedProduct.product_name || "Product image"}
                    className="w-full h-auto rounded-md object-cover"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = "/placeholder.svg"
                    }}
                  />
                )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
