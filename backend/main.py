from dotenv import load_dotenv
load_dotenv()

import os
import httpx
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, UploadFile, File, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from session_store import SessionStore
from pdf_parser import extract_and_chunk
from ai_chain import run_analysis_chain

app = FastAPI(title="Research Paper Analyzer")

# In production (Railway), set ALLOWED_ORIGINS to your Vercel URL.
# Multiple origins can be comma-separated: https://your-app.vercel.app,http://localhost:5173
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = SessionStore()

# ── Rate limiting ─────────────────────────────────────────────────────────────
# 3 analyses per IP per 24 hours, tracked in-memory.
# Resets on server restart — acceptable for a portfolio project.
RATE_LIMIT = 3
RATE_WINDOW = timedelta(hours=24)
_rate_store: dict[str, deque] = defaultdict(deque)


def _get_client_ip(request: Request) -> str:
    # X-Forwarded-For is set by Railway's proxy in production.
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host


def check_rate_limit(request: Request):
    ip = _get_client_ip(request)
    now = datetime.now(timezone.utc)
    window_start = now - RATE_WINDOW

    timestamps = _rate_store[ip]
    while timestamps and timestamps[0] < window_start:
        timestamps.popleft()

    if len(timestamps) >= RATE_LIMIT:
        raise HTTPException(
            status_code=429,
            detail=(
                f"You've used your {RATE_LIMIT} free analyses for today. "
                "Check back tomorrow, or explore the demo papers in the meantime."
            ),
        )

    timestamps.append(now)


# ── Models ────────────────────────────────────────────────────────────────────

class ContextRequest(BaseModel):
    session_id: str
    context: str


class AnalyzeUrlRequest(BaseModel):
    session_id: str
    pdf_url: str


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


MAX_CONTEXT_CHARS = 12_000  # ~3000 tokens — generous for a pipeline description


@app.post("/set-context")
def set_context(body: ContextRequest):
    if len(body.context) > MAX_CONTEXT_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Context is too long ({len(body.context):,} chars). "
                   f"Please keep it under {MAX_CONTEXT_CHARS:,} characters (~3,000 tokens). "
                   "If you uploaded a file, paste only the relevant sections.",
        )
    store.set(body.session_id, body.context)
    return {"message": "Context saved"}


@app.post("/analyze-url")
async def analyze_url(body: AnalyzeUrlRequest, _=Depends(check_rate_limit)):
    context = store.get(body.session_id)
    if not context:
        raise HTTPException(
            status_code=400,
            detail="No context set for this session. Set your research context first.",
        )

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(body.pdf_url, follow_redirects=True, timeout=20)
        r.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(status_code=422, detail="Could not fetch the PDF from the provided URL.")

    chunks = extract_and_chunk(r.content)
    if not chunks:
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from this PDF. It may be a scanned image without a text layer.",
        )

    return await run_analysis_chain(context, chunks)


@app.post("/analyze-paper")
async def analyze_paper(session_id: str, file: UploadFile = File(...), _=Depends(check_rate_limit)):
    context = store.get(session_id)
    if not context:
        raise HTTPException(
            status_code=400,
            detail="No context set for this session. Set your research context first.",
        )

    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF.")

    pdf_bytes = await file.read()
    chunks = extract_and_chunk(pdf_bytes)

    if not chunks:
        raise HTTPException(
            status_code=422,
            detail="Could not extract text from this PDF. It may be a scanned image without a text layer.",
        )

    return await run_analysis_chain(context, chunks)
