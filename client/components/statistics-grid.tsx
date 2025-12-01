"use client"

import type { Summary } from "@/types/analysis"

interface StatisticsGridProps {
  summary: Summary
}

export default function StatisticsGrid({ summary }: StatisticsGridProps) {
  const stats = [
    {
      label: "Total Rows",
      value: summary.total_rows.toLocaleString(),
      sublabel: "Data points analyzed",
    },
    {
      label: "Symbol",
      value: summary.symbol,
      sublabel: "Trading pair",
    },
    {
      label: "Time Range",
      value: `${summary.time_range.start}`,
      sublabel: `to ${summary.time_range.end}`,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, idx) => (
        <div key={idx} className="p-4 border border-border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
          <p className="text-xs font-medium text-muted-foreground mb-1">{stat.label}</p>
          <p className="text-2xl font-bold mb-1">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
        </div>
      ))}
    </div>
  )
}
