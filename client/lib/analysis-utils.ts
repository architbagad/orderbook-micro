export function calculateStats(predictions: number[]) {
  const total = predictions.length
  const up = predictions.filter((p) => p === 0).length
  const stationary = predictions.filter((p) => p === 1).length
  const down = predictions.filter((p) => p === 2).length

  return {
    up: ((up / total) * 100).toFixed(1),
    stationary: ((stationary / total) * 100).toFixed(1),
    down: ((down / total) * 100).toFixed(1),
  }
}

export function getMostLikelyPrediction(predictions: number[]): string {
  const counts = [0, 0, 0]
  predictions.forEach((p) => counts[p]++)
  const maxIndex = counts.indexOf(Math.max(...counts))
  return ["Up", "Stationary", "Down"][maxIndex]
}

export function calculateAverageProbabilities(probabilities: number[][]): { up: number; stationary: number; down: number } {
  if (!probabilities || probabilities.length === 0) {
    return { up: 0, stationary: 0, down: 0 }
  }

  const total = probabilities.length
  const sums = probabilities.reduce(
    (acc, probs) => {
      return {
        up: acc.up + (probs[0] || 0),
        stationary: acc.stationary + (probs[1] || 0),
        down: acc.down + (probs[2] || 0),
      }
    },
    { up: 0, stationary: 0, down: 0 }
  )

  return {
    up: (sums.up / total) * 100,
    stationary: (sums.stationary / total) * 100,
    down: (sums.down / total) * 100,
  }
}

export function getConfidenceScore(probabilities: number[][]): number {
  if (!probabilities || probabilities.length === 0) return 0

  const maxProbs = probabilities.map((probs) => Math.max(...probs))
  const avgConfidence = maxProbs.reduce((sum, prob) => sum + prob, 0) / maxProbs.length

  return avgConfidence * 100
}

export function calculateConfidenceStats(probabilities: number[][]): {
  average: number
  min: number
  max: number
  high: number
  medium: number
  low: number
} {
  if (!probabilities || probabilities.length === 0) {
    return { average: 0, min: 0, max: 0, high: 0, medium: 0, low: 0 }
  }

  const maxProbs = probabilities.map((probs) => Math.max(...probs))
  const average = (maxProbs.reduce((sum, prob) => sum + prob, 0) / maxProbs.length) * 100
  const min = Math.min(...maxProbs) * 100
  const max = Math.max(...maxProbs) * 100

  const high = maxProbs.filter((p) => p >= 0.7).length
  const medium = maxProbs.filter((p) => p >= 0.5 && p < 0.7).length
  const low = maxProbs.filter((p) => p < 0.5).length

  return {
    average: Number(average.toFixed(1)),
    min: Number(min.toFixed(1)),
    max: Number(max.toFixed(1)),
    high,
    medium,
    low,
  }
}
