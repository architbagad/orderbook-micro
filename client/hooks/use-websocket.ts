"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { ConnectionStatus, type LivePrediction } from "@/types/analysis"

interface UseWebSocketReturn {
    prediction: LivePrediction | null
    status: ConnectionStatus
    error: string | null
    connect: () => void
    disconnect: () => void
}

export function useWebSocket(url: string = "ws://localhost:9000"): UseWebSocketReturn {
    const [prediction, setPrediction] = useState<LivePrediction | null>(null)
    const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED)
    const [error, setError] = useState<string | null>(null)
    const wsRef = useRef<WebSocket | null>(null)
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const reconnectAttemptsRef = useRef(0)
    const maxReconnectAttempts = 5

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return
        }

        try {
            setStatus(ConnectionStatus.CONNECTING)
            setError(null)

            const ws = new WebSocket(url)
            wsRef.current = ws

            ws.onopen = () => {
                console.log("WebSocket connected")
                setStatus(ConnectionStatus.CONNECTED)
                setError(null)
                reconnectAttemptsRef.current = 0
            }

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    const predictionWithTimestamp: LivePrediction = {
                        ...data,
                        timestamp: Date.now(),
                    }
                    setPrediction(predictionWithTimestamp)
                } catch (err) {
                    console.error("Failed to parse WebSocket message:", err)
                    setError("Failed to parse prediction data")
                }
            }

            ws.onerror = (event) => {
                console.error("WebSocket error:", event)
                setError("WebSocket connection error")
                setStatus(ConnectionStatus.ERROR)
            }

            ws.onclose = () => {
                console.log("WebSocket disconnected")
                setStatus(ConnectionStatus.DISCONNECTED)
                wsRef.current = null

                // Auto-reconnect with exponential backoff
                if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
                    console.log(`Reconnecting in ${delay}ms...`)

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++
                        connect()
                    }, delay)
                } else {
                    setError("Max reconnection attempts reached")
                }
            }
        } catch (err) {
            console.error("Failed to create WebSocket:", err)
            setError("Failed to establish connection")
            setStatus(ConnectionStatus.ERROR)
        }
    }, [url])

    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current)
        }

        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }

        setStatus(ConnectionStatus.DISCONNECTED)
        reconnectAttemptsRef.current = 0
    }, [])

    useEffect(() => {
        return () => {
            disconnect()
        }
    }, [disconnect])

    return {
        prediction,
        status,
        error,
        connect,
        disconnect,
    }
}
