import { redis } from "./redis"
export async function getOrderBook(symbol: string, limit = 100) {
    const r = await fetch(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`, {
        method: "GET"
    })
    if (!r.ok) throw new Error("api error")
    return r.json()
}

export async function poll(symbol: string) {
    const data = await getOrderBook(symbol)
    await redis.push("lob_queue", JSON.stringify(data))
}

export async function startPoll(symbol: string) {
    console.log("Polling for", symbol)
    setInterval(async () => {
        try {
            await poll(symbol)
            console.log("Polled for", symbol)
        } catch { }
    }, 5000)
}