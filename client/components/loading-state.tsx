"use client"

export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-border" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-foreground animate-spin" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Analyzing Data</h3>
        <p className="text-sm text-muted-foreground">Processing order book data with TLOB & MLPLOB models</p>
      </div>
    </div>
  )
}
