"use client"

import { useEffect, useState } from "react"
import { useWebSocket } from "@/hooks/use-websocket"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import PredictionChart from "./prediction-chart"
import ProbabilityChart from "./probability-chart"
import { ConnectionStatus, type PredictionHistoryItem } from "@/types/analysis"
import { Activity, Pause, Play, Trash2, Wifi, WifiOff } from "lucide-react"

const MAX_HISTORY = 100

export default function LivePredictions() {
    const { prediction, status, error, connect, disconnect } = useWebSocket()
    const [history, setHistory] = useState<PredictionHistoryItem[]>([])
    const [isPaused, setIsPaused] = useState(false)
    const [isConnected, setIsConnected] = useState(false)

    useEffect(() => {
        setIsConnected(status === ConnectionStatus.CONNECTED)
    }, [status])

    useEffect(() => {
        if (prediction && !isPaused) {
            const historyItem: PredictionHistoryItem = {
                timestamp: prediction.timestamp,
                tlobPrediction: prediction.tlob.predictions[0] || 0,
                mlplobPrediction: prediction.mlplob.predictions[0] || 0,
                tlobConfidence: Math.max(...prediction.tlob.probabilities[0] || [0]),
                mlplobConfidence: Math.max(...prediction.mlplob.probabilities[0] || [0]),
                tlobProbabilities: prediction.tlob.probabilities[0] || [0, 0, 0],
                mlplobProbabilities: prediction.mlplob.probabilities[0] || [0, 0, 0],
            }

            setHistory((prev) => {
                const newHistory = [...prev, historyItem]
                return newHistory.slice(-MAX_HISTORY)
            })
        }
    }, [prediction, isPaused])

    const handleConnect = () => {
        if (isConnected) {
            disconnect()
        } else {
            connect()
        }
    }

    const handlePauseResume = () => {
        setIsPaused(!isPaused)
    }

    const handleClearHistory = () => {
        setHistory([])
    }

    const getStatusColor = () => {
        switch (status) {
            case ConnectionStatus.CONNECTED:
                return "bg-green-500"
            case ConnectionStatus.CONNECTING:
                return "bg-yellow-500 animate-pulse"
            case ConnectionStatus.ERROR:
                return "bg-red-500"
            default:
                return "bg-gray-500"
        }
    }

    const getStatusText = () => {
        switch (status) {
            case ConnectionStatus.CONNECTED:
                return "Connected"
            case ConnectionStatus.CONNECTING:
                return "Connecting..."
            case ConnectionStatus.ERROR:
                return "Error"
            default:
                return "Disconnected"
        }
    }

    const classNames = prediction?.tlob.class_names || ["Up", "Stationary", "Down"]
    const latestTlobPrediction = prediction?.tlob.predictions[0]
    const latestMlplobPrediction = prediction?.mlplob.predictions[0]

    return (
        <div className="space-y-6">
            {/* Connection Status & Controls */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Live Predictions
                            </CardTitle>
                            <CardDescription>Real-time order book predictions via WebSocket</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
                                <span className="text-sm font-medium">{getStatusText()}</span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Button onClick={handleConnect} variant={isConnected ? "destructive" : "default"}>
                            {isConnected ? (
                                <>
                                    <WifiOff className="w-4 h-4 mr-2" />
                                    Disconnect
                                </>
                            ) : (
                                <>
                                    <Wifi className="w-4 h-4 mr-2" />
                                    Connect
                                </>
                            )}
                        </Button>
                        <Button onClick={handlePauseResume} variant="outline" disabled={!isConnected}>
                            {isPaused ? (
                                <>
                                    <Play className="w-4 h-4 mr-2" />
                                    Resume
                                </>
                            ) : (
                                <>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause
                                </>
                            )}
                        </Button>
                        <Button onClick={handleClearHistory} variant="outline" disabled={history.length === 0}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear History
                        </Button>
                        <div className="ml-auto text-sm text-muted-foreground">
                            {history.length} predictions received
                        </div>
                    </div>
                    {error && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Latest Predictions */}
            {prediction && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">TLOB Model</CardTitle>
                            <CardDescription>Transformer for Limit Order Books</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Prediction</span>
                                        <Badge
                                            variant={
                                                latestTlobPrediction === 0 ? "default" : latestTlobPrediction === 2 ? "destructive" : "secondary"
                                            }
                                            className="text-lg px-4 py-1"
                                        >
                                            {classNames[latestTlobPrediction || 0]}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Confidence</span>
                                        <span className="text-sm font-medium">
                                            {(Math.max(...(prediction.tlob.probabilities[0] || [0])) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">MLPLOB Model</CardTitle>
                            <CardDescription>Multi-Layer Perceptron LOB</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">Prediction</span>
                                        <Badge
                                            variant={
                                                latestMlplobPrediction === 0
                                                    ? "default"
                                                    : latestMlplobPrediction === 2
                                                        ? "destructive"
                                                        : "secondary"
                                            }
                                            className="text-lg px-4 py-1"
                                        >
                                            {classNames[latestMlplobPrediction || 0]}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Confidence</span>
                                        <span className="text-sm font-medium">
                                            {(Math.max(...(prediction.mlplob.probabilities[0] || [0])) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts */}
            {history.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PredictionChart history={history} maxItems={50} />
                    {prediction && (
                        <ProbabilityChart
                            tlobProbabilities={prediction.tlob.probabilities[0] || [0, 0, 0]}
                            mlplobProbabilities={prediction.mlplob.probabilities[0] || [0, 0, 0]}
                            classNames={classNames}
                        />
                    )}
                </div>
            )}

            {/* Empty State */}
            {history.length === 0 && isConnected && (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center text-muted-foreground">
                            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Waiting for predictions...</p>
                            <p className="text-sm mt-2">Predictions will appear here as they arrive from the WebSocket server</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
