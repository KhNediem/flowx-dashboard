"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "./ui/separator";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TotalSalesKPI } from "./KPIs/TotalSalesKPI";
import { SalesGrowthKPI } from "./KPIs/SalesGrowthKPI";
import {
  BestSellingProductsKPI,
  LowSellingProductsKPI,
} from "./KPIs/BestSellingProductsKPI";

function groupByPeriod(data, period = "monthly") {
  const groups = {};
  data.forEach((row) => {
    let key;
    if (period === "monthly") key = row.date.slice(0, 7);
    else if (period === "quarterly") key = getQuarter(row.date);
    else if (period === "annually") key = row.date.slice(0, 4);
    if (!groups[key]) groups[key] = 0;
    groups[key] += row.units;
  });
  return Object.entries(groups)
    .map(([period, units]) => ({ period, units }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

function getQuarter(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const quarter = Math.floor(month / 3) + 1;
  return `${year}-Q${quarter}`;
}

function getRecentPeriods(data, period, n) {
  const sorted = [...data].sort((a, b) => a.period.localeCompare(b.period));
  return sorted.slice(-n);
}

export function SalesAnalysis({
  defaultStoreId = null,
  defaultProductId = null,
}) {
  const supabase = createClientComponentClient();
  const [salesData, setSalesData] = useState([]);
  const [stores, setStores] = useState([]); 
  const [products, setProducts] = useState([]);

  // Store and period filters used for KPIs (business-level)
  const [storeId, setStoreId] = useState(
    defaultStoreId ? String(defaultStoreId) : "all"
  );
  const [period, setPeriod] = useState("monthly"); // monthly, quarterly, annually

  
  const [productId, setProductId] = useState(
    defaultProductId ? String(defaultProductId) : "all"
  );

  useEffect(() => {
    fetchFilters();
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();

  }, [storeId, productId, period]);

  async function fetchFilters() {
    const { data: salesIds, error: salesIdsError } = await supabase
      .from("sales")
      .select("store_id, product_id");
    if (salesIdsError || !salesIds) {
      setStores([]);
      setProducts([]);
      return;
    }
    const storeIdSet = new Set(salesIds.map((d) => d.store_id).filter(Boolean));
    const productIdSet = new Set(
      salesIds.map((d) => d.product_id).filter(Boolean)
    );

    const { data: storesData } = await supabase
      .from("stores")
      .select("store_id, store_name");
    setStores((storesData || []).filter((s) => storeIdSet.has(s.store_id)));

    const { data: productsData } = await supabase
      .from("products")
      .select("product_id, product_name");
    setProducts(
      (productsData || []).filter((p) => productIdSet.has(p.product_id))
    );
  }

  async function fetchData() {
    let query = supabase.from("sales");
    query = query
      .select("date, units, store_id, product_id")
      .order("date", { ascending: true });

    if (storeId !== "all") query = query.eq("store_id", storeId);
    if (productId !== "all") query = query.eq("product_id", productId);

    const { data, error } = await query;
    if (!error && data) setSalesData(data);
    else setSalesData([]);
  }

  // Grouped and slice for periods
  let chartData = groupByPeriod(salesData, period);
  chartData =
    period === "monthly"
      ? getRecentPeriods(chartData, period, 12)
      : period === "quarterly"
      ? getRecentPeriods(chartData, period, 4)
      : getRecentPeriods(chartData, period, 5);

  const totalUnits = chartData.reduce((sum, row) => sum + row.units, 0);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Sales Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters and Total Summary Row */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Store Filter */}
          <div>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map((store) => (
                  <SelectItem
                    key={store.store_id}
                    value={String(store.store_id)}
                  >
                    {store.store_name || `Store ${store.store_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Product Filter */}
          <div>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem
                    key={product.product_id}
                    value={String(product.product_id)}
                  >
                    {product.product_name || `Product ${product.product_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Period Filter */}
          <div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Message if nothing selected */}
        {storeId === "all" && productId === "all" ? (
          <div className="my-10 flex flex-col items-center justify-center">
            <span className="text-muted-foreground text-lg">
              Please select a store or product to view sales totals.
            </span>
          </div>
        ) : (
          <>
            {/* Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="units" fill="#4f46e5" name="Units Sold" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        <Separator className="my-6" />
        {/* KPI Cards Row */}
        <div className="flex gap-4 mb-6">
          {/* Only pass storeId and period (not productId) to business KPIs */}
          <TotalSalesKPI storeId={storeId} period={period} />
          <SalesGrowthKPI storeId={storeId} period={period} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Pass both store and product to best/worst product KPIs */}
          <BestSellingProductsKPI
            storeId={storeId}
            productId={productId}
            period={period}
            N={5}
            dateRange={{ start: "2017-01-01", end: "2018-09-30" }}
          />
          <LowSellingProductsKPI
            storeId={storeId}
            productId={productId}
            period={period}
            N={5}
            threshold={200}
            dateRange={{ start: "2017-01-01", end: "2018-09-30" }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
