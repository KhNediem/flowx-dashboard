"use client"

import * as React from "react"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, Info, Calendar } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import type { DateRange } from "react-day-picker"
import { Skeleton } from "@/components/ui/skeleton"

// Define types for our data structures
interface InventoryItem {
  product_id: string
  product_name?: string
  quantity?: number
  minimum_stock?: number
  reorder_quantity?: number
  store_id: string
  current_quantity?: number
}

interface ProductDetails {
  product_id: string
  product_name: string
  product_length?: number
  product_depth?: number
  product_width?: number
  base_price?: number
  qr_code?: string
  photo_url?: string
  product_threshold?: number
  product_category?: string
}

interface SalesForecast {
  product_id: string
  store_id: string
  date: string
  forecasted_quantity?: number
}

interface ProductInventory {
  product_id: string
  product_name: string
  current_stock: number
  minimum_stock: number
  reorder_quantity: number
  product_details?: ProductDetails
}

interface OrderRecommendation {
  product_id: string
  product_name: string
  current_stock: number
  expected_sales: number
  recommended_order: number
  product_details?: ProductDetails
}

export function DemandForecasting() {
  const supabase = createClientComponentClient()

  // State for date range picker
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(new Date().setDate(new Date().getDate() + 30)), // Default to next 30 days
  })

  // State for store selection
  const [selectedStore, setSelectedStore] = React.useState<string>("")
  const [stores, setStores] = React.useState<string[]>([])

  // State for loading and results
  const [loading, setLoading] = React.useState<boolean>(false)
  const [storesLoading, setStoresLoading] = React.useState<boolean>(true)
  const [error, setError] = React.useState<string | null>(null)
  const [orderRecommendations, setOrderRecommendations] = React.useState<OrderRecommendation[]>([])
  const [productDetails, setProductDetails] = React.useState<Record<string, ProductDetails>>({})
  const [calculationAttempted, setCalculationAttempted] = React.useState<boolean>(false)
  const [selectedDays, setSelectedDays] = React.useState<number>(0)

  // Fetch stores on component mount
  React.useEffect(() => {
    async function fetchStores() {
      setStoresLoading(true)
      try {
        // Get unique store IDs from inventory and forecasts
        const { data: inventoryStores, error: inventoryError } = await supabase
          .from("real_time_inventory")
          .select("store_id")
          .order("store_id")

        if (inventoryError) throw inventoryError

        // Remove duplicates
        const uniqueStores = [...new Set((inventoryStores || []).map((store) => store.store_id))]
        setStores(uniqueStores)

        // Set the first store as default if available
        if (uniqueStores.length > 0) {
          setSelectedStore(uniqueStores[0])
        }
      } catch (err) {
        console.error("Error fetching stores:", err)
        setError("Failed to load stores. Please try again.")
      } finally {
        setStoresLoading(false)
      }
    }

    fetchStores()
  }, [supabase])

  // Update selected days when date range changes
  React.useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 to include both start and end dates
      setSelectedDays(diffDays)
    } else {
      setSelectedDays(0)
    }
  }, [dateRange])

  // Pre-fetch product details when store is selected
  React.useEffect(() => {
    if (!selectedStore) return
  
    async function fetchProductDetails() {
      try {
        // Fetch inventory to get product IDs
        const { data: inventory, error: inventoryError } = await supabase
          .from("real_time_inventory")
          .select("product_id")
          .eq("store_id", selectedStore)
  
        if (inventoryError) throw inventoryError
  
        const productIds = inventory?.map((item) => item.product_id) || []
  
        if (productIds.length > 0) {
          const { data: products, error: productsError } = await supabase
            .from("products")
            .select("*")
            .in("product_id", productIds)
  
          if (productsError) throw productsError
  
          // Create a map of product details for easy lookup
          const productDetailsMap: Record<string, ProductDetails> = {}
          products?.forEach((product) => {
            productDetailsMap[product.product_id] = product
          })
          setProductDetails(productDetailsMap)
          console.log(`Pre-fetched details for ${products?.length || 0} products`)
        }
      } catch (err) {
        console.error("Error pre-fetching product details:", err)
      }
    }
  
    fetchProductDetails()
  }, [selectedStore, supabase])
  
  // Function to calculate order recommendations
  const calculateOrderRecommendations = async () => {
    console.log("Starting order recommendations calculation...")
    console.log("Selected store:", selectedStore)
    console.log("Date range:", dateRange)
    console.log("Selected days:", selectedDays)
  
    setCalculationAttempted(true)
  
    if (!selectedStore || !dateRange?.from || !dateRange?.to) {
      const errorMsg = "Please select a store and date range"
      console.error(errorMsg)
      setError(errorMsg)
      return
    }
  
    setLoading(true)
    setError(null)
  
    try {
      console.log("Fetching inventory data for store:", selectedStore)
      // Fetch current inventory for the selected store
      const { data: inventory, error: inventoryError } = await supabase
        .from("real_time_inventory")
        .select("*")
        .eq("store_id", selectedStore)
  
      if (inventoryError) {
        console.error("Inventory fetch error:", inventoryError)
        throw inventoryError
      }
  
      console.log(`Fetched ${inventory?.length || 0} inventory items`)
  
      // Extract month and day from the date range (ignoring year)
      const fromMonth = dateRange.from.getMonth() + 1 // getMonth() is 0-indexed
      const fromDay = dateRange.from.getDate()
      const toMonth = dateRange.to.getMonth() + 1
      const toDay = dateRange.to.getDate()
  
      console.log(`Fetching forecasts for month/day range: ${fromMonth}/${fromDay} to ${toMonth}/${toDay}`)
  
      // Fetch all forecasts for the store
      const { data: allForecasts, error: forecastsError } = await supabase
        .from("sales_forecasts")
        .select("*")
        .eq("store_id", selectedStore)
  
      if (forecastsError) {
        console.error("Forecasts fetch error:", forecastsError)
        throw forecastsError
      }
  
      console.log(`Fetched ${allForecasts?.length || 0} total forecast records`)
  
      // Filter forecasts to match the month/day range (ignoring year)
      const filteredForecasts = allForecasts?.filter((forecast) => {
        const forecastDate = new Date(forecast.date)
        
        // Normalize the year to a common one (e.g., 2000), since we're only comparing month/day
        const normalize = (month, day) => new Date(2000, month - 1, day)
  
        const normalizedForecast = new Date(2000, forecastDate.getMonth(), forecastDate.getDate())
        const normalizedFrom = normalize(fromMonth, fromDay)
        const normalizedTo = normalize(toMonth, toDay)
  
        if (normalizedFrom <= normalizedTo) {
          // Normal range (e.g., March 1 to June 30)
          return normalizedForecast >= normalizedFrom && normalizedForecast <= normalizedTo
        } else {
          // Wrapped range over year end (e.g., Nov 15 to Feb 15)
          return normalizedForecast >= normalizedFrom || normalizedForecast <= normalizedTo
        }
      })
  
      console.log(`Filtered to ${filteredForecasts?.length || 0} forecast records matching month/day range`)
  
      // Get all unique product IDs from both inventory and forecasts
      const inventoryProductIds = inventory?.map(item => item.product_id) || []
      const forecastProductIds = filteredForecasts?.map(forecast => forecast.product_id) || []
      
      // Combine and remove duplicates
      const allProductIds = [...new Set([...inventoryProductIds, ...forecastProductIds])]
      
      console.log(`Found ${allProductIds.length} unique products to process`)
  
      // Check if we need to fetch additional product details
      const missingProductIds = allProductIds.filter(id => !productDetails[id])
      
      if (missingProductIds.length > 0) {
        console.log(`Fetching details for ${missingProductIds.length} additional products...`)
        
        const { data: additionalProducts, error: productsError } = await supabase
          .from("products")
          .select("*")
          .in("product_id", missingProductIds)
  
        if (productsError) {
          console.error("Additional products fetch error:", productsError)
          throw productsError
        }
  
        // Create an updated map with both existing and new product details
        const updatedProductDetails = { ...productDetails }
        
        additionalProducts?.forEach((product) => {
          updatedProductDetails[product.product_id] = product
        })
        
        setProductDetails(updatedProductDetails)
        console.log(`Fetched details for ${additionalProducts?.length || 0} additional products`)
        
        // Process with the updated product details
        processWithProductDetails(inventory, filteredForecasts, updatedProductDetails)
      } else {
        // Process with existing product details
        processWithProductDetails(inventory, filteredForecasts, productDetails)
      }
      
    } catch (err) {
      console.error("Error calculating order recommendations:", err)
      if (err instanceof Error) {
        setError(`Failed to calculate order recommendations: ${err.message}`)
      } else {
        setError("Failed to calculate order recommendations. Please try again.")
      }
      setLoading(false)
    }
  }
  
  // Helper function to process recommendations after ensuring we have all product details
  const processWithProductDetails = (
    inventory: InventoryItem[],
    filteredForecasts: SalesForecast[],
    productDetailsMap: Record<string, ProductDetails>
  ) => {
    try {
      console.log("Processing order recommendations with complete product details...")
      const recommendations = processOrderRecommendations(
        inventory,
        filteredForecasts,
        productDetailsMap,
        selectedDays,
      )
      console.log(`Generated ${recommendations.length} order recommendations`)
      setOrderRecommendations(recommendations)
    } catch (err) {
      console.error("Error processing recommendations:", err)
      if (err instanceof Error) {
        setError(`Failed to process recommendations: ${err.message}`)
      } else {
        setError("Failed to process recommendations. Please try again.")
      }
    } finally {
      setLoading(false)
      console.log("Order recommendation calculation completed")
    }
  }
  
  // Modified algorithm to use correct column names and directly use total forecasted quantities
  const processOrderRecommendations = (
    inventory: InventoryItem[],
    forecasts: SalesForecast[],
    productDetailsMap: Record<string, ProductDetails> = {},
    daysInRange: number,
  ): OrderRecommendation[] => {
    console.log("Processing inventory and forecasts...")
    console.log(`Working with ${Object.keys(productDetailsMap).length} product details`)
  
    // Create a map of products with their current inventory levels
    const productInventory: Record<string, ProductInventory> = {}
    inventory.forEach((item) => {
      // Use product name from product details if available
      const productDetail = productDetailsMap[item.product_id]
      const productName = productDetail?.product_name || item.product_name || `Product ${item.product_id}`
  
      productInventory[item.product_id] = {
        product_id: item.product_id,
        product_name: productName,
        current_stock: item.current_quantity || item.quantity || 0,
        minimum_stock: item.minimum_stock || productDetailsMap[item.product_id]?.product_threshold || 10,
        reorder_quantity: item.reorder_quantity || 50,
        product_details: productDetailsMap[item.product_id],
      }
    })
  
    console.log(`Processed ${Object.keys(productInventory).length} unique products in inventory`)
  
    // Calculate total forecasted quantity for each product in the date range
    const productForecastTotals: Record<string, number> = {}
    
    forecasts.forEach((forecast) => {
      if (!productForecastTotals[forecast.product_id]) {
        productForecastTotals[forecast.product_id] = 0
      }
      // Use 'units' field from forecast instead of 'forecasted_quantity'
      productForecastTotals[forecast.product_id] += forecast.units || 0
    })
  
    // Debug output to check if we're getting forecast data correctly
    console.log("Forecasted totals by product:", productForecastTotals)
  
    // Calculate recommendations
    const recommendations: OrderRecommendation[] = []
    
    // Create recommendations for all products in either inventory or forecasts
    const allProductIds = new Set([
      ...Object.keys(productInventory),
      ...Object.keys(productForecastTotals)
    ])
    
    allProductIds.forEach((productId) => {
      // Get product details (even for products not in inventory)
      const productDetail = productDetailsMap[productId]
      
      // Get inventory info (default to 0 if not in inventory)
      const product = productInventory[productId] || {
        product_id: productId,
        product_name: productDetail?.product_name || `Product ${productId}`,
        current_stock: 0,
        minimum_stock: productDetail?.product_threshold || 10,
        reorder_quantity: 50,
        product_details: productDetail || null
      }
      
      // Get total forecasted sales for this product in the selected date range
      const totalForecastedSales = productForecastTotals[productId] || 0
      
      // Calculate recommended order: total forecasted sales - current stock (if positive)
      const recommendedOrder = Math.max(0, totalForecastedSales - product.current_stock)
  
      console.log(
        `Product ${productId}: Current stock: ${product.current_stock}, ` +
        `Total forecasted sales: ${totalForecastedSales}, ` +
        `Recommended order: ${recommendedOrder}`
      )
      
      // Only include products that need ordering
      if (recommendedOrder > 0) {
        recommendations.push({
          product_id: product.product_id,
          product_name: product.product_name,
          current_stock: product.current_stock,
          expected_sales: totalForecastedSales,
          recommended_order: recommendedOrder,
          product_details: product.product_details,
        })
      }
    })
  
    // Sort by recommended order quantity (highest first)
    const sortedRecommendations = recommendations.sort((a, b) => b.recommended_order - a.recommended_order)
    console.log(`Generated ${sortedRecommendations.length} order recommendations`)
  
    return sortedRecommendations
  }
  // Function to format dimensions
  const formatDimensions = (product: ProductDetails | undefined) => {
    if (!product) return "N/A"

    const length = product.product_length ? `${product.product_length}` : "?"
    const width = product.product_width ? `${product.product_width}` : "?"
    const depth = product.product_depth ? `${product.product_depth}` : "?"

    return `${length} × ${width} × ${depth}`
  }

  // Function to format price
  const formatPrice = (price: number | undefined) => {
    if (price === undefined) return "N/A"
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price)
  }

  // Function to get product initials for placeholder
  const getProductInitials = (name: string): string => {
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-auto">
          <label className="text-sm font-medium mb-2 block">Date Range</label>
          {storesLoading ? (
            <Skeleton className="h-10 w-[300px]" />
          ) : (
            <div className="space-y-1">
              <DateRangePicker date={dateRange} setDate={setDateRange} />
              {selectedDays > 0 && (
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {selectedDays} {selectedDays === 1 ? "day" : "days"} selected
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full md:w-64">
          <label className="text-sm font-medium mb-2 block">Select Store</label>
          {storesLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger>
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store} value={store}>
                    Store {store}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-end">
          {storesLoading ? (
            <Skeleton className="h-10 w-[200px]" />
          ) : (
            <Button onClick={calculateOrderRecommendations} disabled={loading || !selectedStore}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                "Calculate Order Recommendations"
              )}
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-10" />
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-10 w-48" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-10" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : orderRecommendations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Order Recommendations</span>
              <Badge variant="outline" className="ml-2">
                Based on {selectedDays} {selectedDays === 1 ? "day" : "days"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Expected Sales</TableHead>
                    <TableHead className="text-right">Recommended Order</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderRecommendations.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="relative h-8 w-8 rounded overflow-hidden bg-muted flex items-center justify-center">
                            <Image
                              src={`/placeholder.svg?height=32&width=32&text=${encodeURIComponent(getProductInitials(item.product_name))}`}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            {item.product_name}
                            {item.product_details?.product_category && (
                              <div>
                                <Badge variant="outline" className="text-xs">
                                  {item.product_details.product_category}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.current_stock}</TableCell>
                      <TableCell className="text-right">{item.expected_sales}</TableCell>
                      <TableCell className="text-right font-bold">{item.recommended_order}</TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Info className="h-4 w-4" />
                              <span className="sr-only">View details</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {item.product_name}
                                {item.product_details?.product_category && (
                                  <Badge variant="outline">{item.product_details.product_category}</Badge>
                                )}
                              </DialogTitle>
                            </DialogHeader>

                            <Tabs defaultValue="details">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="details">Product Details</TabsTrigger>
                                <TabsTrigger value="inventory">Inventory</TabsTrigger>
                              </TabsList>

                              <TabsContent value="details" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Product ID</p>
                                    <p className="text-sm">{item.product_id}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Base Price</p>
                                    <p className="text-sm">{formatPrice(item.product_details?.base_price)}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Dimensions (L×W×D)</p>
                                    <p className="text-sm">{formatDimensions(item.product_details)}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Threshold</p>
                                    <p className="text-sm">{item.product_details?.product_threshold || "N/A"}</p>
                                  </div>
                                </div>

                                <div className="mt-4">
                                  <p className="text-sm font-medium mb-2">Product Image</p>
                                  <div className="relative h-48 w-full rounded-md overflow-hidden bg-muted flex items-center justify-center">
                                    <Image
                                      src={`/placeholder.svg?height=200&width=200&text=${encodeURIComponent(item.product_name)}`}
                                      alt={item.product_name}
                                      fill
                                      className="object-contain"
                                    />
                                  </div>
                                </div>

                                {item.product_details?.qr_code && (
                                  <div className="mt-4">
                                    <p className="text-sm font-medium mb-2">QR Code</p>
                                    <div className="relative h-32 w-32 rounded-md overflow-hidden">
                                      <Image
                                        src={`/placeholder.svg?height=128&width=128&text=${encodeURIComponent(`QR: ${item.product_id}`)}`}
                                        alt="QR Code"
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                  </div>
                                )}
                              </TabsContent>

                              <TabsContent value="inventory" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Current Stock</p>
                                    <p className="text-sm">{item.current_stock}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Expected Sales</p>
                                    <p className="text-sm">{item.expected_sales}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Recommended Order</p>
                                    <p className="text-sm font-bold">{item.recommended_order}</p>
                                  </div>

                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">Days in Forecast</p>
                                    <p className="text-sm">{selectedDays}</p>
                                  </div>
                                </div>

                                <div className="mt-4 p-4 bg-muted rounded-md">
                                  <h4 className="text-sm font-medium mb-2">Order Calculation</h4>
                                  <p className="text-sm">
                                    Current Stock: {item.current_stock} <br />
                                    Expected Sales (for {selectedDays} days): {item.expected_sales} <br />
                                    <span className="font-medium mt-2 block">
                                      Recommended Order: {item.recommended_order}
                                    </span>
                                  </p>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          </CardContent>
        </Card>
      ) : (
        calculationAttempted &&
        !loading && (
          <Card>
            <CardContent className="py-10">
              <div className="flex items-center justify-center">
                <p className="text-lg text-gray-500">
                  No recommendations found. Try adjusting your date range or check your inventory data.
                </p>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {!calculationAttempted && !loading && (
        <Card>
          <CardContent className="py-10">
            <div className="flex items-center justify-center">
              <p className="text-lg text-gray-500">
                {stores.length > 0
                  ? "Select a store and date range to calculate order recommendations"
                  : "No stores found. Please add inventory data to your database."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
