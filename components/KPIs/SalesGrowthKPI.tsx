"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Sparklines, SparklinesLine } from "react-sparklines";

function getPeriodRange(period: string) {
  if (period === "monthly") {
    return {
      curr: { start: "2018-09-01", end: "2018-09-30" },
      prev: { start: "2018-08-01", end: "2018-08-31" },
      label: "Month-over-Month",
    };
  }
  if (period === "quarterly") {
    return {
      curr: { start: "2018-07-01", end: "2018-09-30" },
      prev: { start: "2018-04-01", end: "2018-06-30" },
      label: "Quarter-over-Quarter",
    };
  }
  return {
    curr: { start: "2018-01-01", end: "2018-12-31" },
    prev: { start: "2017-01-01", end: "2017-12-31" },
    label: "Year-over-Year",
  };
}


export function SalesGrowthKPI({ storeId = "all", period = "month" }) {
  const supabase = createClientComponentClient();
  const [currUnits, setCurrUnits] = useState(0);
  const [prevUnits, setPrevUnits] = useState(0);
  const [growth, setGrowth] = useState(0);
  const [trend, setTrend] = useState<number[]>([]);

  useEffect(() => {
    async function fetchKPI() {
      const { curr, prev } = getPeriodRange(period);

      let currQuery = supabase.from("sales")
        .select("units")
        .gte("date", curr.start).lte("date", curr.end);

      let prevQuery = supabase.from("sales")
        .select("units")
        .gte("date", prev.start).lte("date", prev.end);

      if (storeId && storeId !== "all") {
        currQuery = currQuery.eq("store_id", storeId);
        prevQuery = prevQuery.eq("store_id", storeId);
      }

      const { data: currData } = await currQuery;
      const totalCurr = (currData || []).reduce((sum: number, row: any) => sum + (row.units || 0), 0);
      setCurrUnits(totalCurr);

      const { data: prevData } = await prevQuery;
      const totalPrev = (prevData || []).reduce((sum: number, row: any) => sum + (row.units || 0), 0);
      setPrevUnits(totalPrev);

      let growthPct = 0;
      if (totalPrev !== 0) {
        growthPct = ((totalCurr - totalPrev) / totalPrev) * 100;
      } else if (totalCurr !== 0) {
        growthPct = 100;
      } else {
        growthPct = 0;
      }
      setGrowth(growthPct);

      // Sparkline: last 12 months for "year", last 6 months for "month", last 8 weeks for "week"
      let sparkStart = "2017-10-01";
      let sparkEnd = "2018-09-30";
      if (period === "month") {
        sparkStart = "2018-04-01";
        sparkEnd = "2018-09-30";
      } else if (period === "week") {
        sparkStart = "2018-08-01";
        sparkEnd = "2018-09-30";
      }

      let trendQuery = supabase.from("sales").select("date, units").order("date", { ascending: true });
      if (storeId && storeId !== "all") trendQuery = trendQuery.eq("store_id", storeId);
      trendQuery = trendQuery.gte("date", sparkStart).lte("date", sparkEnd);

      const { data: trendData } = await trendQuery;
      // Group trend by period for the sparkline
      let grouped: { [key: string]: number } = {};
      if (period === "year" || period === "month") {
        // group by month
        (trendData || []).forEach((d: any) => {
          const month = d.date.slice(0, 7);
          grouped[month] = (grouped[month] || 0) + (d.units || 0);
        });
      } else {
        // group by week (ISO week)
        (trendData || []).forEach((d: any) => {
          // get ISO week (YYYY-Www)
          const dateObj = new Date(d.date);
          const year = dateObj.getFullYear();
          // simple calculation (not strictly ISO, but good enough for sparkline)
          const firstJan = new Date(year, 0, 1);
          const week = Math.ceil(((dateObj.getTime() - firstJan.getTime()) / 86400000 + firstJan.getDay() + 1) / 7);
          const weekStr = `${year}-W${String(week).padStart(2, "0")}`;
          grouped[weekStr] = (grouped[weekStr] || 0) + (d.units || 0);
        });
      }
      setTrend(Object.values(grouped));
    }
    fetchKPI();
    // eslint-disable-next-line
  }, [storeId, period]);

  const growthColor = growth > 0 ? "text-green-500" : growth < 0 ? "text-red-500" : "text-muted-foreground";
  const arrowIcon = growth > 0 ? <ArrowUpRight className="w-5 h-5 inline" /> : <ArrowDownRight className="w-5 h-5 inline" />;
  const { label } = getPeriodRange(period);

  return (
    <Card className="flex-1 rounded-2xl shadow-md p-6 flex flex-col justify-center min-w-[220px]">
      <div className={`text-2xl font-bold mb-1 flex items-center gap-2 ${growthColor}`}>
        {growth === 0 ? "" : arrowIcon}
        {growth > 0 && "+"}
        {growth.toFixed(1)}%
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">{label} Sales Growth</span>
        <span className="h-6 w-24 flex items-center">
          {trend.length > 1 && (
            <Sparklines data={trend} width={80} height={24}>
              <SparklinesLine color={growth > 0 ? "#10b981" : "#ef4444"} style={{ strokeWidth: 3, fill: "none" }} />
            </Sparklines>
          )}
        </span>
      </div>
    </Card>
  );
}
