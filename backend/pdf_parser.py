import fitz  # PyMuPDF — imported as fitz for historical reasons
from typing import List

# ~1500 chars ≈ ~375 tokens. Adjust based on how much context you want per chunk.
CHUNK_SIZE = 1500
# Overlap ensures a concept split across chunk boundaries isn't lost entirely.
CHUNK_OVERLAP = 200


def extract_and_chunk(pdf_bytes: bytes) -> List[str]:
    """
    Extract all text from a PDF file and split it into overlapping chunks.

    Returns an empty list if no text is found — this usually means the PDF
    is a scanned image without a text layer (OCR would be needed).
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    full_text = ""
    for page in doc:
        full_text += page.get_text()

    doc.close()

    if not full_text.strip():
        return []

    return _chunk_text(full_text)


def _chunk_text(text: str) -> List[str]:
    """
    Split text into overlapping chunks, preferring paragraph breaks as split points.

    Why overlapping? If a key sentence sits at the boundary of two chunks,
    overlap ensures it appears in at least one chunk fully intact.
    """
    chunks = []
    start = 0

    while start < len(text):
        end = start + CHUNK_SIZE

        if end < len(text):
            # Prefer to break on a paragraph boundary near the end of the chunk
            paragraph_break = text.rfind("\n\n", start, end)
            if paragraph_break > start + CHUNK_SIZE // 2:
                end = paragraph_break

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        start = end - CHUNK_OVERLAP

    return chunks
