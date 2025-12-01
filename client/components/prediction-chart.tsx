"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { PredictionHistoryItem } from "@/types/analysis"

interface PredictionChartProps {
    history: PredictionHistoryItem[]
    maxItems?: number
}

const classNames = ["Up", "Stationary", "Down"]
const classColors = {
    0: "#22c55e", // green for Up
    1: "#eab308", // yellow for Stationary
    2: "#ef4444", // red for Down
}

export default function PredictionChart({ history, maxItems = 50 }: PredictionChartProps) {
    // Take only the last N items
    const displayData = history.slice(-maxItems)

    // Format data for the chart
    const chartData = displayData.map((item) => ({
        time: new Date(item.timestamp).toLocaleTimeString(),
        timestamp: item.timestamp,
        TLOB: item.tlobPrediction,
        MLPLOB: item.mlplobPrediction,
        tlobConf: (item.tlobConfidence * 100).toFixed(1),
        mlplobConf: (item.mlplobConfidence * 100).toFixed(1),
    }))

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium mb-2">{data.time}</p>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-xs">TLOB: {classNames[data.TLOB]} ({data.tlobConf}%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-purple-500" />
                            <span className="text-xs">MLPLOB: {classNames[data.MLPLOB]} ({data.mlplobConf}%)</span>
                        </div>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Prediction Timeline</CardTitle>
                <CardDescription>Real-time prediction history (last {maxItems} predictions)</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="time"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            domain={[0, 2]}
                            ticks={[0, 1, 2]}
                            tickFormatter={(value) => classNames[value]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: "12px" }}
                            iconType="circle"
                        />
                        <Line
                            type="monotone"
                            dataKey="TLOB"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: "#3b82f6", r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="MLPLOB"
                            stroke="#a855f7"
                            strokeWidth={2}
                            dot={{ fill: "#a855f7", r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
