/**
 * Document Processor
 * Processes imported documents: chunking, embedding, and storing
 */

import { databaseService } from './DatabaseService';
import { ImportedDocument } from './DocumentImporter';
import { UserDocument, DocumentChunk, ImportProgress } from '@/types';

// ============================================
// Configuration
// ============================================

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const MIN_CHUNK_SIZE = 100;

// ============================================
// Document Processor Class
// ============================================

class DocumentProcessor {
  private isProcessing = false;
  private progressCallbacks: Map<string, (progress: ImportProgress) => void> = new Map();

  /**
   * Process imported document
   */
  async processDocument(
    document: ImportedDocument,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<UserDocument> {
    if (this.isProcessing) {
      throw new Error('Another document is being processed');
    }

    this.isProcessing = true;

    if (onProgress) {
      this.progressCallbacks.set(document.id, onProgress);
    }

    try {
      // 1. Create user document record
      const docId = await databaseService.addUserDocument({
        name: document.name,
        type: document.type,
        size: document.size,
        chunkCount: 0,
        status: 'processing',
      });

      // 2. Chunk the content
      this.reportProgress(docId, 'chunking', 10, 'แบ่งข้อความเป็นส่วนๆ...');
      const chunks = this.chunkText(document.content);

      // 3. Generate embeddings
      this.reportProgress(docId, 'embedding', 30, 'สร้าง vector embeddings...');
      const chunksWithEmbeddings = await this.generateEmbeddings(chunks);

      // 4. Store in database
      this.reportProgress(docId, 'storing', 70, 'บันทึกลงฐานข้อมูล...');
      await this.storeChunks(docId, chunksWithEmbeddings);

      // 5. Update document status
      this.reportProgress(docId, 'storing', 90, 'อัปเดตสถานะ...');
      
      // Mark as ready
      this.reportProgress(docId, 'storing', 100, 'เสร็จสิ้น');

      return {
        id: docId,
        name: document.name,
        type: document.type,
        size: document.size,
        chunkCount: chunks.length,
        createdAt: Date.now(),
        status: 'ready',
      };

    } catch (error) {
      console.error('[DocumentProcessor] Error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
      this.progressCallbacks.delete(document.id);
    }
  }

  /**
   * Chunk text into smaller pieces
   */
  private chunkText(text: string): Array<{ content: string; index: number }> {
    const chunks: Array<{ content: string; index: number }> = [];
    
    // Split by paragraphs first
    const paragraphs = text.split(/\n\n+/);
    
    let currentChunk = '';
    let chunkIndex = 0;

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length <= CHUNK_SIZE) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        // Save current chunk if it meets minimum size
        if (currentChunk.length >= MIN_CHUNK_SIZE) {
          chunks.push({ content: currentChunk.trim(), index: chunkIndex++ });
        }

        // If paragraph is too long, split by sentences
        if (paragraph.length > CHUNK_SIZE) {
          const sentences = this.splitIntoSentences(paragraph);
          let sentenceChunk = '';

          for (const sentence of sentences) {
            if (sentenceChunk.length + sentence.length <= CHUNK_SIZE) {
              sentenceChunk += (sentenceChunk ? ' ' : '') + sentence;
            } else {
              if (sentenceChunk.length >= MIN_CHUNK_SIZE) {
                chunks.push({ content: sentenceChunk.trim(), index: chunkIndex++ });
              }
              sentenceChunk = sentence;
            }
          }

          currentChunk = sentenceChunk;
        } else {
          currentChunk = paragraph;
        }
      }
    }

    // Don't forget the last chunk
    if (currentChunk.length >= MIN_CHUNK_SIZE) {
      chunks.push({ content: currentChunk.trim(), index: chunkIndex });
    }

    return chunks;
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Thai sentence endings
    return text
      .replace(/([。\.！!？?])\s*/g, '$1\n')
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Generate embeddings for chunks
   */
  private async generateEmbeddings(
    chunks: Array<{ content: string; index: number }>
  ): Promise<Array<{ content: string; index: number; embedding: number[] }>> {
    const results: Array<{ content: string; index: number; embedding: number[] }> = [];

    for (const chunk of chunks) {
      // Generate mock embedding
      // In production, would use actual embedding model
      const embedding = await this.generateEmbedding(chunk.content);
      results.push({ ...chunk, embedding });
    }

    return results;
  }

  /**
   * Generate embedding for a single text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Mock embedding generation
    // In production, would use sentence-transformers model via ExecuTorch
    
    const embedding: number[] = [];
    const hash = this.simpleHash(text);
    
    for (let i = 0; i < 384; i++) {
      embedding.push(Math.sin(hash + i * 0.1) * 0.5 + Math.random() * 0.5 - 0.25);
    }
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map(v => v / norm);
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * Store chunks in database
   */
  private async storeChunks(
    docId: string,
    chunks: Array<{ content: string; index: number; embedding: number[] }>
  ): Promise<void> {
    const totalChunks = chunks.length;

    for (const chunk of chunks) {
      await databaseService.addUserChunk(
        docId,
        chunk.content,
        chunk.index,
        totalChunks,
        chunk.embedding
      );
    }
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    documentId: string,
    stage: ImportProgress['stage'],
    progress: number,
    message: string
  ): void {
    const callback = this.progressCallbacks.get(documentId);
    if (callback) {
      callback({ documentId, stage, progress, message });
    }
  }

  /**
   * Delete processed document and its chunks
   */
  async deleteDocument(documentId: string): Promise<void> {
    await databaseService.deleteUserDocument(documentId);
  }

  /**
   * Check if processor is busy
   */
  isBusy(): boolean {
    return this.isProcessing;
  }
}

// Singleton instance
export const documentProcessor = new DocumentProcessor();
