"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProbabilityChartProps {
    tlobProbabilities: number[]
    mlplobProbabilities: number[]
    classNames: string[]
}

const classColors = ["#22c55e", "#eab308", "#ef4444"] // Up, Stationary, Down

export default function ProbabilityChart({ tlobProbabilities, mlplobProbabilities, classNames }: ProbabilityChartProps) {
    const chartData = classNames.map((name, index) => ({
        class: name,
        TLOB: (tlobProbabilities[index] * 100).toFixed(1),
        MLPLOB: (mlplobProbabilities[index] * 100).toFixed(1),
        color: classColors[index],
    }))

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium mb-2">{payload[0].payload.class}</p>
                    <div className="space-y-1">
                        <p className="text-xs">TLOB: {payload[0].value}%</p>
                        <p className="text-xs">MLPLOB: {payload[1].value}%</p>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Probability Distribution</CardTitle>
                <CardDescription>Latest prediction probabilities</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="class"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            label={{ value: "Probability (%)", angle: -90, position: "insideLeft", fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ fontSize: "12px" }}
                            iconType="circle"
                        />
                        <Bar dataKey="TLOB" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-tlob-${index}`} fill="#3b82f6" opacity={0.8} />
                            ))}
                        </Bar>
                        <Bar dataKey="MLPLOB" fill="#a855f7" radius={[8, 8, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-mlplob-${index}`} fill="#a855f7" opacity={0.8} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
