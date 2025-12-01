"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import PredictionCard from "./prediction-card"
import StatisticsGrid from "./statistics-grid"
import ChartDisplay from "./chart-display"
import ExportMenu from "./export-menu"
import type { AnalysisResults } from "@/types/analysis"
import { ArrowLeft } from "lucide-react"

interface ResultsDisplayProps {
  results: AnalysisResults
  onNewAnalysis: () => void
}

export default function ResultsDisplay({ results, onNewAnalysis }: ResultsDisplayProps) {
  const [selectedExport, setSelectedExport] = useState<string | null>(null)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analysis Results</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Symbol: <span className="text-foreground font-medium">{results.summary.symbol}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <ExportMenu results={results} />
          <Button onClick={onNewAnalysis} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <StatisticsGrid summary={results.summary} />

      {/* Models Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PredictionCard
          title="TLOB Model"
          subtitle="Transformer-based Limit Order Book"
          predictions={results.tlob.predictions}
          probabilities={results.tlob.probabilities}
          modelType="tlob"
          metadata={results.model_metadata?.tlob}
        />
        <PredictionCard
          title="MLPLOB Model"
          subtitle="Multi-Layer Perceptron LOB"
          predictions={results.mlplob.predictions}
          probabilities={results.mlplob.probabilities}
          modelType="mlplob"
          metadata={results.model_metadata?.mlplob}
        />
      </div>

      {/* Visualization */}
      <ChartDisplay results={results} />
    </div>
  )
}
