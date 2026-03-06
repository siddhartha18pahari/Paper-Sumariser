import { useState } from 'react'
import ContextPanel from './components/ContextPanel'
import AnalysisPanel from './components/AnalysisPanel'
import { useAnalysis, LOADING_STAGES } from './hooks/useAnalysis'

const SESSION_ID = 'user-session-1'

export default function App() {
  const [contextSaved, setContextSaved] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState(null)
  const { analysis, loading, stageIndex, error, analyzePaper, analyzeUrl, saveContext } = useAnalysis()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800/60 px-6 py-3.5 flex items-center gap-3">
        <h1 className="text-sm font-semibold tracking-tight text-zinc-100">Research Paper Analyzer</h1>
        <span className="text-zinc-600 select-none">·</span>
        <span className="text-xs text-zinc-500">Connect any paper to your ML pipeline</span>
      </header>

      <main className="grid grid-cols-2 divide-x divide-zinc-800/60" style={{ height: 'calc(100vh - 53px)' }}>
        <ContextPanel
          sessionId={SESSION_ID}
          saveContext={saveContext}
          onContextSaved={() => setContextSaved(true)}
          contextSaved={contextSaved}
          selectedPaper={selectedPaper}
          onSelectPaper={(paper) => {
            setSelectedPaper(paper)
            setContextSaved(false)
          }}
        />
        <AnalysisPanel
          sessionId={SESSION_ID}
          contextSaved={contextSaved}
          selectedPaper={selectedPaper}
          onAnalyze={analyzePaper}
          onAnalyzeUrl={analyzeUrl}
          analysis={analysis}
          loading={loading}
          stageIndex={stageIndex}
          loadingStages={LOADING_STAGES}
          error={error}
        />
      </main>
    </div>
  )
}
