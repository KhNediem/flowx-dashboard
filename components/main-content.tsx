"use client"

import { Line, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from "chart.js"
import { MetricCard } from "./metric-card"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

export function MainContent() {
  const lineChartData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
    datasets: [
      {
        label: "Current Week",
        data: [10, 15, 8, 12, 20, 15, 18],
        borderColor: "rgb(99, 102, 241)",
        tension: 0.4,
      },
      {
        label: "Next Week",
        data: [8, 12, 10, 15, 18, 20, 22],
        borderColor: "rgba(99, 102, 241, 0.4)",
        borderDash: [5, 5],
        tension: 0.4,
      },
    ],
  }

  const barChartData = {
    labels: ["Flavor 1", "Flavor 2", "Flavor 3", "Flavor 4", "Flavor 5", "Flavor 6"],
    datasets: [
      {
        label: "Demand",
        data: [65, 45, 75, 35, 55, 40],
        backgroundColor: "rgb(99, 102, 241)",
      },
    ],
  }

  return (
    <main className="flex-1 overflow-y-auto p-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Sales" value="721K" change={11.01} />
        <MetricCard title="Orders" value="367K" change={-0.03} />
        <MetricCard title="Inventory" value="1,156" change={15.03} />
        <MetricCard title="Next Month" value="239K" change={4.08} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4">
            <h3 className="text-2xl font-semibold">Total Sales</h3>
            <p className="text-sm text-muted-foreground">Comparing current and next week</p>
          </div>
          <div className="h-[300px]">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: "rgba(255, 255, 255, 0.1)",
                    },
                  },
                  x: {
                    grid: {
                      color: "rgba(255, 255, 255, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4">
            <h3 className="text-2xl font-semibold">Next Month Demand</h3>
            <p className="text-sm text-muted-foreground">Projected demand by flavor</p>
          </div>
          <div className="h-[300px]">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: "rgba(255, 255, 255, 0.1)",
                    },
                  },
                  x: {
                    grid: {
                      color: "rgba(255, 255, 255, 0.1)",
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

