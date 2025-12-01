"use client"

import { Button } from "@/components/ui/button"
import { Power } from "lucide-react"

interface EngineControlsProps {
  isRunning: boolean
  onStart: () => void
}

export default function EngineControls({ isRunning, onStart }: EngineControlsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-3">
        <h2 className="text-lg font-semibold mb-4">Engine Status</h2>
      </div>

      {/* Start/Stop Engine */}
      <div className="p-6 border border-border rounded-lg bg-card/50 hover:bg-card/80 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Prediction Engine</p>
            <p className={`text-lg font-semibold ${isRunning ? "text-green-500" : "text-muted-foreground"}`}>
              {isRunning ? "Active" : "Inactive"}
            </p>
          </div>
          <Button onClick={onStart} variant={isRunning ? "default" : "outline"} size="icon" className="w-12 h-12">
            <Power className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* TLOB Model */}
      <div className="p-6 border border-border rounded-lg bg-card/50">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">TLOB Model</p>
          <p className="text-2xl font-bold">Transformer</p>
          <p className="text-xs text-muted-foreground">Limit Order Book</p>
        </div>
      </div>

      {/* MLPLOB Model */}
      <div className="p-6 border border-border rounded-lg bg-card/50">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">MLPLOB Model</p>
          <p className="text-2xl font-bold">Multi-Layer</p>
          <p className="text-xs text-muted-foreground">Perceptron LOB</p>
        </div>
      </div>
    </div>
  )
}
