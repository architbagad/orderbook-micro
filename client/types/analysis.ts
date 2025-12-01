export interface Summary {
  symbol: string
  total_rows: number
  time_range: {
    start: string
    end: string
  }
}

export interface ModelPrediction {
  predictions: number[]
  probabilities: number[][]
  num_predictions: number
  class_names: string[]
}

export interface ModelMetadata {
  name: string
  architecture: string
  sequence_size: number
  num_layers: number
  hidden_dim: number
  features: number
  num_heads?: number
  description: string
}

export interface AnalysisResults {
  summary: Summary
  tlob: ModelPrediction
  mlplob: ModelPrediction
  model_metadata: {
    tlob: ModelMetadata
    mlplob: ModelMetadata
  }
}

// WebSocket Live Prediction Types
export interface LivePrediction {
  summary: Summary
  tlob: ModelPrediction
  mlplob: ModelPrediction
  model_metadata: {
    tlob: ModelMetadata
    mlplob: ModelMetadata
  }
  timestamp: number
}

export interface PredictionHistoryItem {
  timestamp: number
  tlobPrediction: number
  mlplobPrediction: number
  tlobConfidence: number
  mlplobConfidence: number
  tlobProbabilities: number[]
  mlplobProbabilities: number[]
}

export enum ConnectionStatus {
  CONNECTING = "connecting",
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  ERROR = "error",
}

