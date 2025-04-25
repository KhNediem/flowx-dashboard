"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card } from "@/components/ui/card";
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from "recharts";

// Helper for product names
async function fetchProductNames(supabase, productIds) {
  if (productIds.length === 0) return {};
  const { data } = await supabase
    .from("products")
    .select("product_id, product_name")
    .in("product_id", productIds);
  const nameMap = {};
  (data || []).forEach(p => { nameMap[p.product_id] = p.product_name; });
  return nameMap;
}

// --- 1. Best-Selling Products ---
export function BestSellingProductsKPI({
    storeId = "all",
    period = "monthly",
    N = 5,
    dateRange,
  }: {
    storeId?: string | number,
    period?: string,
    N?: number,
    dateRange?: { start: string; end: string } | null,
  }){
  const supabase = createClientComponentClient();
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    async function fetchTopProducts() {
      // Determine date range
      let start, end;
      if (dateRange && dateRange.start && dateRange.end) {
        start = dateRange.start; end = dateRange.end;
      } else {
        // fallback: this year (adjust as needed for your legacy/demo)
        start = "2019-01-01";
        end = "2019-12-31";
      }

      let query = supabase
        .from("sales")
        .select("product_id, units")
        .gte("date", start)
        .lte("date", end);

      if (storeId && storeId !== "all") query = query.eq("store_id", storeId);

      const { data } = await query;
      // Aggregate: { [product_id]: total_units }
      const totals = {};
      (data || []).forEach(row => {
        if (!row.product_id) return;
        totals[row.product_id] = (totals[row.product_id] || 0) + (row.units || 0);
      });

      // Sort, take top N
      const sorted = Object.entries(totals)
        .map(([product_id, total_units]) => ({ product_id: Number(product_id), total_units }))
        .sort((a, b) => b.total_units - a.total_units)
        .slice(0, N);

      // Fetch product names for display
      const nameMap = await fetchProductNames(supabase, sorted.map(p => p.product_id));
      const products = sorted.map(p => ({
        ...p,
        product_name: nameMap[p.product_id] || `Product ${p.product_id}`
      }));

      setTopProducts(products);
    }
    fetchTopProducts();
    // eslint-disable-next-line
  }, [storeId, period, N, dateRange && dateRange.start, dateRange && dateRange.end]);

  return (
    <Card className="p-4 mb-4 shadow rounded-xl">
      <div className="font-semibold mb-3 text-lg">Best-Selling Products</div>
      {topProducts.length === 0 ? (
        <div className="text-muted-foreground text-sm">No data for this period.</div>
      ) : (
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={topProducts.reverse()} // show highest at top of y axis
              layout="vertical"
              margin={{ top: 8, right: 20, left: 50, bottom: 8 }}
            >
              <XAxis type="number" />
              <YAxis dataKey="product_name" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="total_units" fill="#4f46e5" radius={[6, 6, 6, 6]}>
                <LabelList dataKey="total_units" position="right" />
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

// --- 2. Low-Selling Products ---
export function LowSellingProductsKPI({
    storeId = "all",
    period = "monthly",
    N = 5,
    threshold = 1,
    dateRange,
  }: {
    storeId?: string | number,
    period?: string,
    N?: number,
    threshold?: number,
    dateRange?: { start: string; end: string } | null,
  }) {
  const supabase = createClientComponentClient();
  const [bottomProducts, setBottomProducts] = useState([]);

  useEffect(() => {
    async function fetchBottomProducts() {
      let start, end;
      if (dateRange && dateRange.start && dateRange.end) {
        start = dateRange.start; end = dateRange.end;
      } else {
        // fallback: this year (adjust for demo/legacy)
        start = "2019-01-01";
        end = "2019-12-31";
      }

      let query = supabase
        .from("sales")
        .select("product_id, units")
        .gte("date", start)
        .lte("date", end);

      if (storeId && storeId !== "all") query = query.eq("store_id", storeId);

      const { data } = await query;
      // Aggregate: { [product_id]: total_units }
      const totals = {};
      (data || []).forEach(row => {
        if (!row.product_id) return;
        totals[row.product_id] = (totals[row.product_id] || 0) + (row.units || 0);
      });

      // Filter out products above threshold, sort, take bottom N
      const sorted = Object.entries(totals)
        .map(([product_id, total_units]) => ({ product_id: Number(product_id), total_units }))
        .filter(p => p.total_units <= threshold)
        .sort((a, b) => a.total_units - b.total_units)
        .slice(0, N);

      // Fetch product names
      const nameMap = await fetchProductNames(supabase, sorted.map(p => p.product_id));
      const products = sorted.map(p => ({
        ...p,
        product_name: nameMap[p.product_id] || `Product ${p.product_id}`
      }));

      setBottomProducts(products);
    }
    fetchBottomProducts();
    // eslint-disable-next-line
  }, [storeId, period, N, threshold, dateRange && dateRange.start, dateRange && dateRange.end]);

  return (
    <Card className="p-4 mb-4 shadow rounded-xl">
      <div className="font-semibold mb-3 text-lg">Low-Selling Products</div>
      {bottomProducts.length === 0 ? (
        <div className="text-muted-foreground text-sm">No products below threshold for this period.</div>
      ) : (
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={bottomProducts}
              layout="vertical"
              margin={{ top: 8, right: 20, left: 50, bottom: 8 }}
            >
              <XAxis type="number" />
              <YAxis dataKey="product_name" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="total_units" fill="#f59e42" radius={[6, 6, 6, 6]}>
                <LabelList dataKey="total_units" position="right" />
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}