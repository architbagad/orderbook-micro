"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import type { AnalysisResults } from "@/types/analysis"
import { calculateStats, calculateAverageProbabilities, calculateConfidenceStats } from "@/lib/analysis-utils"

interface ChartDisplayProps {
  results: AnalysisResults
}

export default function ChartDisplay({ results }: ChartDisplayProps) {
  const tlobStats = calculateStats(results.tlob.predictions)
  const mlplobStats = calculateStats(results.mlplob.predictions)

  const tlobAvgProbs = calculateAverageProbabilities(results.tlob.probabilities)
  const mlplobAvgProbs = calculateAverageProbabilities(results.mlplob.probabilities)

  const tlobConfidence = calculateConfidenceStats(results.tlob.probabilities)
  const mlplobConfidence = calculateConfidenceStats(results.mlplob.probabilities)

  // Probability comparison data
  const probabilityData = [
    {
      name: "Up",
      TLOB: Number(tlobAvgProbs.up.toFixed(1)),
      MLPLOB: Number(mlplobAvgProbs.up.toFixed(1)),
    },
    {
      name: "Stationary",
      TLOB: Number(tlobAvgProbs.stationary.toFixed(1)),
      MLPLOB: Number(mlplobAvgProbs.stationary.toFixed(1)),
    },
    {
      name: "Down",
      TLOB: Number(tlobAvgProbs.down.toFixed(1)),
      MLPLOB: Number(mlplobAvgProbs.down.toFixed(1)),
    },
  ]

  // Prediction count comparison
  const comparisonData = [
    {
      name: "Up",
      TLOB: Number.parseFloat(tlobStats.up),
      MLPLOB: Number.parseFloat(mlplobStats.up),
    },
    {
      name: "Stationary",
      TLOB: Number.parseFloat(tlobStats.stationary),
      MLPLOB: Number.parseFloat(mlplobStats.stationary),
    },
    {
      name: "Down",
      TLOB: Number.parseFloat(tlobStats.down),
      MLPLOB: Number.parseFloat(mlplobStats.down),
    },
  ]

  const pieData = [
    { name: "Up", value: Number(tlobAvgProbs.up.toFixed(1)) },
    { name: "Stationary", value: Number(tlobAvgProbs.stationary.toFixed(1)) },
    { name: "Down", value: Number(tlobAvgProbs.down.toFixed(1)) },
  ]

  // Confidence distribution data
  const confidenceData = [
    {
      name: "High (≥70%)",
      TLOB: tlobConfidence.high,
      MLPLOB: mlplobConfidence.high,
    },
    {
      name: "Medium (50-70%)",
      TLOB: tlobConfidence.medium,
      MLPLOB: mlplobConfidence.medium,
    },
    {
      name: "Low (<50%)",
      TLOB: tlobConfidence.low,
      MLPLOB: mlplobConfidence.low,
    },
  ]

  const colors = ["#10b981", "#eab308", "#ef4444"]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Visualizations</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Probability Comparison */}
        <div className="border border-border rounded-lg bg-card/50 p-6">
          <h4 className="text-sm font-medium mb-4 text-muted-foreground">Average Probability Comparison</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={probabilityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(20,20,20,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Bar dataKey="TLOB" fill="#10b981" />
              <Bar dataKey="MLPLOB" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Prediction Count Comparison */}
        <div className="border border-border rounded-lg bg-card/50 p-6">
          <h4 className="text-sm font-medium mb-4 text-muted-foreground">Prediction Count Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(20,20,20,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Bar dataKey="TLOB" fill="#a1a1a1" />
              <Bar dataKey="MLPLOB" fill="#525252" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TLOB Probability Distribution */}
        <div className="border border-border rounded-lg bg-card/50 p-6">
          <h4 className="text-sm font-medium mb-4 text-muted-foreground">TLOB Probability Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {colors.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence Distribution */}
        <div className="border border-border rounded-lg bg-card/50 p-6">
          <h4 className="text-sm font-medium mb-4 text-muted-foreground">Confidence Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={confidenceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(20,20,20,0.9)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="TLOB" fill="#8b5cf6" />
              <Bar dataKey="MLPLOB" fill="#ec4899" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confidence Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-border rounded-lg bg-card/50 p-6">
          <h4 className="text-sm font-medium mb-4 text-muted-foreground">TLOB Confidence Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Average Confidence:</span>
              <span className="text-lg font-bold">{tlobConfidence.average}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Min Confidence:</span>
              <span className="text-lg font-bold">{tlobConfidence.min}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Max Confidence:</span>
              <span className="text-lg font-bold">{tlobConfidence.max}%</span>
            </div>
          </div>
        </div>

        <div className="border border-border rounded-lg bg-card/50 p-6">
          <h4 className="text-sm font-medium mb-4 text-muted-foreground">MLPLOB Confidence Stats</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Average Confidence:</span>
              <span className="text-lg font-bold">{mlplobConfidence.average}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Min Confidence:</span>
              <span className="text-lg font-bold">{mlplobConfidence.min}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Max Confidence:</span>
              <span className="text-lg font-bold">{mlplobConfidence.max}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
