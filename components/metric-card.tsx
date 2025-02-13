import { Card, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  change: number
}

export function MetricCard({ title, value, change }: MetricCardProps) {
  const isPositive = change > 0

  return (
    <Card className="bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold">{value}</h2>
            <span className={`flex items-center text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              {Math.abs(change)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

