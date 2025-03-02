import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface ShiftData {
  store_id: number
  predicted_shift_start: string
  confidence_score: number
}

export function BarChart({ data }: { data: ShiftData[] }) {
  const chartData = data.reduce(
    (acc, shift) => {
      const storeId = shift.store_id
      if (!acc[storeId]) {
        acc[storeId] = { store_id: storeId, shiftCount: 0 }
      }
      acc[storeId].shiftCount++
      return acc
    },
    {} as Record<number, { store_id: number; shiftCount: number }>,
  )

  const barChartData = Object.values(chartData)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis dataKey="store_id" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="shiftCount" fill="#8884d8" name="Number of Shifts" />
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}

