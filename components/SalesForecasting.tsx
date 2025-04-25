"use client"

import React, { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CircularProgress } from "@mui/material"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"

// Helper: Group by date (1 point per date: last value per date)
function groupByDate(data: any[]) {
  const map = new Map()
  data.forEach((row) => {
    map.set(row.date, row.units) // last value per date will remain
  })
  return Array.from(map.entries())
    .map(([date, units]) => ({ date, units }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function SalesForecasting() {
  const supabase = createClientComponentClient()

  const [products, setProducts] = useState<{id: number, name: string}[]>([])
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [forecastData, setForecastData] = useState<any[]>([])
  const [selectedStore, setSelectedStore] = useState<number | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingStores, setLoadingStores] = useState(false)
  const [loadingGraph, setLoadingGraph] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [stores, setStores] = useState<{id: number, name: string}[]>([])

  // Fetch available stores with names
  React.useEffect(() => {
    setLoadingStores(true)
    setError(null)
    console.log("Fetching stores...")

    supabase
      .from("stores")
      .select("store_id, store_name, city_id")
      .order("store_name")
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching stores:", error)
          setError("Failed to load stores: " + error.message)
          setStores([])
        } else {
          console.log("Stores data received:", data)
          const storeData = (data ?? []).map((store: any) => ({
            id: store.store_id,
            name: store.store_name || `Store ${store.store_id}`
          }))
          console.log("Processed store data:", storeData)
          setStores(storeData)
          // If we have stores, select the first one by default
          if (storeData.length > 0) {
            setSelectedStore(storeData[0].id)
          }
        }
        setLoadingStores(false)
      })
      .catch((err) => {
        console.error("Exception fetching stores:", err)
        setError("Exception loading stores: " + err.message)
        setLoadingStores(false)
      })
  }, [supabase]) // Add supabase as a dependency

  // Get available products for the store with product names
  React.useEffect(() => {
    if (!selectedStore) {
      console.log("No store selected, skipping product fetch")
      return
    }

    console.log(`Fetching products for store ID: ${selectedStore}`)
    setLoadingProducts(true)
    setProducts([])
    setSelectedProduct(null)
    setForecastData([])
    setHasSearched(false)

    // First get product IDs that have forecast data for this store
    supabase
      .from("sales_forecasts")
      .select("product_id")
      .eq("store_id", selectedStore)
      .then(async ({ data: forecastProducts, error: forecastError }) => {
        if (forecastError) {
          console.error("Error fetching product forecasts:", forecastError)
          setError("Failed to load products: " + forecastError.message)
          setProducts([])
          setLoadingProducts(false)
          return
        }
        
        // Extract unique product IDs
        const uniqueProductIds = Array.from(
          new Set((forecastProducts ?? []).map((row: any) => row.product_id))
        )
        
        if (uniqueProductIds.length === 0) {
          console.log("No products with forecasts found for this store")
          setProducts([])
          setLoadingProducts(false)
          return
        }
        
        // Now fetch product details for these IDs
        try {
          const { data: productDetails, error: productError } = await supabase
            .from("products")
            .select("product_id, product_name, product_category, brand_id")
            .in("product_id", uniqueProductIds)
            .order("product_name")
          
          if (productError) throw productError
          
          const processedProducts = (productDetails ?? []).map((product: any) => ({
            id: product.product_id,
            name: product.product_name || `Product ${product.product_id}`,
            category: product.product_category,
            brandId: product.brand_id
          }))
          
          console.log("Products with details:", processedProducts)
          setProducts(processedProducts)
          
          // Select first product by default if available
          if (processedProducts.length > 0) {
            setSelectedProduct(processedProducts[0].id)
          }
        } catch (err: any) {
          console.error("Error fetching product details:", err)
          setError("Failed to load product details: " + err.message)
          setProducts([])
        }
        
        setLoadingProducts(false)
      })
      .catch((err) => {
        console.error("Exception fetching products:", err)
        setError("Exception loading products: " + err.message)
        setLoadingProducts(false)
      })
  }, [selectedStore, supabase])

  // Fetch forecast when button is clicked
  const handleGenerateGraph = async () => {
    if (!selectedProduct || !selectedStore) return
    setLoadingGraph(true)
    setError(null)
    setHasSearched(true)

    try {
      // Direct API call to Flask server with store_id and product_id
      const response = await fetch(`http://127.0.0.1:5000/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          store_id: selectedStore,
          product_id: selectedProduct
        }),
      })

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Flask API error: ${errorText}`);
      }

      const result = await response.json();
      console.log("Forecast Result:", result);

      if (!result.forecast || result.forecast.length === 0) {
        throw new Error("No forecast data available for this product and store combination");
      }

      // Set forecast data to the state
      setForecastData(result.forecast ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load forecast.");
      setForecastData([]);
    } finally {
      setLoadingGraph(false);
    }
  }

  // Prepare graph data: group by date, 1 point per date
  const graphData = groupByDate(forecastData);

  // Find the selected product's full info
  const selectedProductInfo = products.find(p => p.id === selectedProduct);
  
  // Find the selected store's full info
  const selectedStoreInfo = stores.find(s => s.id === selectedStore);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Store Selection with names */}
        <div className="w-64">
          <Select
            value={selectedStore ? String(selectedStore) : ""}
            onValueChange={(val) => setSelectedStore(Number(val))}
            disabled={loadingStores}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingStores ? "Loading stores..." : "Select Store"} />
            </SelectTrigger>
            <SelectContent>
              {stores.length === 0 && !loadingStores ? (
                <SelectItem value="no-stores" disabled>
                  No stores found
                </SelectItem>
              ) : (
                stores.map((store) => (
                  <SelectItem key={store.id} value={String(store.id)}>
                    {store.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {loadingStores && <div className="mt-1 text-xs text-muted-foreground">Loading stores...</div>}
        </div>
        
        {/* Product Selection with names */}
        <div className="w-64">
          <Select
            value={selectedProduct ? String(selectedProduct) : ""}
            disabled={loadingProducts}
            onValueChange={(val) => setSelectedProduct(Number(val))}
          >
            <SelectTrigger data-testid="product-select">
              <SelectValue placeholder={loadingProducts ? "Loading products..." : "Select Product"} />
            </SelectTrigger>
            <SelectContent>
              {products.length === 0 && !loadingProducts ? (
                <SelectItem value="no-products" disabled>
                  No products found
                </SelectItem>
              ) : (
                products.map((product) => (
                  <SelectItem key={product.id} value={String(product.id)}>
                    {product.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {loadingProducts && <div className="mt-1 text-xs text-muted-foreground">Loading products...</div>}
        </div>
        
        {/* Generate Graph Button */}
        <Button onClick={handleGenerateGraph} disabled={!selectedProduct || !selectedStore || loadingGraph} className="min-w-[170px]">
          {loadingGraph ? <CircularProgress size={20} color="inherit" /> : "Load Forecast"}
        </Button>
      </div>
      
      {/* Selected Items Summary */}
      {selectedStoreInfo && selectedProductInfo && (
        <div className="text-sm text-muted-foreground">
          Viewing forecasts for <span className="font-medium">{selectedProductInfo.name}</span> at <span className="font-medium">{selectedStoreInfo.name}</span>
          {selectedProductInfo.category && <span> (Category: {selectedProductInfo.category})</span>}
        </div>
      )}
      
      {/* Error Message */}
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

      {/* Chart Section */}
      <div className="h-[380px] w-full" data-testid="sales-forecast-chart">
        {!hasSearched ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Please select a product and store, then click "Load Forecast" to view sales data.
          </div>
        ) : loadingGraph ? (
          <div className="flex items-center justify-center h-full">
            <CircularProgress />
          </div>
        ) : !graphData.length ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No forecast data available for the selected product and store.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => date.slice(5)} minTickGap={10} />
              <YAxis
                label={{
                  value: "Units",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 12,
                }}
              />
              <Tooltip
                labelFormatter={(date) => `Date: ${date}`}
                formatter={(units: number) => [`${units}`, "Units"]}
              />
              <Line
                type="monotone"
                dataKey="units"
                name="Sales Units"
                stroke="#1976d2"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      {/* Data Table (Optional) */}
      {forecastData.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Forecast Data</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Units</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {forecastData.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">{item.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}