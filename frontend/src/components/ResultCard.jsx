import { useState } from 'react'

function formatAsMarkdown(analysis) {
  const { paper_summary, relevance, suggestions } = analysis
  const lines = []

  lines.push(`# Paper Analysis: ${paper_summary.title || 'Untitled'}`)
  lines.push('')
  lines.push(`**Domain:** ${paper_summary.domain}  **Relevance Score:** ${relevance.relevance_score}/10`)
  lines.push('')
  lines.push('## Summary')
  lines.push(paper_summary.main_contribution)
  lines.push('')
  lines.push('### Methods Used')
  paper_summary.methods_used?.forEach((m) => lines.push(`- ${m}`))
  lines.push('')
  lines.push('### Key Findings')
  paper_summary.key_findings?.forEach((f) => lines.push(`- ${f}`))
  lines.push('')
  lines.push('## Relevance to Your Research')
  lines.push(relevance.relevance_reasoning)
  lines.push('')

  if (relevance.applicable_areas?.length) {
    lines.push('### Applicable Areas')
    relevance.applicable_areas.forEach((a) => lines.push(`- ${a}`))
    lines.push('')
  }

  if (relevance.concept_mappings?.length) {
    lines.push('### Concept Connections')
    lines.push('| Paper Concept | Your Pipeline |')
    lines.push('|---|---|')
    relevance.concept_mappings.forEach((m) =>
      lines.push(`| ${m.paper_concept} | ${m.user_pipeline_equivalent} |`)
    )
    lines.push('')
  }

  lines.push('## Suggested Applications')
  suggestions?.forEach((s, i) => {
    lines.push(`### ${i + 1}. ${s.title} *(${s.difficulty})*`)
    lines.push(s.description)
    if (s.caveats) lines.push(`\n> ⚠ ${s.caveats}`)
    lines.push('')
  })

  return lines.join('\n')
}

const DIFFICULTY_STYLES = {
  easy:   'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20',
  hard:   'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
}

export default function ResultCard({ analysis }) {
  const { paper_summary, relevance, suggestions } = analysis
  const [copied, setCopied] = useState(false)

  const scoreColor =
    relevance.relevance_score >= 7
      ? 'text-emerald-400'
      : relevance.relevance_score >= 4
        ? 'text-yellow-400'
        : 'text-red-400'

  const scoreBg =
    relevance.relevance_score >= 7
      ? 'bg-emerald-500/5 ring-emerald-500/15'
      : relevance.relevance_score >= 4
        ? 'bg-yellow-500/5 ring-yellow-500/15'
        : 'bg-red-500/5 ring-red-500/15'

  function handleCopy() {
    navigator.clipboard.writeText(formatAsMarkdown(analysis))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const md = formatAsMarkdown(analysis)
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(paper_summary.title || 'paper-analysis').replace(/\s+/g, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isLowRelevance = relevance.relevance_score <= 3

  return (
    <div className="flex flex-col gap-3">
      {/* Low relevance banner */}
      {isLowRelevance && (
        <div className="bg-zinc-900/60 ring-1 ring-zinc-700/60 rounded-xl p-3 text-[11px] text-zinc-500">
          Low relevance score — suggestions below are speculative. Consider finding a closer paper match.
        </div>
      )}

      {/* Relevance score */}
      <div className={`rounded-xl ring-1 p-4 ${scoreBg}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Relevance</h3>
          <span className={`text-3xl font-bold tabular-nums ${scoreColor}`}>
            {relevance.relevance_score}<span className="text-lg text-zinc-600">/10</span>
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">{relevance.relevance_reasoning}</p>
      </div>

      {/* Paper summary */}
      <div className="bg-zinc-900/60 ring-1 ring-zinc-800/60 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-zinc-100 mb-1 leading-snug">
          {paper_summary.title || 'Paper Summary'}
        </h3>
        <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">{paper_summary.main_contribution}</p>
        <div className="flex flex-wrap gap-1">
          {paper_summary.methods_used?.map((method) => (
            <span
              key={method}
              className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md ring-1 ring-zinc-700/60"
            >
              {method}
            </span>
          ))}
        </div>
      </div>

      {/* Concept mappings */}
      {relevance.concept_mappings?.length > 0 && (
        <div className="bg-zinc-900/60 ring-1 ring-zinc-800/60 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
            Concept Connections
          </h3>
          <div className="flex flex-col gap-2">
            {relevance.concept_mappings.map((mapping, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px]">
                <span className="text-blue-400 font-mono bg-blue-500/10 ring-1 ring-blue-500/20 px-2 py-0.5 rounded-md flex-shrink-0">
                  {mapping.paper_concept}
                </span>
                <span className="text-zinc-600 mt-0.5">→</span>
                <span className="text-zinc-400 leading-relaxed">{mapping.user_pipeline_equivalent}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2.5">
          Suggested Applications
        </h3>
        <div className="flex flex-col gap-2.5">
          {suggestions?.map((suggestion, i) => (
            <div key={i} className="bg-zinc-900/60 ring-1 ring-zinc-800/60 rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className="text-xs font-medium text-zinc-100 leading-snug">{suggestion.title}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md flex-shrink-0 ${DIFFICULTY_STYLES[suggestion.difficulty] ?? ''}`}>
                  {suggestion.difficulty}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">{suggestion.description}</p>
              {suggestion.caveats && (
                <p className="text-[11px] text-zinc-600 italic leading-relaxed">{suggestion.caveats}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="flex gap-2 pt-1 pb-2">
        <button
          onClick={handleCopy}
          className="text-[11px] ring-1 ring-zinc-700/60 rounded-lg px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          {copied ? '✓ Copied' : 'Copy as Markdown'}
        </button>
        <button
          onClick={handleDownload}
          className="text-[11px] ring-1 ring-zinc-700/60 rounded-lg px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Download .md
        </button>
      </div>
    </div>
  )
}
