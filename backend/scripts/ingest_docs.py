#!/usr/bin/env python
"""Ingest /data documents into ChromaDB for TeleBot retrieval."""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

import chromadb
from chromadb.config import Settings
from pypdf import PdfReader

ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from apps.chat.services.embedding_utils import chunk_text, embed_text


def collect_documents(data_dir: Path) -> list[Path]:
    supported = {".pdf", ".txt", ".md"}
    skip_names = {"readme.md"}
    return sorted(
        path
        for path in data_dir.rglob("*")
        if path.suffix.lower() in supported and path.name.lower() not in skip_names
    )


def read_document(path: Path) -> str:
    if path.suffix.lower() == ".pdf":
        reader = PdfReader(str(path))
        pages = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages).strip()

    return path.read_text(encoding="utf-8", errors="ignore").strip()


def source_id_for(path: Path, data_dir: Path) -> str:
    relative = path.relative_to(data_dir).as_posix().lower()
    return re.sub(r"[^a-z0-9]+", "-", relative).strip("-")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest documents into ChromaDB.")
    parser.add_argument(
        "--data-dir",
        default=str(ROOT_DIR.parent / "data"),
        help="Path to source documents",
    )
    parser.add_argument(
        "--reset", action="store_true", help="Delete existing collection before ingest"
    )
    parser.add_argument(
        "--chunk-size", type=int, default=900, help="Chunk size in characters"
    )
    parser.add_argument(
        "--overlap", type=int, default=120, help="Chunk overlap in characters"
    )
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    docs = collect_documents(data_dir)

    if not docs:
        print(f"No source documents found in {data_dir}.")
        return

    chroma_persist_dir = os.getenv(
        "CHROMA_PERSIST_DIR",
        str(ROOT_DIR / "chroma_data"),
    )
    collection_name = os.getenv("CHROMA_COLLECTION", "telesur_docs")

    Path(chroma_persist_dir).mkdir(parents=True, exist_ok=True)
    client = chromadb.PersistentClient(
        path=chroma_persist_dir,
        settings=Settings(anonymized_telemetry=False),
    )
    if args.reset:
        try:
            client.delete_collection(collection_name)
            print(f"Deleted existing collection: {collection_name}")
        except Exception:
            pass
    collection = client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )

    ids: list[str] = []
    metadatas: list[dict[str, str | int]] = []
    documents: list[str] = []
    embeddings: list[list[float]] = []

    total_chunks = 0
    print(f"Found {len(docs)} source documents.")
    for path in docs:
        text = read_document(path)
        chunks = chunk_text(text, chunk_size=args.chunk_size, overlap=args.overlap)
        if not chunks:
            continue

        source_id = source_id_for(path=path, data_dir=data_dir)
        title = path.stem.replace("_", " ").replace("-", " ").title()
        relative_path = path.relative_to(data_dir).as_posix()

        for chunk_index, chunk in enumerate(chunks):
            chunk_id = f"{source_id}:{chunk_index}"
            ids.append(chunk_id)
            documents.append(chunk)
            embeddings.append(embed_text(chunk))
            metadatas.append(
                {
                    "source_id": source_id,
                    "title": title,
                    "path": relative_path,
                    "chunk_index": chunk_index,
                }
            )
        total_chunks += len(chunks)
        print(f"- {relative_path}: {len(chunks)} chunks")

    if not ids:
        print("No readable content chunks found.")
        return

    batch_size = 100
    for start in range(0, len(ids), batch_size):
        end = start + batch_size
        collection.upsert(
            ids=ids[start:end],
            documents=documents[start:end],
            metadatas=metadatas[start:end],
            embeddings=embeddings[start:end],
        )

    print(
        f"\nIngestion complete: {len(docs)} documents, {total_chunks} chunks "
        f"into collection '{collection_name}' ({chroma_persist_dir})."
    )


if __name__ == "__main__":
    main()
