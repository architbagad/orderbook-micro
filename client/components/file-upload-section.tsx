"use client"

import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileUp } from "lucide-react"

interface FileUploadSectionProps {
  file: File | null
  onFileSelect: (file: File) => void
  onAnalyze: () => void
  isLoading: boolean
  error: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

export default function FileUploadSection({
  file,
  onFileSelect,
  onAnalyze,
  isLoading,
  error,
  fileInputRef,
}: FileUploadSectionProps) {
  const dragOverRef = useRef(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    dragOverRef.current = true
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragOverRef.current = false
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragOverRef.current = false
    if (e.dataTransfer.files?.[0]) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileSelect(e.target.files[0])
    }
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${dragOverRef.current ? "border-foreground bg-muted/50" : "border-border hover:border-muted-foreground"
          }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-muted rounded-lg">
            <Upload className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">
              <label
                htmlFor="file-input"
                className="cursor-pointer text-foreground hover:text-muted-foreground transition-colors"
              >
                Click to upload
              </label>
              {" or drag and drop"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              CSV file with columns: timestamp, symbol, bid_qty, bid_price, ask_price, ask_qty
            </p>
          </div>
          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>
      </div>

      {/* Selected File */}
      {file && (
        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg border border-border">
          <FileUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{file.name}</p>
            <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={onAnalyze} disabled={!file || isLoading} size="lg" className="flex-1">
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            <>
              <FileUp className="w-4 h-4 mr-2" />
              Analyze Data
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
