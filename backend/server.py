import os
import sys
import pandas as pd
import numpy as np
import torch
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import io
from typing import List, Dict
import warnings
import constants as cst
warnings.filterwarnings('ignore')

# Add parent directory to path to import models
sys.path.append('/app')

from models.tlob import TLOB
from models.mlplob import MLPLOB
from models.engine import Engine

app = FastAPI(title="Order Book Prediction API")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for models
tlob_model = None
mlplob_model = None

def load_models():
    """Load pre-trained TLOB and MLPLOB models"""
    global tlob_model, mlplob_model
    
    try:
        print("Loading TLOB model...")
        tlob_path = "/Users/architbagad/Documents/Final/Archit/backend/data/checkpoints/tlob_fi2010.pt"
        tlob_checkpoint = torch.load(tlob_path, map_location=cst.DEVICE, weights_only=False)
        
        # Extract hyperparameters from checkpoint
        tlob_params = tlob_checkpoint['hyper_parameters']
        
        # Get num_features from checkpoint
        num_features_tlob = tlob_params.get('num_features', 40)
        
        tlob_model = Engine(
            seq_size=tlob_params.get('seq_size', 128),
            horizon=tlob_params.get('horizon', 10),
            max_epochs=tlob_params.get('max_epochs', 10),
            model_type='TLOB',
            is_wandb=False,
            experiment_type='EVALUATION',
            lr=tlob_params.get('lr', 0.0001),
            optimizer=tlob_params.get('optimizer', 'Adam'),
            dir_ckpt='inference',
            hidden_dim=tlob_params.get('hidden_dim', 40),
            num_layers=tlob_params.get('num_layers', 4),
            num_features=num_features_tlob,
            dataset_type='FI_2010',
            num_heads=tlob_params.get('num_heads', 1),
            is_sin_emb=tlob_params.get('is_sin_emb', True),
            len_test_dataloader=1
        )
        tlob_model.load_state_dict(tlob_checkpoint['state_dict'])
        tlob_model.eval()
        print("✓ TLOB model loaded successfully")
        
        print("Loading MLPLOB model...")
        mlplob_path = "/Users/architbagad/Documents/Final/Archit/backend/data/checkpoints/mlplob_fi2010.pt"
        mlplob_checkpoint = torch.load(mlplob_path, map_location=cst.DEVICE, weights_only=False)
        
        mlplob_params = mlplob_checkpoint['hyper_parameters']
        
        # Get num_features from checkpoint
        num_features_mlplob = mlplob_params.get('num_features', 40)
        
        mlplob_model = Engine(
            seq_size=mlplob_params.get('seq_size', 384),
            horizon=mlplob_params.get('horizon', 10),
            max_epochs=mlplob_params.get('max_epochs', 10),
            model_type='MLPLOB',
            is_wandb=False,
            experiment_type='EVALUATION',
            lr=mlplob_params.get('lr', 0.0003),
            optimizer=mlplob_params.get('optimizer', 'Adam'),
            dir_ckpt='inference',
            hidden_dim=mlplob_params.get('hidden_dim', 40),
            num_layers=mlplob_params.get('num_layers', 3),
            num_features=num_features_mlplob,
            dataset_type='FI_2010',
            len_test_dataloader=1
        )
        mlplob_model.load_state_dict(mlplob_checkpoint['state_dict'])
        mlplob_model.eval()
        print("✓ MLPLOB model loaded successfully")
        
    except Exception as e:
        print(f"Error loading models: {str(e)}")
        raise

def preprocess_orderbook_csv(df: pd.DataFrame, seq_size: int = 128) -> torch.Tensor:
    """
    Convert orderbook CSV to model input format
    Input CSV columns: timestamp, symbol, bid_qty, bid_price, ask_price, ask_qty
    Output: [num_sequences, seq_size, 40] tensor
    """
    try:
        # Convert numeric columns
        numeric_cols = ['bid_qty', 'bid_price', 'ask_price', 'ask_qty']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')
        
        # Drop rows with NaN values
        df = df.dropna()
        
        # Sort by timestamp
        df = df.sort_values('timestamp').reset_index(drop=True)
        
        # Extract features
        features = []
        
        # Group by timestamp to get order book snapshots
        grouped = df.groupby('timestamp')
        
        for timestamp, group in grouped:
            # Limit to top 10 levels (20 rows total - 10 bid, 10 ask)
            group_sorted = group.head(20)
            
            # Extract bid and ask data
            bids = group_sorted[['bid_price', 'bid_qty']].values
            asks = group_sorted[['ask_price', 'ask_qty']].values
            
            # Pad if less than 10 levels
            if len(bids) < 10:
                bids = np.pad(bids, ((0, 10 - len(bids)), (0, 0)), mode='constant')
            if len(asks) < 10:
                asks = np.pad(asks, ((0, 10 - len(asks)), (0, 0)), mode='constant')
            
            bids = bids[:10]
            asks = asks[:10]
            
            # Flatten: [bid_price_1, bid_qty_1, ask_price_1, ask_qty_1, ...]
            # FI-2010 uses 40 LOB features (10 levels x 4 values per level)
            snapshot_features = []
            for i in range(10):
                snapshot_features.extend([bids[i, 0], bids[i, 1], asks[i, 0], asks[i, 1]])
            
            features.append(snapshot_features)
        
        # Convert to numpy array
        features_array = np.array(features, dtype=np.float32)
        
        # Replace any inf or nan values
        features_array = np.nan_to_num(features_array, nan=0.0, posinf=1e6, neginf=-1e6)
        
        # Normalize
        mean = features_array.mean(axis=0)
        std = features_array.std(axis=0)
        std = np.where(std < 1e-8, 1.0, std)  # Prevent division by zero
        features_array = (features_array - mean) / std
        
        # Final check for any remaining non-finite values
        features_array = np.nan_to_num(features_array, nan=0.0, posinf=0.0, neginf=0.0)
        
        # Create sequences
        sequences = []
        for i in range(len(features_array) - seq_size + 1):
            sequences.append(features_array[i:i + seq_size])
        
        if len(sequences) == 0:
            # Not enough data, create a single sequence with padding
            if len(features_array) > 0:
                padded = np.zeros((seq_size, 40), dtype=np.float32)
                padded[:len(features_array)] = features_array
                sequences.append(padded)
            else:
                raise ValueError("No valid data found in CSV")
        
        return torch.from_numpy(np.array(sequences))
        
    except Exception as e:
        print(f"Error in preprocessing: {str(e)}")
        raise

@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    load_models()

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "tlob_loaded": tlob_model is not None,
        "mlplob_loaded": mlplob_model is not None,
        "device": str(cst.DEVICE)
    }

@app.post("/api/predict")
async def predict(file: UploadFile = File(...)):
    """
    Upload CSV file and get predictions from both models
    """
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are accepted")
        
        # Read CSV
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Validate required columns
        required_cols = ['timestamp', 'symbol', 'bid_qty', 'bid_price', 'ask_price', 'ask_qty']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {missing_cols}"
            )
        
        # Get predictions from both models
        results = {}
        
        # TLOB predictions (seq_size=128)
        print("Processing with TLOB model...")
        tlob_input = preprocess_orderbook_csv(df, seq_size=128)
        
        with torch.no_grad():
            tlob_output = tlob_model(tlob_input.to(cst.DEVICE))
            tlob_probs = torch.softmax(tlob_output, dim=1)
            tlob_preds = torch.argmax(tlob_probs, dim=1)
        
        # Convert to numpy and ensure JSON-compliant values
        tlob_preds_np = tlob_preds.cpu().numpy()
        tlob_probs_np = tlob_probs.cpu().numpy()
        
        # Replace any non-finite values
        tlob_preds_np = np.nan_to_num(tlob_preds_np, nan=1, posinf=1, neginf=1).astype(int)
        tlob_probs_np = np.nan_to_num(tlob_probs_np, nan=0.33, posinf=1.0, neginf=0.0)
        
        results['tlob'] = {
            'predictions': tlob_preds_np.tolist(),
            'probabilities': tlob_probs_np.tolist(),
            'num_predictions': int(len(tlob_preds)),
            'class_names': ['Up', 'Stationary', 'Down']
        }
        
        # MLPLOB predictions (seq_size=384)
        print("Processing with MLPLOB model...")
        mlplob_input = preprocess_orderbook_csv(df, seq_size=384)
        
        with torch.no_grad():
            mlplob_output = mlplob_model(mlplob_input.to(cst.DEVICE))
            mlplob_probs = torch.softmax(mlplob_output, dim=1)
            mlplob_preds = torch.argmax(mlplob_probs, dim=1)
        
        # Convert to numpy and ensure JSON-compliant values
        mlplob_preds_np = mlplob_preds.cpu().numpy()
        mlplob_probs_np = mlplob_probs.cpu().numpy()
        
        # Replace any non-finite values
        mlplob_preds_np = np.nan_to_num(mlplob_preds_np, nan=1, posinf=1, neginf=1).astype(int)
        mlplob_probs_np = np.nan_to_num(mlplob_probs_np, nan=0.33, posinf=1.0, neginf=0.0)
        
        results['mlplob'] = {
            'predictions': mlplob_preds_np.tolist(),
            'probabilities': mlplob_probs_np.tolist(),
            'num_predictions': int(len(mlplob_preds)),
            'class_names': ['Up', 'Stationary', 'Down']
        }
        
        # Calculate aggregate statistics
        results['summary'] = {
            'total_rows': len(df),
            'symbol': df['symbol'].iloc[0] if len(df) > 0 else 'Unknown',
            'time_range': {
                'start': str(df['timestamp'].min()),
                'end': str(df['timestamp'].max())
            }
        }
        
        # Add model metadata
        results['model_metadata'] = {
            'tlob': {
                'name': 'TLOB (Transformer for Limit Order Books)',
                'architecture': 'Transformer-based',
                'sequence_size': 128,
                'num_layers': 4,
                'hidden_dim': 40,
                'num_heads': 1,
                'features': 40,
                'description': 'Uses multi-head attention to capture complex temporal patterns'
            },
            'mlplob': {
                'name': 'MLPLOB (Multi-Layer Perceptron LOB)',
                'architecture': 'MLP-based',
                'sequence_size': 384,
                'num_layers': 3,
                'hidden_dim': 40,
                'features': 40,
                'description': 'Efficient baseline model using deep MLP layers'
            }
        }
        
        return JSONResponse(content=results)
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict-json")
async def predict_json(request: dict):
    """
    Accept JSON order book data and get predictions from both models
    Expected format: {"data": [{"timestamp": ..., "symbol": ..., "bid_qty": ..., "bid_price": ..., "ask_price": ..., "ask_qty": ...}, ...]}
    """
    try:
        # Extract data from request
        data_list = request.get("data", [])
        
        if not data_list:
            raise HTTPException(status_code=400, detail="No data provided")
        
        # Convert to DataFrame
        df = pd.DataFrame(data_list)
        
        # Validate required columns
        required_cols = ['timestamp', 'symbol', 'bid_qty', 'bid_price', 'ask_price', 'ask_qty']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {missing_cols}"
            )
        
        # Get predictions from both models
        results = {}
        
        # TLOB predictions (seq_size=128)
        print("Processing with TLOB model...")
        tlob_input = preprocess_orderbook_csv(df, seq_size=128)
        
        with torch.no_grad():
            tlob_output = tlob_model(tlob_input.to(cst.DEVICE))
            tlob_probs = torch.softmax(tlob_output, dim=1)
            tlob_preds = torch.argmax(tlob_probs, dim=1)
        
        # Convert to numpy and ensure JSON-compliant values
        tlob_preds_np = tlob_preds.cpu().numpy()
        tlob_probs_np = tlob_probs.cpu().numpy()
        
        # Replace any non-finite values
        tlob_preds_np = np.nan_to_num(tlob_preds_np, nan=1, posinf=1, neginf=1).astype(int)
        tlob_probs_np = np.nan_to_num(tlob_probs_np, nan=0.33, posinf=1.0, neginf=0.0)
        
        results['tlob'] = {
            'predictions': tlob_preds_np.tolist(),
            'probabilities': tlob_probs_np.tolist(),
            'num_predictions': int(len(tlob_preds)),
            'class_names': ['Up', 'Stationary', 'Down']
        }
        
        # MLPLOB predictions (seq_size=384)
        print("Processing with MLPLOB model...")
        mlplob_input = preprocess_orderbook_csv(df, seq_size=384)
        
        with torch.no_grad():
            mlplob_output = mlplob_model(mlplob_input.to(cst.DEVICE))
            mlplob_probs = torch.softmax(mlplob_output, dim=1)
            mlplob_preds = torch.argmax(mlplob_probs, dim=1)
        
        # Convert to numpy and ensure JSON-compliant values
        mlplob_preds_np = mlplob_preds.cpu().numpy()
        mlplob_probs_np = mlplob_probs.cpu().numpy()
        
        # Replace any non-finite values
        mlplob_preds_np = np.nan_to_num(mlplob_preds_np, nan=1, posinf=1, neginf=1).astype(int)
        mlplob_probs_np = np.nan_to_num(mlplob_probs_np, nan=0.33, posinf=1.0, neginf=0.0)
        
        results['mlplob'] = {
            'predictions': mlplob_preds_np.tolist(),
            'probabilities': mlplob_probs_np.tolist(),
            'num_predictions': int(len(mlplob_preds)),
            'class_names': ['Up', 'Stationary', 'Down']
        }
        
        # Calculate aggregate statistics
        results['summary'] = {
            'total_rows': len(df),
            'symbol': df['symbol'].iloc[0] if len(df) > 0 else 'Unknown',
            'time_range': {
                'start': str(df['timestamp'].min()),
                'end': str(df['timestamp'].max())
            }
        }
        
        # Add model metadata
        results['model_metadata'] = {
            'tlob': {
                'name': 'TLOB (Transformer for Limit Order Books)',
                'architecture': 'Transformer-based',
                'sequence_size': 128,
                'num_layers': 4,
                'hidden_dim': 40,
                'num_heads': 1,
                'features': 40,
                'description': 'Uses multi-head attention to capture complex temporal patterns'
            },
            'mlplob': {
                'name': 'MLPLOB (Multi-Layer Perceptron LOB)',
                'architecture': 'MLP-based',
                'sequence_size': 384,
                'num_layers': 3,
                'hidden_dim': 40,
                'features': 40,
                'description': 'Efficient baseline model using deep MLP layers'
            }
        }
        
        return JSONResponse(content=results)
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/capabilities")
async def get_capabilities():
    """Return comprehensive model capabilities"""
    return {
        "capabilities": [
            {
                "category": "Order Book Data Processing",
                "icon": "📊",
                "items": [
                    "Parse limit order book (LOB) snapshots with bid/ask prices and volumes",
                    "Handle 10 price levels (10 bid + 10 ask = 40 features)",
                    "Process time-series sequences of order book states",
                    "Normalize order book data using Batch-Instance Normalization (BiN)",
                    "Handle multiple datasets (FI-2010, LOBSTER formats)",
                    "Accept CSV uploads with timestamp, symbol, bid_qty, bid_price, ask_price, ask_qty"
                ]
            },
            {
                "category": "Temporal Pattern Recognition",
                "icon": "⏱️",
                "items": [
                    "Capture short-term dependencies (TLOB: 128 timesteps, MLPLOB: 384 timesteps)",
                    "Model sequential dynamics of order book evolution",
                    "Use transformer self-attention to identify important temporal patterns (TLOB)",
                    "Apply positional encoding (sinusoidal) to preserve time-order information",
                    "Process both feature-wise and time-wise transformations"
                ]
            },
            {
                "category": "Price Movement Prediction",
                "icon": "📈",
                "items": [
                    "Predict mid-price movement direction (Up, Stationary, Down)",
                    "Multi-horizon forecasting (10, 20, 30, 50, 100 ticks ahead)",
                    "Output probability distributions for each class",
                    "Provide confidence scores for predictions"
                ]
            },
            {
                "category": "Dual Model Architecture",
                "icon": "🤖",
                "items": [
                    "TLOB Model: Transformer-based with multi-head attention",
                    "MLPLOB Model: MLP-based for efficient baseline predictions",
                    "Both models trained on FI-2010 benchmark dataset",
                    "Ensemble capability (compare/combine predictions)"
                ]
            },
            {
                "category": "Advanced Neural Network Features",
                "icon": "🧠",
                "items": [
                    "Multi-head attention mechanism (TLOB) - captures different aspects",
                    "Residual connections for gradient flow",
                    "Layer normalization for training stability",
                    "GELU activation functions for non-linearity",
                    "Deep architecture (4 layers TLOB, 3 layers MLPLOB)",
                    "Batch-Instance Normalization (BiN) - specialized for financial time series"
                ]
            },
            {
                "category": "Microstructure Analysis",
                "icon": "🔬",
                "items": [
                    "Analyze order book depth structure (10 levels deep)",
                    "Process high-frequency tick-level data",
                    "Capture supply-demand dynamics from bid-ask structure",
                    "Model instantaneous liquidity structure",
                    "Handle order type embeddings (for LOBSTER data)"
                ]
            },
            {
                "category": "API & Deployment",
                "icon": "🚀",
                "items": [
                    "RESTful API with FastAPI framework",
                    "File upload endpoint for CSV data",
                    "Health check monitoring",
                    "CORS-enabled for web integration",
                    "GPU/CPU automatic device selection",
                    "Batch prediction support",
                    "JSON response with predictions and probabilities"
                ]
            },
            {
                "category": "Data Handling",
                "icon": "🔧",
                "items": [
                    "Automatic data validation and cleaning",
                    "Handle missing values and outliers",
                    "Z-score normalization",
                    "Sequence padding for variable-length inputs",
                    "Timestamp-based sorting and grouping",
                    "Support for multiple symbols/instruments"
                ]
            },
            {
                "category": "Model Inference",
                "icon": "⚡",
                "items": [
                    "Pre-trained model loading from checkpoints",
                    "Inference mode (eval) for predictions",
                    "No-gradient computation for efficiency",
                    "Automatic hyperparameter extraction from checkpoints",
                    "Robust error handling for non-finite values"
                ]
            },
            {
                "category": "Output Information",
                "icon": "📤",
                "items": [
                    "Class predictions (0=Up, 1=Stationary, 2=Down)",
                    "Probability distributions for each prediction",
                    "Number of predictions generated",
                    "Summary statistics (time range, symbol, total rows)",
                    "Separate results from both TLOB and MLPLOB models"
                ]
            },
            {
                "category": "Attention Mechanism",
                "icon": "👁️",
                "items": [
                    "Multi-head attention for feature relationships",
                    "Query-Key-Value (QKV) computation",
                    "Attention weight storage capability",
                    "Average attention weight computation",
                    "Temporal and feature-wise attention layers"
                ]
            },
            {
                "category": "Scalability",
                "icon": "📡",
                "items": [
                    "Handle variable-length input sequences",
                    "Batch processing support",
                    "Efficient tensor operations with PyTorch",
                    "Memory-efficient inference",
                    "Containerized deployment ready"
                ]
            }
        ],
        "model_info": {
            "tlob": {
                "name": "TLOB (Transformer for Limit Order Books)",
                "architecture": "Transformer-based",
                "sequence_size": 128,
                "num_layers": 4,
                "hidden_dim": 40,
                "num_heads": 1,
                "features": 40
            },
            "mlplob": {
                "name": "MLPLOB (Multi-Layer Perceptron LOB)",
                "architecture": "MLP-based",
                "sequence_size": 384,
                "num_layers": 3,
                "hidden_dim": 40,
                "features": 40
            }
        }
    }

@app.get("/api/")
async def root():
    return {"message": "Order Book Prediction API", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
