from __future__ import annotations

import hashlib
import math
import os
import re

from openai import OpenAI


_TOKEN_PATTERN = re.compile(r"[a-z0-9]+")
DEFAULT_EMBEDDING_DIM = 1536  # OpenAI text-embedding-3-small dimension

# OpenAI embedding configuration
_OPENAI_EMBED_MODEL = os.getenv("OPENAI_EMBED_MODEL", "text-embedding-3-small")
_openai_client: OpenAI | None = None


def _get_openai_client() -> OpenAI | None:
    global _openai_client
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        return None
    if _openai_client is None:
        _openai_client = OpenAI(api_key=api_key)
    return _openai_client


def _openai_embed(text: str) -> list[float] | None:
    """Request an embedding vector from the OpenAI API."""
    client = _get_openai_client()
    if client is None:
        return None
    try:
        response = client.embeddings.create(
            model=_OPENAI_EMBED_MODEL,
            input=text,
        )
        embedding = response.data[0].embedding
        if embedding and isinstance(embedding, list) and len(embedding) > 0:
            return embedding
    except Exception:
        pass
    return None


def _hash_embed(text: str, dim: int = DEFAULT_EMBEDDING_DIM) -> list[float]:
    """Deterministic lightweight fallback embedding (bag-of-words via hashing)."""
    vector = [0.0] * dim
    tokens = _TOKEN_PATTERN.findall((text or "").lower())
    if not tokens:
        return vector

    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).hexdigest()
        bucket = int(digest[:8], 16) % dim
        sign = -1.0 if int(digest[8:10], 16) % 2 else 1.0
        weight = 1.0 + (int(digest[10:12], 16) / 255.0)
        vector[bucket] += sign * weight

    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector

    return [value / norm for value in vector]


def embed_text(text: str, dim: int = DEFAULT_EMBEDDING_DIM) -> list[float]:
    """Create an embedding vector, preferring OpenAI embeddings.

    Falls back to the deterministic hash-based method when OpenAI is unavailable.
    Note: after switching embedding methods, documents must be re-ingested.
    """
    if dim <= 0:
        raise ValueError("Embedding dimension must be positive.")

    openai_result = _openai_embed(text)
    if openai_result is not None:
        return openai_result

    return _hash_embed(text, dim)


def chunk_text(text: str, chunk_size: int = 900, overlap: int = 120) -> list[str]:
    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive.")
    if overlap < 0:
        raise ValueError("overlap cannot be negative.")
    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size.")

    normalized = " ".join((text or "").split())
    if not normalized:
        return []

    chunks: list[str] = []
    start = 0
    step = chunk_size - overlap
    while start < len(normalized):
        chunk = normalized[start : start + chunk_size].strip()
        if chunk:
            chunks.append(chunk)
        start += step
    return chunks
