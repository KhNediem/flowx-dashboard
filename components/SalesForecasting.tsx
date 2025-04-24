"use client"

import React, { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircularProgress } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

// Only one store, but keep logic scalable
const STORE_ID = 31;

// Helper: Group by date (1 point per date: last value per date)
function groupByDate(data: any[]) {
  const map = new Map();
  data.forEach((row) => {
    map.set(row.date, row.units); // last value per date will remain
  });
  return Array.from(map.entries())
    .map(([date, units]) => ({ date, units }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function SalesForecasting() {
  const supabase = createClientComponentClient();

  const [productIds, setProductIds] = useState<number[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingGraph, setLoadingGraph] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Get available products for the store
  React.useEffect(() => {
    setLoadingProducts(true);
    setProductIds([]);
    setSelectedProduct(null);
    setForecastData([]);
    setHasSearched(false);
    supabase
      .from("sales_forecasts")
      .select("product_id")
      .eq("store_id", STORE_ID)
      .then(({ data, error }) => {
        if (error) {
          setError("Failed to load products.");
          setProductIds([]);
        } else {
          const uniqueIds = Array.from(
            new Set((data ?? []).map((row: any) => row.product_id))
          );
          setProductIds(uniqueIds);
        }
        setLoadingProducts(false);
      });
    // eslint-disable-next-line
  }, []);

  // Fetch forecast when button is clicked
  const handleGenerateGraph = async () => {
    if (!selectedProduct) return;
    setLoadingGraph(true);
    setError(null);
    setHasSearched(true);
    try {
      const { data, error } = await supabase
        .from("sales_forecasts")
        .select("*")
        .eq("store_id", STORE_ID)
        .eq("product_id", selectedProduct)
        .order("date", { ascending: true });
      if (error) throw error;
      setForecastData(data ?? []);
    } catch (err: any) {
      setError("Failed to load forecast data.");
      setForecastData([]);
    } finally {
      setLoadingGraph(false);
    }
  };

  // Prepare graph data: group by date, 1 point per date
  const graphData = groupByDate(forecastData);

  // Debug: log what the chart will show
  console.log("forecastData (raw):", forecastData);
  console.log("graphData (by date):", graphData);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Store Selection: hardcoded for now */}
        <div className="w-40">
          <Select value={String(STORE_ID)} disabled>
            <SelectTrigger>
              <SelectValue placeholder="Store" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(STORE_ID)}>Store {STORE_ID}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Product Selection */}
        <div className="w-40">
          <Select
            value={selectedProduct ? String(selectedProduct) : ""}
            disabled={loadingProducts}
            onValueChange={(val) => setSelectedProduct(Number(val))}
          >
            <SelectTrigger data-testid="product-select">
              <SelectValue placeholder="Product"  />
            </SelectTrigger>
            <SelectContent>
              {productIds.map((pid) => (
                <SelectItem key={pid} value={String(pid)}>
                  Product {pid}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Generate Graph Button */}
        <Button
          onClick={handleGenerateGraph}
          disabled={!selectedProduct || loadingGraph}
          className="min-w-[170px]"
        >
          {loadingGraph ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Generate Graph"
          )}
        </Button>
      </div>
      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm mt-2">{error}</div>
      )}

      {/* Chart Section */}
      <div className="h-[380px] w-full" data-testid="sales-forecast-chart">
        {!hasSearched ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Please select a product and click "Generate Graph" to view sales forecasts.
          </div>
        ) : loadingGraph ? (
          <div className="flex items-center justify-center h-full">
            <CircularProgress />
          </div>
        ) : !graphData.length ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            No forecast data found for the selected product.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => date.slice(5)}
                minTickGap={10}
              />
              <YAxis
                label={{
                  value: "Predicted Units",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 12,
                }}
              />
              <Tooltip
                labelFormatter={(date) => `Date: ${date}`}
                formatter={(units: number) => [`${units}`, "Predicted Units"]}
              />
              <Line
                type="monotone"
                dataKey="units"
                name="Predicted Sales"
                stroke="#1976d2"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}