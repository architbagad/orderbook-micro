"use client"

import { useState } from "react"
import { calculateStats, getMostLikelyPrediction, calculateAverageProbabilities, getConfidenceScore } from "@/lib/analysis-utils"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { ModelMetadata } from "@/types/analysis"

interface PredictionCardProps {
  title: string
  subtitle: string
  predictions: number[]
  probabilities: number[][]
  modelType: "tlob" | "mlplob"
  metadata?: ModelMetadata
}

export default function PredictionCard({
  title,
  subtitle,
  predictions,
  probabilities,
  modelType,
  metadata
}: PredictionCardProps) {
  const [showMetadata, setShowMetadata] = useState(false)
  const stats = calculateStats(predictions)
  const mostLikely = getMostLikelyPrediction(predictions)
  const avgProbs = calculateAverageProbabilities(probabilities)
  const confidenceScore = getConfidenceScore(probabilities)

  const predictionLabels: Record<string, { label: string; color: string; bgColor: string }> = {
    Up: { label: "⬆️ Price Up", color: "border-green-500/30", bgColor: "bg-green-500/10" },
    Stationary: { label: "➡️ Stationary", color: "border-yellow-500/30", bgColor: "bg-yellow-500/10" },
    Down: { label: "⬇️ Price Down", color: "border-red-500/30", bgColor: "bg-red-500/10" },
  }

  const probabilityColors = {
    up: "bg-green-500",
    stationary: "bg-yellow-500",
    down: "bg-red-500",
  }

  return (
    <div className="border border-border rounded-lg bg-card/50 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      {/* Confidence Score */}
      <div className="p-4 rounded-lg border border-border bg-muted/30">
        <p className="text-xs font-medium text-muted-foreground mb-2">Average Confidence</p>
        <div className="flex items-end gap-2">
          <p className="text-3xl font-bold">{confidenceScore.toFixed(1)}%</p>
          <p className="text-sm text-muted-foreground mb-1">
            {confidenceScore >= 70 ? "High" : confidenceScore >= 50 ? "Medium" : "Low"}
          </p>
        </div>
      </div>

      {/* Most Likely */}
      <div className={`p-4 rounded-lg border ${predictionLabels[mostLikely].color} ${predictionLabels[mostLikely].bgColor}`}>
        <p className="text-xs font-medium text-muted-foreground mb-1">Most Likely Prediction</p>
        <p className="text-2xl font-bold">{predictionLabels[mostLikely].label}</p>
      </div>

      {/* Probability Distribution */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Average Probabilities</p>

        {/* Up */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">⬆️ Up</span>
            <span className="font-bold">{avgProbs.up.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-2">
            <div
              className={`${probabilityColors.up} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${avgProbs.up}%` }}
            />
          </div>
        </div>

        {/* Stationary */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">➡️ Stationary</span>
            <span className="font-bold">{avgProbs.stationary.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-2">
            <div
              className={`${probabilityColors.stationary} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${avgProbs.stationary}%` }}
            />
          </div>
        </div>

        {/* Down */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">⬇️ Down</span>
            <span className="font-bold">{avgProbs.down.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-2">
            <div
              className={`${probabilityColors.down} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${avgProbs.down}%` }}
            />
          </div>
        </div>
      </div>

      {/* Prediction Count Statistics */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Prediction Distribution</p>
        {Object.entries(stats).map(([key, value]) => {
          const label = key === "up" ? "⬆️ Up" : key === "stationary" ? "➡️ Stationary" : "⬇️ Down"
          return (
            <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">{label}</span>
              <span className="text-lg font-bold">{value}%</span>
            </div>
          )
        })}
      </div>

      {/* Model Metadata */}
      {metadata && (
        <div className="pt-3 border-t border-border">
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Model Details</span>
            {showMetadata ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showMetadata && (
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Architecture:</span>
                <span className="font-medium">{metadata.architecture}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sequence Size:</span>
                <span className="font-medium">{metadata.sequence_size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Layers:</span>
                <span className="font-medium">{metadata.num_layers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hidden Dim:</span>
                <span className="font-medium">{metadata.hidden_dim}</span>
              </div>
              {metadata.num_heads && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attention Heads:</span>
                  <span className="font-medium">{metadata.num_heads}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                {metadata.description}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Total Predictions: <span className="font-semibold text-foreground">{predictions.length}</span>
        </p>
      </div>
    </div>
  )
}
