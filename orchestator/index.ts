import { redis } from "./redis"
import { WebSocketServer } from "ws"
import http from "http"
import express from "express"
import { setInterval } from "timers"
import { startPoll } from "./utils"

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server })

wss.on("connection", ws => {
    console.log("New WebSocket client connected")

    const i = setInterval(async () => {
        try {
            // Listen to results_queue for prediction results from Lambda
            const msg = await redis.pop("results_queue")
            if (msg) {
                console.log("Broadcasting prediction result to client")
                ws.send(msg)
            }
        } catch (error) {
            console.error("Error reading from results_queue:", error)
        }
    }, 200)

    ws.on("close", () => {
        console.log("WebSocket client disconnected")
        clearInterval(i)
    })
})

server.listen(9000, () => {
    console.log("Server started on port 9000")
    startPoll("BTCUSDT")
})