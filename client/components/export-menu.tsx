"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { AnalysisResults } from "@/types/analysis"
import { Download, ChevronDown } from "lucide-react"

interface ExportMenuProps {
  results: AnalysisResults
}

export default function ExportMenu({ results }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const exportToCSV = () => {
    const data = [
      ["TLOB Predictions", ...results.tlob.predictions],
      [],
      ["MLPLOB Predictions", ...results.mlplob.predictions],
      [],
      ["Summary"],
      ["Symbol", results.summary.symbol],
      ["Total Rows", results.summary.total_rows],
      ["Start Time", results.summary.time_range.start],
      ["End Time", results.summary.time_range.end],
    ]

    const csv = data.map((row) => row.join(",")).join("\n")
    downloadFile(csv, "analysis-results.csv", "text/csv")
    setIsOpen(false)
  }

  const exportToJSON = () => {
    const json = JSON.stringify(results, null, 2)
    downloadFile(json, "analysis-results.json", "application/json")
    setIsOpen(false)
  }

  const exportToTSV = () => {
    const data = [
      ["TLOB Predictions", ...results.tlob.predictions],
      [],
      ["MLPLOB Predictions", ...results.mlplob.predictions],
      [],
      ["Summary"],
      ["Symbol", results.summary.symbol],
      ["Total Rows", results.summary.total_rows],
      ["Start Time", results.summary.time_range.start],
      ["End Time", results.summary.time_range.end],
    ]

    const tsv = data.map((row) => row.join("\t")).join("\n")
    downloadFile(tsv, "analysis-results.tsv", "text/tab-separated-values")
    setIsOpen(false)
  }

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative">
      <Button onClick={() => setIsOpen(!isOpen)} variant="outline" className="gap-2">
        <Download className="w-4 h-4" />
        Export
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10">
          <button onClick={exportToCSV} className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors">
            Export as CSV
          </button>
          <button
            onClick={exportToJSON}
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
          >
            Export as JSON
          </button>
          <button onClick={exportToTSV} className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors">
            Export as TSV
          </button>
        </div>
      )}
    </div>
  )
}
