import { useState } from 'react'

// In production (Vercel), set VITE_API_BASE_URL to your Railway backend URL.
// In local dev this falls back to /api, which Vite proxies to localhost:8000.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const LOADING_STAGES = [
  'Fetching paper',
  'Extracting key methods',
  'Mapping to your context',
  'Generating suggestions',
]

export function useAnalysis() {
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const [error, setError] = useState(null)

  function _startStageTimer() {
    let idx = 0
    const timer = setInterval(() => {
      idx = Math.min(idx + 1, LOADING_STAGES.length - 1)
      setStageIndex(idx)
    }, 3500)
    return timer
  }

  async function _runAnalysis(fetchFn) {
    setLoading(true)
    setError(null)
    setAnalysis(null)
    setStageIndex(0)

    const timer = _startStageTimer()
    try {
      const data = await fetchFn()
      setAnalysis(data)
    } catch (e) {
      setError(e.message)
    } finally {
      clearInterval(timer)
      setLoading(false)
      setStageIndex(0)
    }
  }

  async function analyzePaper(sessionId, file) {
    await _runAnalysis(async () => {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/analyze-paper?session_id=${sessionId}`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Analysis failed')
      }
      return res.json()
    })
  }

  async function analyzeUrl(sessionId, pdfUrl) {
    await _runAnalysis(async () => {
      const res = await fetch(`${API_BASE}/analyze-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, pdf_url: pdfUrl }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Analysis failed')
      }
      return res.json()
    })
  }

  async function saveContext(sessionId, context) {
    const res = await fetch(`${API_BASE}/set-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, context }),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.detail || 'Failed to save context')
    }
  }

  return { analysis, loading, stageIndex, error, analyzePaper, analyzeUrl, saveContext }
}
