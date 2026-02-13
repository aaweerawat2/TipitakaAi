#!/usr/bin/env python3
"""
Script 3: Build SQLite Database
Create SQLite database with FTS5 and vector search support
"""

import os
import json
import sqlite3
from pathlib import Path
from typing import List, Optional
from tqdm import tqdm
import argparse
import struct

# ============================================
# Configuration
# ============================================

INPUT_DIR = Path(__file__).parent.parent / "assets" / "database" / "processed"
OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "database"

DB_NAME = "tripitaka_v1.sqlite"

# ============================================
# Database Schema
# ============================================

SCHEMA_SQL = """
-- Metadata table
CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Suttas table (original texts)
CREATE TABLE IF NOT EXISTS suttas (
    id TEXT PRIMARY KEY,
    sutta_id TEXT,
    title_thai TEXT NOT NULL,
    title_pali TEXT,
    pitaka TEXT NOT NULL,
    nikaya TEXT NOT NULL,
    vagga TEXT,
    content_thai TEXT,
    content_pali TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS suttas_fts USING fts5(
    id UNINDEXED,
    title_thai,
    title_pali,
    content_thai,
    content='suttas',
    content_rowid='rowid',
    tokenize='unicode61'
);

-- Chunks table for RAG
CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER,
    total_chunks INTEGER,
    char_start INTEGER,
    char_end INTEGER,
    title_thai TEXT,
    title_pali TEXT,
    pitaka TEXT,
    nikaya TEXT,
    vagga TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (source_id) REFERENCES suttas(id)
);

-- Embeddings table (stored as BLOB for efficiency)
CREATE TABLE IF NOT EXISTS embeddings (
    chunk_id TEXT PRIMARY KEY,
    embedding BLOB NOT NULL,
    dimensions INTEGER NOT NULL,
    model TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (chunk_id) REFERENCES chunks(id)
);

-- User documents table
CREATE TABLE IF NOT EXISTS user_documents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    size INTEGER,
    chunk_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    error TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    processed_at INTEGER
);

-- User document chunks
CREATE TABLE IF NOT EXISTS user_chunks (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER,
    total_chunks INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (document_id) REFERENCES user_documents(id)
);

-- User document embeddings
CREATE TABLE IF NOT EXISTS user_embeddings (
    chunk_id TEXT PRIMARY KEY,
    embedding BLOB NOT NULL,
    dimensions INTEGER NOT NULL,
    model TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (chunk_id) REFERENCES user_chunks(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suttas_pitaka ON suttas(pitaka);
CREATE INDEX IF NOT EXISTS idx_suttas_nikaya ON suttas(nikaya);
CREATE INDEX IF NOT EXISTS idx_chunks_source ON chunks(source_id);
CREATE INDEX IF NOT EXISTS idx_user_docs_status ON user_documents(status);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS suttas_ai AFTER INSERT ON suttas BEGIN
    INSERT INTO suttas_fts(rowid, id, title_thai, title_pali, content_thai)
    VALUES (new.rowid, new.id, new.title_thai, new.title_pali, new.content_thai);
END;

CREATE TRIGGER IF NOT EXISTS suttas_ad AFTER DELETE ON suttas BEGIN
    INSERT INTO suttas_fts(suttas_fts, rowid, id, title_thai, title_pali, content_thai)
    VALUES ('delete', old.rowid, old.id, old.title_thai, old.title_pali, old.content_thai);
END;

CREATE TRIGGER IF NOT EXISTS suttas_au AFTER UPDATE ON suttas BEGIN
    INSERT INTO suttas_fts(suttas_fts, rowid, id, title_thai, title_pali, content_thai)
    VALUES ('delete', old.rowid, old.id, old.title_thai, old.title_pali, old.content_thai);
    INSERT INTO suttas_fts(rowid, id, title_thai, title_pali, content_thai)
    VALUES (new.rowid, new.id, new.title_thai, new.title_pali, new.content_thai);
END;
"""

# ============================================
# Helper Functions
# ============================================

def embedding_to_blob(embedding: List[float]) -> bytes:
    """Convert embedding list to binary blob"""
    return struct.pack(f'{len(embedding)}f', *embedding)

def blob_to_embedding(blob: bytes, dimensions: int) -> List[float]:
    """Convert binary blob to embedding list"""
    return list(struct.unpack(f'{dimensions}f', blob))

# ============================================
# Database Builder
# ============================================

class DatabaseBuilder:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.conn = sqlite3.connect(str(db_path))
        self.conn.execute("PRAGMA journal_mode=WAL")
        self.conn.execute("PRAGMA synchronous=NORMAL")
        self.conn.execute("PRAGMA cache_size=10000")
        
    def create_schema(self):
        """Create database schema"""
        print("Creating database schema...")
        self.conn.executescript(SCHEMA_SQL)
        self.conn.commit()
        
    def set_metadata(self, key: str, value: str):
        """Set metadata key-value"""
        self.conn.execute(
            "INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)",
            (key, value)
        )
        
    def insert_suttas(self, suttas_file: Path):
        """Insert sutta data from JSON"""
        print(f"Loading suttas from {suttas_file}")
        
        # Load extracted suttas
        with open(suttas_file, 'r', encoding='utf-8') as f:
            # Try chunks file first, then extracted file
            try:
                data = json.load(f)
                if isinstance(data, list) and len(data) > 0:
                    if 'content' in data[0]:  # Chunks format
                        return self._insert_from_chunks(data)
                    else:  # Suttas format
                        return self._insert_suttas_list(data)
            except:
                pass
        
    def _insert_suttas_list(self, suttas: List[dict]):
        """Insert list of suttas"""
        print(f"Inserting {len(suttas)} suttas...")
        
        cursor = self.conn.cursor()
        
        for sutta in tqdm(suttas, desc="Inserting suttas"):
            cursor.execute("""
                INSERT OR REPLACE INTO suttas 
                (id, sutta_id, title_thai, title_pali, pitaka, nikaya, vagga, content_thai)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sutta['id'],
                sutta.get('sutta_id', ''),
                sutta['title_thai'],
                sutta.get('title_pali'),
                sutta['pitaka'],
                sutta['nikaya'],
                sutta.get('vagga'),
                sutta['content_thai']
            ))
        
        self.conn.commit()
        
    def _insert_from_chunks(self, chunks: List[dict]):
        """Insert data from chunks format"""
        print(f"Inserting from {len(chunks)} chunks...")
        
        # Group by source_id
        suttas = {}
        for chunk in chunks:
            source_id = chunk['source_id']
            if source_id not in suttas:
                suttas[source_id] = {
                    'id': source_id,
                    'sutta_id': chunk.get('sutta_id', source_id),
                    'title_thai': chunk.get('title_thai', ''),
                    'title_pali': chunk.get('title_pali'),
                    'pitaka': chunk.get('pitaka', ''),
                    'nikaya': chunk.get('nikaya', ''),
                    'vagga': chunk.get('vagga'),
                    'content_thai': '',
                    'chunks': []
                }
            suttas[source_id]['chunks'].append(chunk)
        
        # Reconstruct full content and insert
        cursor = self.conn.cursor()
        
        for source_id, sutta in tqdm(suttas.items(), desc="Inserting suttas"):
            # Sort chunks by index
            sorted_chunks = sorted(sutta['chunks'], key=lambda x: x['chunk_index'])
            full_content = '\n\n'.join(c['content'] for c in sorted_chunks)
            
            # Insert sutta
            cursor.execute("""
                INSERT OR REPLACE INTO suttas 
                (id, sutta_id, title_thai, title_pali, pitaka, nikaya, vagga, content_thai)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                sutta['id'],
                sutta['sutta_id'],
                sutta['title_thai'],
                sutta['title_pali'],
                sutta['pitaka'],
                sutta['nikaya'],
                sutta['vagga'],
                full_content
            ))
        
        self.conn.commit()
        return self.insert_chunks(chunks)
        
    def insert_chunks(self, chunks: List[dict]):
        """Insert chunks and embeddings"""
        print(f"Inserting {len(chunks)} chunks...")
        
        cursor = self.conn.cursor()
        embedding_model = None
        
        for chunk in tqdm(chunks, desc="Inserting chunks"):
            # Insert chunk
            cursor.execute("""
                INSERT OR REPLACE INTO chunks
                (id, source_id, content, chunk_index, total_chunks, char_start, char_end,
                 title_thai, title_pali, pitaka, nikaya, vagga)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                chunk['id'],
                chunk['source_id'],
                chunk['content'],
                chunk['chunk_index'],
                chunk['total_chunks'],
                chunk.get('char_start', 0),
                chunk.get('char_end', 0),
                chunk.get('title_thai', ''),
                chunk.get('title_pali'),
                chunk.get('pitaka', ''),
                chunk.get('nikaya', ''),
                chunk.get('vagga')
            ))
            
            # Insert embedding if present
            if chunk.get('embedding'):
                if embedding_model is None:
                    embedding_model = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
                
                embedding_blob = embedding_to_blob(chunk['embedding'])
                dimensions = len(chunk['embedding'])
                
                cursor.execute("""
                    INSERT OR REPLACE INTO embeddings
                    (chunk_id, embedding, dimensions, model)
                    VALUES (?, ?, ?, ?)
                """, (chunk['id'], embedding_blob, dimensions, embedding_model))
        
        self.conn.commit()
        
        if embedding_model:
            self.set_metadata('embedding_model', embedding_model)
            self.set_metadata('embedding_dimensions', str(dimensions))
    
    def vacuum(self):
        """Optimize database"""
        print("Optimizing database...")
        self.conn.execute("VACUUM")
        self.conn.commit()
        
    def analyze(self):
        """Analyze database for query optimization"""
        print("Analyzing database...")
        self.conn.execute("ANALYZE")
        self.conn.commit()
        
    def close(self):
        """Close database connection"""
        self.conn.close()
        
    def get_stats(self) -> dict:
        """Get database statistics"""
        cursor = self.conn.cursor()
        
        stats = {}
        
        cursor.execute("SELECT COUNT(*) FROM suttas")
        stats['suttas_count'] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM chunks")
        stats['chunks_count'] = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM embeddings")
        stats['embeddings_count'] = cursor.fetchone()[0]
        
        cursor.execute("SELECT pitaka, COUNT(*) FROM suttas GROUP BY pitaka")
        stats['by_pitaka'] = dict(cursor.fetchall())
        
        cursor.execute("SELECT nikaya, COUNT(*) FROM suttas GROUP BY nikaya")
        stats['by_nikaya'] = dict(cursor.fetchall())
        
        return stats

# ============================================
# Main Processing
# ============================================

def build_database(
    chunks_file: Path,
    output_path: Path,
    metadata: Optional[dict] = None
):
    """Build SQLite database from processed chunks"""
    
    print(f"Building database: {output_path}")
    
    # Load chunks
    print(f"Loading chunks from {chunks_file}")
    with open(chunks_file, 'r', encoding='utf-8') as f:
        chunks = json.load(f)
    
    print(f"Loaded {len(chunks)} chunks")
    
    # Create database
    builder = DatabaseBuilder(output_path)
    builder.create_schema()
    
    # Set metadata
    builder.set_metadata('version', '1.0.0')
    builder.set_metadata('created_at', str(int(os.path.getmtime(chunks_file))))
    
    if metadata:
        for key, value in metadata.items():
            builder.set_metadata(key, value)
    
    # Insert data
    builder._insert_from_chunks(chunks)
    
    # Optimize
    builder.analyze()
    builder.vacuum()
    
    # Get stats
    stats = builder.get_stats()
    builder.close()
    
    print("\nDatabase Statistics:")
    for key, value in stats.items():
        if isinstance(value, dict):
            print(f"  {key}:")
            for k, v in value.items():
                print(f"    {k}: {v}")
        else:
            print(f"  {key}: {value}")
    
    # Print file size
    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"\nDatabase size: {size_mb:.2f} MB")
    
    return stats

# ============================================
# Entry Point
# ============================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Build SQLite database')
    parser.add_argument('--input', '-i', type=str,
                        default=str(INPUT_DIR / "tripitaka_chunks.json"),
                        help='Input chunks JSON file')
    parser.add_argument('--output', '-o', type=str,
                        default=str(OUTPUT_DIR / DB_NAME),
                        help='Output database file')
    args = parser.parse_args()
    
    build_database(
        chunks_file=Path(args.input),
        output_path=Path(args.output)
    )
