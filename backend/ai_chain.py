import openai
import json
import os
from typing import List

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MODEL = "gpt-4o-mini"

# How many chunks to send to the AI. Each chunk is ~1500 chars (~375 tokens).
# 6 chunks ≈ 2250 tokens of paper text — enough for abstract + intro + methods.
MAX_CHUNKS = 6


def _call(system: str, user: str) -> str:
    """Make a single OpenAI API call and return the raw text response."""
    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=1500,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return response.choices[0].message.content


def _parse_json(raw: str) -> dict | list:
    """
    Parse JSON from a Claude response.

    Claude sometimes wraps JSON in markdown code fences (```json ... ```).
    This strips those fences before parsing so we always get clean data.
    """
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        # parts[1] is the content inside the fences
        raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


async def run_analysis_chain(user_context: str, chunks: List[str]) -> dict:
    """
    Run the 3-step analysis chain against a paper and a user's research context.

    Step 1 — Summarize: extract structured info from the paper text
    Step 2 — Relevance: assess how relevant the paper is to the user's work
    Step 3 — Suggest: generate concrete, actionable application ideas

    Each step's output feeds into the next. This chaining produces better results
    than asking all three questions in a single prompt.
    """
    paper_text = "\n\n---\n\n".join(chunks[:MAX_CHUNKS])
    user_context = user_context[:12_000]  # guard against oversized context reaching the chain

    # ── Step 1: Summarize the paper ──────────────────────────────────────────
    summary_raw = _call(
        system=(
            "You are a research paper analyst. Extract structured information "
            "from academic papers. Always respond with valid JSON only — no extra text, "
            "no markdown outside the JSON."
        ),
        user=f"""Analyze this research paper text and return JSON with exactly these fields:
- title (string)
- main_contribution (string, 2-3 sentences)
- methods_used (array of strings)
- key_findings (array of strings)
- domain (string, e.g. "computer vision", "NLP", "reinforcement learning")

Paper text:
{paper_text}""",
    )
    paper_summary = _parse_json(summary_raw)

    # ── Step 2: Assess relevance to the user's pipeline ──────────────────────
    relevance_raw = _call(
        system=(
            "You are an expert at finding connections between research papers and "
            "applied ML pipelines. Always respond with valid JSON only."
        ),
        user=f"""A researcher has this pipeline/project:

<user_context>
{user_context}
</user_context>

A paper has these characteristics:

<paper_summary>
{json.dumps(paper_summary, indent=2)}
</paper_summary>

Return JSON with exactly these fields:
- relevance_score (integer 1–10)
- relevance_reasoning (string, 2–3 sentences explaining the score)
- applicable_areas (array of strings: specific parts of their pipeline this paper applies to)
- concept_mappings (array of objects with keys "paper_concept" and "user_pipeline_equivalent")""",
    )
    relevance = _parse_json(relevance_raw)

    # ── Step 3: Generate actionable suggestions ───────────────────────────────
    suggestions_raw = _call(
        system=(
            "You are a senior ML researcher giving practical, specific implementation advice. "
            "Always respond with valid JSON only."
        ),
        user=f"""Given this research pipeline:

<user_context>
{user_context}
</user_context>

And this paper analysis:

<analysis>
{json.dumps({**paper_summary, **relevance}, indent=2)}
</analysis>

Generate 3–5 concrete, actionable suggestions for how the researcher could apply this paper to their work.
Be specific — reference actual method names. Acknowledge real limitations honestly.

Return a JSON array of objects, each with:
- title (string, short label)
- description (string, specific and actionable)
- difficulty ("easy", "medium", or "hard")
- caveats (string, honest limitations or risks)""",
    )
    suggestions = _parse_json(suggestions_raw)

    return {
        "paper_summary": paper_summary,
        "relevance": relevance,
        "suggestions": suggestions,
    }
