#!/usr/bin/env python3
"""
Script 2: Chunking and Embedding
Split texts into chunks and generate vector embeddings
"""

import os
import json
import re
from pathlib import Path
from typing import List, Optional
from dataclasses import dataclass, asdict
from tqdm import tqdm
import argparse

# NLP imports
try:
    from sentence_transformers import SentenceTransformer
    import numpy as np
except ImportError:
    print("Please install: pip install sentence-transformers numpy")
    raise

# ============================================
# Configuration
# ============================================

INPUT_DIR = Path(__file__).parent.parent / "assets" / "database" / "raw"
OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "database" / "processed"

# Embedding model - multilingual for Thai support
EMBEDDING_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
# Alternative Thai-specific models:
# - "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
# - "kornwtp/ConGen-simcse-model-thai-prompt"

# Chunking parameters
CHUNK_SIZE = 500  # Target characters per chunk
CHUNK_OVERLAP = 50  # Character overlap between chunks
MIN_CHUNK_SIZE = 100  # Minimum chunk size

# ============================================
# Data Classes
# ============================================

@dataclass
class TextChunk:
    id: str
    source_id: str
    content: str
    chunk_index: int
    total_chunks: int
    char_start: int
    char_end: int
    embedding: Optional[List[float]] = None
    
    # Metadata
    title_thai: str = ""
    title_pali: str = ""
    pitaka: str = ""
    nikaya: str = ""
    vagga: Optional[str] = None

# ============================================
# Text Processing
# ============================================

def split_into_sentences_thai(text: str) -> List[str]:
    """Split Thai text into sentences"""
    # Thai sentence endings
    sentence_endings = ['။', '။', '\n\n', '\n']
    
    # Also split on common patterns
    patterns = [
        r'([。\.！!？?])\s*',  # Punctuation + space
        r'([।।])\s*',  # Thai/Indic punctuation
        r'(\n\n+)',  # Double newlines
    ]
    
    sentences = [text]
    for pattern in patterns:
        new_sentences = []
        for s in sentences:
            parts = re.split(pattern, s)
            # Combine delimiter with preceding text
            for i in range(0, len(parts) - 1, 2):
                if i + 1 < len(parts):
                    new_sentences.append(parts[i] + parts[i + 1])
                else:
                    new_sentences.append(parts[i])
            if len(parts) % 2 == 1 and parts[-1].strip():
                new_sentences.append(parts[-1])
        sentences = [s for s in new_sentences if s.strip()]
    
    return [s.strip() for s in sentences if s.strip()]

def create_chunks(
    text: str,
    source_id: str,
    metadata: dict,
    chunk_size: int = CHUNK_SIZE,
    overlap: int = CHUNK_OVERLAP,
    min_size: int = MIN_CHUNK_SIZE
) -> List[TextChunk]:
    """Create text chunks with overlap"""
    
    if not text or len(text) < min_size:
        return []
    
    sentences = split_into_sentences_thai(text)
    
    chunks = []
    current_chunk = ""
    current_start = 0
    char_pos = 0
    chunk_index = 0
    
    for sentence in sentences:
        sentence_len = len(sentence)
        
        if len(current_chunk) + sentence_len <= chunk_size:
            current_chunk += " " + sentence if current_chunk else sentence
        else:
            # Save current chunk if it meets minimum size
            if len(current_chunk.strip()) >= min_size:
                chunk = TextChunk(
                    id=f"{source_id}_chunk_{chunk_index}",
                    source_id=source_id,
                    content=current_chunk.strip(),
                    chunk_index=chunk_index,
                    total_chunks=0,  # Will update later
                    char_start=current_start,
                    char_end=char_pos,
                    **metadata
                )
                chunks.append(chunk)
                chunk_index += 1
            
            # Start new chunk with overlap
            if overlap > 0 and current_chunk:
                # Take last part of previous chunk
                overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                current_chunk = overlap_text + " " + sentence
                current_start = char_pos - len(overlap_text)
            else:
                current_chunk = sentence
                current_start = char_pos
        
        char_pos += sentence_len + 1  # +1 for space/newline
    
    # Don't forget the last chunk
    if len(current_chunk.strip()) >= min_size:
        chunk = TextChunk(
            id=f"{source_id}_chunk_{chunk_index}",
            source_id=source_id,
            content=current_chunk.strip(),
            chunk_index=chunk_index,
            total_chunks=0,
            char_start=current_start,
            char_end=char_pos,
            **metadata
        )
        chunks.append(chunk)
    
    # Update total_chunks
    total = len(chunks)
    for chunk in chunks:
        chunk.total_chunks = total
    
    return chunks

# ============================================
# Embedding Generation
# ============================================

class EmbeddingGenerator:
    def __init__(self, model_name: str = EMBEDDING_MODEL):
        print(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        print(f"Embedding dimension: {self.embedding_dim}")
    
    def generate_embeddings(self, texts: List[str], batch_size: int = 32) -> List[List[float]]:
        """Generate embeddings for a list of texts"""
        print(f"Generating embeddings for {len(texts)} texts...")
        
        embeddings = []
        for i in tqdm(range(0, len(texts), batch_size), desc="Embedding"):
            batch = texts[i:i + batch_size]
            batch_embeddings = self.model.encode(batch, convert_to_numpy=True)
            embeddings.extend(batch_embeddings.tolist())
        
        return embeddings

# ============================================
# Main Processing
# ============================================

def process_suttas(input_file: Path, output_dir: Path, generate_embeddings: bool = True):
    """Process extracted suttas: chunk and embed"""
    
    # Load extracted data
    print(f"Loading data from {input_file}")
    with open(input_file, 'r', encoding='utf-8') as f:
        suttas = json.load(f)
    
    print(f"Loaded {len(suttas)} suttas")
    
    # Initialize embedding model
    embedder = None
    if generate_embeddings:
        embedder = EmbeddingGenerator()
    
    # Process each sutta
    all_chunks = []
    
    for sutta in tqdm(suttas, desc="Chunking"):
        metadata = {
            'title_thai': sutta.get('title_thai', ''),
            'title_pali': sutta.get('title_pali', ''),
            'pitaka': sutta.get('pitaka', ''),
            'nikaya': sutta.get('nikaya', ''),
            'vagga': sutta.get('vagga'),
        }
        
        chunks = create_chunks(
            text=sutta.get('content_thai', ''),
            source_id=sutta['id'],
            metadata=metadata
        )
        
        all_chunks.extend(chunks)
    
    print(f"Created {len(all_chunks)} chunks")
    
    # Generate embeddings
    if embedder:
        texts = [c.content for c in all_chunks]
        embeddings = embedder.generate_embeddings(texts)
        
        for chunk, embedding in zip(all_chunks, embeddings):
            chunk.embedding = embedding
    
    # Save processed chunks
    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / "tripitaka_chunks.json"
    
    # Convert to dict for JSON serialization
    chunks_data = [asdict(c) for c in all_chunks]
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(chunks_data, f, ensure_ascii=False, indent=2)
    
    print(f"Saved {len(chunks_data)} chunks to {output_file}")
    
    # Print statistics
    print("\nStatistics:")
    print(f"  Total suttas: {len(suttas)}")
    print(f"  Total chunks: {len(all_chunks)}")
    print(f"  Average chunks per sutta: {len(all_chunks) / len(suttas):.1f}")
    
    # Chunk size distribution
    sizes = [len(c.content) for c in all_chunks]
    print(f"  Chunk size - Min: {min(sizes)}, Max: {max(sizes)}, Avg: {sum(sizes)/len(sizes):.0f}")
    
    if embedder:
        print(f"  Embedding dimension: {embedder.embedding_dim}")
    
    return all_chunks

# ============================================
# Entry Point
# ============================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Chunk and embed Tripitaka data')
    parser.add_argument('--input', '-i', type=str, 
                        default=str(INPUT_DIR / "tripitaka_extracted.json"),
                        help='Input JSON file')
    parser.add_argument('--output', '-o', type=str, default=str(OUTPUT_DIR),
                        help='Output directory')
    parser.add_argument('--no-embed', action='store_true',
                        help='Skip embedding generation')
    args = parser.parse_args()
    
    process_suttas(
        input_file=Path(args.input),
        output_dir=Path(args.output),
        generate_embeddings=not args.no_embed
    )
