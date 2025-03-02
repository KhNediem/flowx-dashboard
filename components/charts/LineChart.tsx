import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface ChartData {
  prediction_date: string
  confidence_score: number
  predicted_sales?: number
}

export function LineChart({ data }: { data: ChartData[] }) {
  const chartData = data.map((item) => ({
    ...item,
    date: new Date(item.prediction_date).getTime(),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis
          dataKey="date"
          type="number"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString()}
        />
        <YAxis />
        <Tooltip labelFormatter={(value) => new Date(value).toLocaleDateString()} />
        <Line type="monotone" dataKey="confidence_score" stroke="#8884d8" name="Confidence Score" />
        {data[0].predicted_sales !== undefined && (
          <Line type="monotone" dataKey="predicted_sales" stroke="#82ca9d" name="Predicted Sales" />
        )}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

