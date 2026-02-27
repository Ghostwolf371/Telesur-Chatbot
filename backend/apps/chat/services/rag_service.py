from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import chromadb
from chromadb.config import Settings

from apps.chat.services.embedding_utils import embed_text


class RagService:
    def __init__(self) -> None:
        self.chroma_persist_dir = os.getenv(
            "CHROMA_PERSIST_DIR",
            str(Path(__file__).resolve().parent.parent.parent.parent / "chroma_data"),
        )
        self.collection_name = os.getenv("CHROMA_COLLECTION", "telesur_docs")
        self.top_k = int(os.getenv("RAG_TOP_K", "3"))
        self._client: chromadb.PersistentClient | None = None
        self._collection = None

    def _get_collection(self):
        if self._collection is not None:
            return self._collection
        if self._client is None:
            Path(self.chroma_persist_dir).mkdir(parents=True, exist_ok=True)
            self._client = chromadb.PersistentClient(
                path=self.chroma_persist_dir,
                settings=Settings(anonymized_telemetry=False),
            )
        self._collection = self._client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"},
        )
        return self._collection

    def retrieve_context(self, query: str) -> tuple[str, list[dict[str, str]]]:
        try:
            collection = self._get_collection()
            results = collection.query(
                query_embeddings=[embed_text(query)],
                n_results=self.top_k,
                include=["documents", "metadatas", "distances"],
            )
            documents = (results.get("documents") or [[]])[0]
            metadatas = (results.get("metadatas") or [[]])[0]
            distances = (results.get("distances") or [[]])[0]

            if not documents:
                return (
                    "No indexed Telesur document snippets were found for this question.",
                    [],
                )

            ranked_context: list[str] = []
            source_map: dict[str, dict[str, str]] = {}

            for idx, doc in enumerate(documents):
                if not doc:
                    continue
                meta: dict[str, Any] = (
                    metadatas[idx] if idx < len(metadatas) and metadatas[idx] else {}
                )
                source_id = str(meta.get("source_id") or f"doc-{idx + 1}")
                title = str(meta.get("title") or source_id)
                path = str(meta.get("path") or "")
                distance = distances[idx] if idx < len(distances) else None
                score = 1.0 - float(distance) if distance is not None else None
                score_text = f" score={score:.3f}" if score is not None else ""
                ranked_context.append(f"[{idx + 1}{score_text}] {doc}")
                if source_id not in source_map:
                    source_map[source_id] = {
                        "id": source_id,
                        "title": title if not path else f"{title} ({path})",
                    }

            if not ranked_context:
                return (
                    "No indexed Telesur document snippets were found for this question.",
                    [],
                )

            return "\n\n".join(ranked_context), list(source_map.values())
        except Exception:
            # Retrieval failures should degrade gracefully without breaking chat.
            return (
                "Telesur knowledge retrieval is temporarily unavailable. "
                "Use standard support guidance and advise verification with official channels.",
                [],
            )
