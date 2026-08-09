"""SQLite-backed document store.

Replaces the previous in-memory dict so documents/entities survive a
server restart, and provides `purge_expired` so a background task can
actually delete old PII instead of letting it accumulate forever.

Uses plain stdlib sqlite3 (not an async driver) wrapped in
`asyncio.to_thread`, which is plenty for this access pattern and avoids
pulling in another dependency.
"""

import asyncio
import json
import sqlite3
import time
from pathlib import Path
from typing import Any, Optional

_JSON_COLUMNS = {"entities", "redacted_entities"}


class DocumentStore:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(self.db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        conn = self._connect()
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    upload_time TEXT NOT NULL,
                    original_path TEXT,
                    extracted_text TEXT,
                    entities TEXT,
                    status TEXT,
                    redacted_path TEXT,
                    redacted_filename TEXT,
                    redacted_count INTEGER,
                    redacted_entities TEXT,
                    redacted_text TEXT,
                    redaction_time TEXT,
                    created_at REAL NOT NULL
                )
                """
            )
            conn.commit()
        finally:
            conn.close()

    @staticmethod
    def _row_to_dict(row: sqlite3.Row) -> dict:
        doc = dict(row)
        for key in _JSON_COLUMNS:
            doc[key] = json.loads(doc[key]) if doc.get(key) else []
        return doc

    # -- blocking implementations (run via asyncio.to_thread) --

    def _create(self, document_id: str, data: dict) -> None:
        conn = self._connect()
        try:
            conn.execute(
                """
                INSERT INTO documents
                    (id, filename, upload_time, original_path, extracted_text,
                     entities, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    document_id,
                    data["filename"],
                    data["upload_time"],
                    data["original_path"],
                    data["extracted_text"],
                    json.dumps(data.get("entities", [])),
                    data.get("status", "processed"),
                    time.time(),
                ),
            )
            conn.commit()
        finally:
            conn.close()

    def _get(self, document_id: str) -> Optional[dict]:
        conn = self._connect()
        try:
            row = conn.execute(
                "SELECT * FROM documents WHERE id = ?", (document_id,)
            ).fetchone()
            return self._row_to_dict(row) if row else None
        finally:
            conn.close()

    def _update(self, document_id: str, updates: dict) -> None:
        if not updates:
            return
        conn = self._connect()
        try:
            set_clause = []
            values: list[Any] = []
            for key, value in updates.items():
                if key in _JSON_COLUMNS:
                    value = json.dumps(value)
                set_clause.append(f"{key} = ?")
                values.append(value)
            values.append(document_id)
            conn.execute(
                f"UPDATE documents SET {', '.join(set_clause)} WHERE id = ?", values
            )
            conn.commit()
        finally:
            conn.close()

    def _list(self) -> list[dict]:
        conn = self._connect()
        try:
            rows = conn.execute(
                """
                SELECT id, filename, upload_time, status, entities, redacted_count, created_at
                FROM documents
                ORDER BY created_at DESC
                """
            ).fetchall()
            return [self._row_to_dict(row) for row in rows]
        finally:
            conn.close()

    def _delete(self, document_id: str) -> None:
        conn = self._connect()
        try:
            conn.execute("DELETE FROM documents WHERE id = ?", (document_id,))
            conn.commit()
        finally:
            conn.close()

    def _purge_expired(self, retention_seconds: float) -> list[dict]:
        conn = self._connect()
        try:
            cutoff = time.time() - retention_seconds
            rows = conn.execute(
                "SELECT * FROM documents WHERE created_at < ?", (cutoff,)
            ).fetchall()
            expired = [self._row_to_dict(row) for row in rows]
            conn.execute("DELETE FROM documents WHERE created_at < ?", (cutoff,))
            conn.commit()
            return expired
        finally:
            conn.close()

    # -- async facade used by routes --

    async def create(self, document_id: str, data: dict) -> None:
        await asyncio.to_thread(self._create, document_id, data)

    async def get(self, document_id: str) -> Optional[dict]:
        return await asyncio.to_thread(self._get, document_id)

    async def update(self, document_id: str, **updates) -> None:
        await asyncio.to_thread(self._update, document_id, updates)

    async def list_all(self) -> list[dict]:
        return await asyncio.to_thread(self._list)

    async def delete(self, document_id: str) -> None:
        await asyncio.to_thread(self._delete, document_id)

    async def purge_expired(self, retention_hours: float) -> list[dict]:
        return await asyncio.to_thread(self._purge_expired, retention_hours * 3600)
