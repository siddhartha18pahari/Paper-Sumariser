import { useRef, useState } from 'react'
import ResultCard from './ResultCard'

const DOMAIN_STYLES = {
  NLP:      'text-blue-400',
  LLM:      'text-violet-400',
  Vision:   'text-purple-400',
  Training: 'text-emerald-400',
  RL:       'text-orange-400',
}

export default function AnalysisPanel({
  sessionId,
  contextSaved,
  selectedPaper,
  onAnalyze,
  onAnalyzeUrl,
  analysis,
  loading,
  stageIndex,
  loadingStages,
  error,
}) {
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    if (!contextSaved) return
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') {
      onAnalyze(sessionId, file)
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (file) onAnalyze(sessionId, file)
  }

  const canAnalyze = contextSaved && !loading

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Panel header */}
      <div className="px-6 pt-6 pb-4 border-b border-zinc-800/60">
        <h2 className="text-sm font-semibold text-zinc-100">Paper Analysis</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          {selectedPaper
            ? `Ready to analyze the selected paper against your context.`
            : `Upload a PDF to analyze it against your research context.`}
        </p>
      </div>

      <div className="flex flex-col gap-5 px-6 py-5 flex-1">
        {/* Selected paper CTA */}
        {selectedPaper && (
          <div className="rounded-xl ring-1 ring-zinc-700/60 bg-zinc-900/60 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-1">
                  Selected Paper
                </p>
                <p className="text-sm font-medium text-zinc-100 leading-snug">{selectedPaper.title}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{selectedPaper.description}</p>
              </div>
              <span className={`text-xs font-semibold flex-shrink-0 ${DOMAIN_STYLES[selectedPaper.domain] ?? 'text-zinc-400'}`}>
                {selectedPaper.year}
              </span>
            </div>
            <button
              onClick={() => onAnalyzeUrl(sessionId, selectedPaper.pdfUrl)}
              disabled={!canAnalyze}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-medium transition-colors"
            >
              {loading ? 'Analyzing...' : `Analyze — ${selectedPaper.title}`}
            </button>
          </div>
        )}

        {/* Divider when paper selected */}
        {selectedPaper && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800/60" />
            <span className="text-[11px] text-zinc-600">or upload your own PDF</span>
            <div className="flex-1 h-px bg-zinc-800/60" />
          </div>
        )}

        {/* PDF drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); if (contextSaved) setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => canAnalyze && fileInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed px-8 py-10 text-center transition-all duration-150 ${
            !contextSaved
              ? 'border-zinc-800 opacity-30 cursor-not-allowed'
              : dragOver
                ? 'border-blue-500 bg-blue-500/5 cursor-pointer'
                : 'border-zinc-700/60 hover:border-zinc-500 cursor-pointer'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="flex flex-col items-center gap-2">
            <svg className="w-6 h-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-xs text-zinc-400">
              {contextSaved ? 'Drop a PDF here or click to browse' : 'Set your research context first'}
            </p>
            {contextSaved && (
              <p className="text-[11px] text-zinc-600">.pdf files only</p>
            )}
          </div>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="py-4">
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              {loadingStages.map((label, i) => {
                const done = i < stageIndex
                const active = i === stageIndex
                return (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 ring-2 ${
                      done
                        ? 'bg-emerald-500 ring-emerald-500'
                        : active
                          ? 'ring-blue-500 bg-transparent'
                          : 'ring-zinc-700 bg-transparent'
                    }`}>
                      {done && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {active && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                    <span className={`text-xs ${
                      done ? 'text-zinc-600 line-through' : active ? 'text-zinc-100' : 'text-zinc-600'
                    }`}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/5 ring-1 ring-red-500/20 rounded-xl p-4 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {analysis && !loading && <ResultCard analysis={analysis} />}
      </div>
    </div>
  )
}
