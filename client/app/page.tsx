"use client"

import { useState, useRef } from "react"
import FileUploadSection from "@/components/file-upload-section"
import EngineControls from "@/components/engine-controls"
import ResultsDisplay from "@/components/results-display"
import LoadingState from "@/components/loading-state"
import LivePredictions from "@/components/live-predictions"
import { Button } from "@/components/ui/button"
import type { AnalysisResults } from "@/types/analysis"
import { Activity, FileText } from "lucide-react"

type Mode = "live" | "historical"

export default function Home() {
  const [mode, setMode] = useState<Mode>("live")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [engineRunning, setEngineRunning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001"

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    setResults(null)
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please select a CSV file")
      return
    }

    setLoading(true)
    setError(null)
    setEngineRunning(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`${backendUrl}/api/predict`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Analysis failed")
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
      setEngineRunning(false)
    }
  }

  const handleStartEngine = async () => {
    setEngineRunning(!engineRunning)
    if (!engineRunning) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  const handleNewAnalysis = () => {
    setFile(null)
    setResults(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">LOB Analysis Engine</h1>
              <p className="text-muted-foreground text-sm mt-1">Order Book Prediction System</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Mode Toggle */}
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1">
                <Button
                  variant={mode === "live" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("live")}
                  className="gap-2"
                >
                  <Activity className="w-4 h-4" />
                  Live
                </Button>
                <Button
                  variant={mode === "historical" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMode("historical")}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Historical
                </Button>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${engineRunning || mode === "live" ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {mode === "live" ? "Live Mode" : engineRunning ? "Engine Active" : "Idle"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {mode === "live" ? (
          <LivePredictions />
        ) : !results ? (
          <div className="space-y-8">
            {/* Engine Controls */}
            <EngineControls isRunning={engineRunning} onStart={handleStartEngine} />

            {/* File Upload */}
            <FileUploadSection
              file={file}
              onFileSelect={handleFileSelect}
              onAnalyze={handleAnalyze}
              isLoading={loading}
              error={error}
              fileInputRef={fileInputRef}
            />

            {/* Loading State */}
            {loading && <LoadingState />}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Results */}
            <ResultsDisplay results={results} onNewAnalysis={handleNewAnalysis} />
          </div>
        )}
      </div>
    </main>
  )
}

