import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

interface ShiftData {
  profile_id: number
  predicted_shift_start: string
  predicted_shift_end: string
  confidence_score: number
}

export function GanttChart({ data }: { data: ShiftData[] }) {
  const chartData = data.map((shift) => ({
    profile_id: shift.profile_id,
    start: new Date(shift.predicted_shift_start).getTime(),
    duration: new Date(shift.predicted_shift_end).getTime() - new Date(shift.predicted_shift_start).getTime(),
  }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis
          type="number"
          dataKey="start"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString()}
        />
        <YAxis type="category" dataKey="profile_id" />
        <Tooltip
          labelFormatter={(value) => `Start: ${new Date(value).toLocaleString()}`}
          formatter={(value, name) => {
            if (name === "duration") {
              const hours = Math.floor(value / 3600000)
              const minutes = Math.floor((value % 3600000) / 60000)
              return [`${hours}h ${minutes}m`, "Duration"]
            }
            return [value, name]
          }}
        />
        <Bar dataKey="duration" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}

