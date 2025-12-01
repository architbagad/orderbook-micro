import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [capabilities, setCapabilities] = useState(null);
  const [showCapabilities, setShowCapabilities] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Use environment variable or default to empty string (same origin with /api prefix)
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

  // Fetch capabilities on mount
  useEffect(() => {
    const fetchCapabilities = async () => {
      try {
        const response = await fetch(`${backendUrl}/api/capabilities`);
        if (response.ok) {
          const data = await response.json();
          setCapabilities(data);
        }
      } catch (err) {
        console.error('Failed to fetch capabilities:', err);
      }
    };
    fetchCapabilities();
  }, [backendUrl]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${backendUrl}/api/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Prediction failed');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'An error occurred during prediction');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (predictions) => {
    const total = predictions.length;
    const up = predictions.filter(p => p === 0).length;
    const stationary = predictions.filter(p => p === 1).length;
    const down = predictions.filter(p => p === 2).length;

    return {
      up: ((up / total) * 100).toFixed(1),
      stationary: ((stationary / total) * 100).toFixed(1),
      down: ((down / total) * 100).toFixed(1)
    };
  };

  const getMostLikelyPrediction = (predictions) => {
    const counts = [0, 0, 0];
    predictions.forEach(p => counts[p]++);
    const maxIndex = counts.indexOf(Math.max(...counts));
    return ['Up', 'Stationary', 'Down'][maxIndex];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4" data-testid="page-title">
            📈 Order Book Prediction System
          </h1>
          <p className="text-xl text-purple-200 mb-4" data-testid="page-subtitle">
            Advanced LOB Microstructure Analysis using TLOB & MLPLOB Models
          </p>

          {/* Capabilities Toggle Button */}
          <button
            onClick={() => setShowCapabilities(!showCapabilities)}
            className="mt-4 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 font-semibold py-2 px-6 rounded-lg transition-all border border-purple-400/30"
            data-testid="toggle-capabilities"
          >
            {showCapabilities ? '🔼 Hide Model Capabilities' : '🔽 View Model Capabilities'}
          </button>
        </div>

        {/* Capabilities Section */}
        {showCapabilities && capabilities && (
          <div className="max-w-6xl mx-auto mb-8" data-testid="capabilities-section">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">🎯 What Our Models Can Do</h2>

              {/* Model Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-purple-600/30 to-pink-600/30 rounded-xl p-6 border border-purple-400/30">
                  <h3 className="text-xl font-bold text-white mb-3">🤖 {capabilities.model_info.tlob.name}</h3>
                  <div className="space-y-2 text-purple-100">
                    <p><span className="text-purple-300">Architecture:</span> {capabilities.model_info.tlob.architecture}</p>
                    <p><span className="text-purple-300">Sequence Size:</span> {capabilities.model_info.tlob.sequence_size} timesteps</p>
                    <p><span className="text-purple-300">Layers:</span> {capabilities.model_info.tlob.num_layers}</p>
                    <p><span className="text-purple-300">Attention Heads:</span> {capabilities.model_info.tlob.num_heads}</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600/30 to-cyan-600/30 rounded-xl p-6 border border-blue-400/30">
                  <h3 className="text-xl font-bold text-white mb-3">🧠 {capabilities.model_info.mlplob.name}</h3>
                  <div className="space-y-2 text-blue-100">
                    <p><span className="text-blue-300">Architecture:</span> {capabilities.model_info.mlplob.architecture}</p>
                    <p><span className="text-blue-300">Sequence Size:</span> {capabilities.model_info.mlplob.sequence_size} timesteps</p>
                    <p><span className="text-blue-300">Layers:</span> {capabilities.model_info.mlplob.num_layers}</p>
                    <p><span className="text-blue-300">Hidden Dim:</span> {capabilities.model_info.mlplob.hidden_dim}</p>
                  </div>
                </div>
              </div>

              {/* Capability Categories */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {capabilities.capabilities.map((cap, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 rounded-xl border border-purple-400/20 overflow-hidden hover:border-purple-400/40 transition-all"
                    data-testid={`capability-card-${idx}`}
                  >
                    <button
                      onClick={() => toggleCategory(cap.category)}
                      className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cap.icon}</span>
                        <h3 className="text-white font-semibold">{cap.category}</h3>
                      </div>
                      <span className="text-purple-300">
                        {expandedCategories[cap.category] ? '▼' : '▶'}
                      </span>
                    </button>

                    {expandedCategories[cap.category] && (
                      <div className="px-4 pb-4">
                        <ul className="space-y-2">
                          {cap.items.map((item, itemIdx) => (
                            <li key={itemIdx} className="text-purple-200 text-sm flex items-start gap-2">
                              <span className="text-purple-400 mt-1">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-6" data-testid="upload-section-title">
              Upload Order Book Data
            </h2>

            <form onSubmit={handleSubmit}>
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                    ? 'border-purple-400 bg-purple-500/20'
                    : 'border-purple-300/50 hover:border-purple-400'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                data-testid="upload-dropzone"
              >
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-purple-300"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="text-purple-100 mb-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-purple-300 hover:text-purple-200 font-semibold">
                      Click to upload
                    </span>
                    <span> or drag and drop</span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".csv"
                    onChange={handleFileChange}
                    data-testid="file-input"
                  />
                </div>
                <p className="text-sm text-purple-300" data-testid="file-requirements">
                  CSV file with columns: timestamp, symbol, bid_qty, bid_price, ask_price, ask_qty
                </p>
                {file && (
                  <div className="mt-4 p-3 bg-purple-500/30 rounded-lg" data-testid="selected-file">
                    <p className="text-white font-medium">Selected: {file.name}</p>
                    <p className="text-purple-200 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!file || loading}
                className="w-full mt-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                data-testid="predict-button"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  '🔮 Predict Price Movement'
                )}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg" data-testid="error-message">
                <p className="text-red-200">❌ {error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="max-w-6xl mx-auto" data-testid="results-section">
            {/* Summary Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 mb-6" data-testid="summary-card">
              <h3 className="text-xl font-semibold text-white mb-4">📊 Data Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-500/20 rounded-lg p-4">
                  <p className="text-purple-300 text-sm">Symbol</p>
                  <p className="text-white text-2xl font-bold" data-testid="summary-symbol">{results.summary.symbol}</p>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-4">
                  <p className="text-purple-300 text-sm">Total Rows</p>
                  <p className="text-white text-2xl font-bold" data-testid="summary-rows">{results.summary.total_rows}</p>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-4">
                  <p className="text-purple-300 text-sm">Time Range</p>
                  <p className="text-white text-sm" data-testid="summary-time-range">
                    {results.summary.time_range.start} to {results.summary.time_range.end}
                  </p>
                </div>
              </div>
            </div>

            {/* Model Predictions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* TLOB Results */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6" data-testid="tlob-results">
                <h3 className="text-2xl font-bold text-white mb-2">🤖 TLOB Model</h3>
                <p className="text-purple-200 mb-1">{results.model_metadata?.tlob.name}</p>
                <p className="text-purple-300 text-sm mb-4">{results.model_metadata?.tlob.description}</p>

                <div className="bg-purple-500/20 rounded-lg p-4 mb-4">
                  <p className="text-purple-300 text-sm mb-2">Most Likely Prediction</p>
                  <p className="text-white text-3xl font-bold" data-testid="tlob-most-likely">
                    {getMostLikelyPrediction(results.tlob.predictions)}
                  </p>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const stats = calculateStats(results.tlob.predictions);
                    return (
                      <>
                        <div className="bg-green-500/20 rounded-lg p-3" data-testid="tlob-up-stat">
                          <div className="flex justify-between items-center">
                            <span className="text-green-300">⬆️ Up</span>
                            <span className="text-white font-bold">{stats.up}%</span>
                          </div>
                        </div>
                        <div className="bg-yellow-500/20 rounded-lg p-3" data-testid="tlob-stationary-stat">
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-300">➡️ Stationary</span>
                            <span className="text-white font-bold">{stats.stationary}%</span>
                          </div>
                        </div>
                        <div className="bg-red-500/20 rounded-lg p-3" data-testid="tlob-down-stat">
                          <div className="flex justify-between items-center">
                            <span className="text-red-300">⬇️ Down</span>
                            <span className="text-white font-bold">{stats.down}%</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <p className="text-purple-300 text-sm mt-4" data-testid="tlob-prediction-count">
                  Total Predictions: {results.tlob.num_predictions}
                </p>
              </div>

              {/* MLPLOB Results */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6" data-testid="mlplob-results">
                <h3 className="text-2xl font-bold text-white mb-2">🧠 MLPLOB Model</h3>
                <p className="text-purple-200 mb-1">{results.model_metadata?.mlplob.name}</p>
                <p className="text-purple-300 text-sm mb-4">{results.model_metadata?.mlplob.description}</p>

                <div className="bg-pink-500/20 rounded-lg p-4 mb-4">
                  <p className="text-pink-300 text-sm mb-2">Most Likely Prediction</p>
                  <p className="text-white text-3xl font-bold" data-testid="mlplob-most-likely">
                    {getMostLikelyPrediction(results.mlplob.predictions)}
                  </p>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const stats = calculateStats(results.mlplob.predictions);
                    return (
                      <>
                        <div className="bg-green-500/20 rounded-lg p-3" data-testid="mlplob-up-stat">
                          <div className="flex justify-between items-center">
                            <span className="text-green-300">⬆️ Up</span>
                            <span className="text-white font-bold">{stats.up}%</span>
                          </div>
                        </div>
                        <div className="bg-yellow-500/20 rounded-lg p-3" data-testid="mlplob-stationary-stat">
                          <div className="flex justify-between items-center">
                            <span className="text-yellow-300">➡️ Stationary</span>
                            <span className="text-white font-bold">{stats.stationary}%</span>
                          </div>
                        </div>
                        <div className="bg-red-500/20 rounded-lg p-3" data-testid="mlplob-down-stat">
                          <div className="flex justify-between items-center">
                            <span className="text-red-300">⬇️ Down</span>
                            <span className="text-white font-bold">{stats.down}%</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <p className="text-purple-300 text-sm mt-4" data-testid="mlplob-prediction-count">
                  Total Predictions: {results.mlplob.num_predictions}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
