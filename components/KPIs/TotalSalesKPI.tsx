"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card } from "@/components/ui/card";

export function TotalSalesKPI({ storeId = "all", period = "month" }) {
  const supabase = createClientComponentClient();
  const [currUnits, setCurrUnits] = useState(0);

  function getPeriodRange(period: string) {
    if (period === "monthly") {
      return { start: "2018-09-01", end: "2018-09-30" };
    }
    if (period === "quarterly") {
      return { start: "2018-07-01", end: "2018-09-30" };
    }
    return { start: "2018-01-01", end: "2018-12-31" };
  }

  useEffect(() => {
    async function fetchUnits() {
      const { start, end } = { start: "2017-01-01", end: "2018-08-31" };

      let query = supabase
        .from("sales")
        .select("units")
        .gte("date", start)
        .lte("date", end);

      if (storeId && storeId !== "all") {
        query = query.eq("store_id", storeId);
      }

      const { data } = await query;
      const totalCurr = (data || []).reduce(
        (sum: number, row: any) => sum + (row.units || 0),
        0
      );
      setCurrUnits(totalCurr);
    }
    fetchUnits();
    // eslint-disable-next-line
  }, [storeId, period]);

  return (
    <Card className="flex-1 bg-[#4f46e5] text-white rounded-2xl shadow-md p-6 flex flex-col justify-center min-w-[220px]">
      <div className="text-3xl font-bold mb-1">
        {currUnits.toLocaleString()}
      </div>
      <div className="text-md font-medium opacity-80 tracking-wide">
        Units Sold{" "}
        {period === "monthly"
          ? "This Month"
          : period === "quarterly"
          ? "This Quarter"
          : period === "annually"
          ? "This Year"
          : ""}
      </div>
    </Card>
  );
}
