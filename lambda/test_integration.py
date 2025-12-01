#!/usr/bin/env python3
"""
Test script to verify the Redis-Backend-WebSocket integration
This script pushes test order book data to the lob_queue
"""

import redis
import json
import time

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# Sample order book data (Binance format)
test_orderbook = {
    "bids": [
        ["50000.00", "1.5"],
        ["49999.00", "2.0"],
        ["49998.00", "1.2"],
        ["49997.00", "0.8"],
        ["49996.00", "1.1"],
        ["49995.00", "0.9"],
        ["49994.00", "1.3"],
        ["49993.00", "0.7"],
        ["49992.00", "1.0"],
        ["49991.00", "0.6"]
    ],
    "asks": [
        ["50001.00", "2.0"],
        ["50002.00", "1.8"],
        ["50003.00", "1.5"],
        ["50004.00", "1.2"],
        ["50005.00", "0.9"],
        ["50006.00", "1.1"],
        ["50007.00", "0.8"],
        ["50008.00", "1.3"],
        ["50009.00", "0.7"],
        ["50010.00", "1.0"]
    ]
}

print("Pushing test order book data to lob_queue...")
r.lpush("lob_queue", json.dumps(test_orderbook))
print("✓ Test data pushed successfully!")

print("\nWaiting for results in results_queue...")
print("(Press Ctrl+C to stop)")

try:
    while True:
        result = r.brpop("results_queue", timeout=5)
        if result:
            queue_name, data = result
            print(f"\n✓ Received result from {queue_name}:")
            result_json = json.loads(data)
            print(json.dumps(result_json, indent=2))
            break
        else:
            print(".", end="", flush=True)
except KeyboardInterrupt:
    print("\n\nStopped by user")
