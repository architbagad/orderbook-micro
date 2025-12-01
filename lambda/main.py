import requests
import json
import time
import logging
from redis_client import redis_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
BACKEND_URL = "http://localhost:8001/api/predict-json"
LOB_QUEUE = "lob_queue"
RESULTS_QUEUE = "results_queue"
RETRY_DELAY = 5  # seconds

def transform_orderbook_to_csv_format(orderbook_data):
    """
    Transform Binance order book format to the format expected by backend
    Input: {"bids": [[price, qty], ...], "asks": [[price, qty], ...]}
    Output: List of dicts with timestamp, symbol, bid_qty, bid_price, ask_price, ask_qty
    """
    try:
        bids = orderbook_data.get("bids", [])
        asks = orderbook_data.get("asks", [])
        
        # Create rows for each price level
        rows = []
        max_levels = max(len(bids), len(asks))
        
        for i in range(max_levels):
            row = {
                "timestamp": int(time.time() * 1000),  # milliseconds
                "symbol": "BTCUSDT"
            }
            
            if i < len(bids):
                row["bid_price"] = float(bids[i][0])
                row["bid_qty"] = float(bids[i][1])
            else:
                row["bid_price"] = 0.0
                row["bid_qty"] = 0.0
            
            if i < len(asks):
                row["ask_price"] = float(asks[i][0])
                row["ask_qty"] = float(asks[i][1])
            else:
                row["ask_price"] = 0.0
                row["ask_qty"] = 0.0
            
            rows.append(row)
        
        return rows
    except Exception as e:
        logger.error(f"Error transforming order book data: {e}")
        raise

def call_backend_api(orderbook_data):
    """
    Call the Python backend API with order book data
    Returns prediction results or None on error
    """
    try:
        # Transform data to expected format
        csv_format_data = transform_orderbook_to_csv_format(orderbook_data)
        
        logger.info(f"Calling backend API with {len(csv_format_data)} rows")
        
        # Call backend API
        response = requests.post(
            BACKEND_URL,
            json={"data": csv_format_data},
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info("Backend API call successful")
            return result
        else:
            logger.error(f"Backend API error: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        logger.error("Backend API timeout")
        return None
    except requests.exceptions.ConnectionError:
        logger.error("Backend API connection error")
        return None
    except Exception as e:
        logger.error(f"Error calling backend API: {e}")
        return None

def process_data(data_str):
    """
    Process order book data from Redis queue
    1. Parse JSON data
    2. Call backend API
    3. Push results to results queue
    """
    try:
        # Parse JSON data
        orderbook_data = json.loads(data_str)
        logger.info(f"Processing order book data with {len(orderbook_data.get('bids', []))} bids and {len(orderbook_data.get('asks', []))} asks")
        
        # Call backend API
        result = call_backend_api(orderbook_data)
        
        if result:
            # Push result to results queue
            result_str = json.dumps(result)
            redis_client.push(RESULTS_QUEUE, result_str)
            logger.info(f"Pushed result to {RESULTS_QUEUE}")
            return True
        else:
            logger.warning("No result from backend API, skipping push to results queue")
            return False
            
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON data: {e}")
        return False
    except Exception as e:
        logger.error(f"Error processing data: {e}")
        return False

def main():
    """
    Main loop: Listen to Redis lob_queue and process messages
    """
    logger.info(f"Starting Lambda processor...")
    logger.info(f"Listening to queue: {LOB_QUEUE}")
    logger.info(f"Publishing results to: {RESULTS_QUEUE}")
    logger.info(f"Backend API: {BACKEND_URL}")
    
    while True:
        try:
            # Blocking pop from lob_queue (waits indefinitely)
            logger.info(f"Waiting for messages on {LOB_QUEUE}...")
            result = redis_client.blocking_pop(LOB_QUEUE, timeout=0)
            
            if result:
                queue_name, data = result
                logger.info(f"Received message from {queue_name}")
                process_data(data)
            
        except KeyboardInterrupt:
            logger.info("Shutting down gracefully...")
            break
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
            logger.info(f"Retrying in {RETRY_DELAY} seconds...")
            time.sleep(RETRY_DELAY)

if __name__ == "__main__":
    main()
