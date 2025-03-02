import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface SalesData {
  prediction_date: string
  predicted_sales: number
  actual_sales: number
}

export function TimeSeriesComparison({ data }: { data: SalesData[] }) {
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.prediction_date).getTime(),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis
          dataKey="date"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString()}
        />
        <YAxis />
        <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
        <Legend />
        <Line type="monotone" dataKey="predicted_sales" stroke="#8884d8" name="Predicted Sales" />
        <Line type="monotone" dataKey="actual_sales" stroke="#82ca9d" name="Actual Sales" />
      </LineChart>
    </ResponsiveContainer>
  )
}

