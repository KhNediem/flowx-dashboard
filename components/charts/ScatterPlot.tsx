import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface SalesData {
  confidence_score: number
  predicted_sales: number
}

export function ScatterPlot({ data }: { data: SalesData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis type="number" dataKey="confidence_score" name="Confidence Score" />
        <YAxis type="number" dataKey="predicted_sales" name="Predicted Sales" />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} />
        <Scatter name="Sales Prediction" data={data} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

