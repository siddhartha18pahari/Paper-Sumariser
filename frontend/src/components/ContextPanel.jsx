import { useState } from 'react'
import { DEMO_PAPERS } from '../demo'

const DOMAIN_STYLES = {
  NLP:      { badge: 'bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/20',        ring: 'ring-blue-500/40' },
  LLM:      { badge: 'bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20',  ring: 'ring-violet-500/40' },
  Vision:   { badge: 'bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20',  ring: 'ring-purple-500/40' },
  Training: { badge: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20', ring: 'ring-emerald-500/40' },
  RL:       { badge: 'bg-orange-500/10 text-orange-400 ring-1 ring-orange-500/20',  ring: 'ring-orange-500/40' },
}

export default function ContextPanel({
  sessionId,
  onContextSaved,
  contextSaved,
  saveContext,
  selectedPaper,
  onSelectPaper,
}) {
  const [context, setContext] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [fileLoaded, setFileLoaded] = useState(null)

  function handleFileLoad(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      setContext(event.target.result)
      setFileLoaded(file.name)
      onSelectPaper(null)
    }
    reader.readAsText(file)
  }

  async function handleSave() {
    if (!context.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      await saveContext(sessionId, context)
      onContextSaved()
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSelectPaper(paper) {
    onSelectPaper(paper)
    setContext(paper.presetContext)
    setFileLoaded(null)
    setSaveError(null)
    setSaving(true)
    try {
      await saveContext(sessionId, paper.presetContext)
      onContextSaved()
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Panel header */}
      <div className="px-6 pt-6 pb-4 border-b border-zinc-800/60">
        <h2 className="text-sm font-semibold text-zinc-100">Your Research Context</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Describe your pipeline, or select a demo paper below to auto-fill.
        </p>
      </div>

      <div className="flex flex-col gap-5 px-6 py-5 flex-1">
        {/* Demo paper cards */}
        <div>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-2.5">
            Demo Papers
          </p>
          <div className="flex flex-col gap-2">
            {DEMO_PAPERS.map((paper) => {
              const styles = DOMAIN_STYLES[paper.domain] ?? DOMAIN_STYLES.NLP
              const selected = selectedPaper?.id === paper.id
              return (
                <button
                  key={paper.id}
                  onClick={() => handleSelectPaper(paper)}
                  className={`w-full text-left rounded-xl px-4 py-3 transition-all duration-150 ring-1 ${
                    selected
                      ? `bg-zinc-800/80 ${styles.ring}`
                      : 'bg-zinc-900/50 ring-zinc-800/50 hover:bg-zinc-800/60 hover:ring-zinc-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-medium text-zinc-100 leading-snug">
                      {paper.title}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${styles.badge}`}>
                        {paper.domain}
                      </span>
                      <span className="text-[10px] text-zinc-600">{paper.year}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-snug">{paper.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800/60" />
          <span className="text-[11px] text-zinc-600">or write your own</span>
          <div className="flex-1 h-px bg-zinc-800/60" />
        </div>

        {/* Textarea + controls */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between">
            <label className="cursor-pointer group">
              <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
                Upload file (.py, .ipynb, .txt)
              </span>
              <input
                type="file"
                accept=".py,.ipynb,.txt,.md"
                className="hidden"
                onChange={handleFileLoad}
              />
            </label>
            {fileLoaded && (
              <span className="text-[11px] text-emerald-400">{fileLoaded}</span>
            )}
          </div>

          <textarea
            className="flex-1 min-h-36 bg-zinc-900/50 ring-1 ring-zinc-800/50 rounded-xl p-3.5 text-xs text-zinc-200 font-mono resize-none focus:outline-none focus:ring-zinc-600 placeholder-zinc-700 leading-relaxed transition-colors"
            placeholder="Describe your research pipeline — architecture, task, dataset, current challenges..."
            value={context}
            onChange={(e) => {
              setContext(e.target.value)
              if (selectedPaper) onSelectPaper(null)
            }}
          />

          {saveError && (
            <p className="text-[11px] text-red-400">{saveError}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !context.trim()}
            className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
              contextSaved && !saving
                ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20 cursor-default'
                : 'bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white'
            }`}
          >
            {saving ? 'Saving...' : contextSaved ? '✓ Context saved' : 'Set context'}
          </button>
        </div>
      </div>
    </div>
  )
}
