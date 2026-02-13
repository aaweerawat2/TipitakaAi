/**
 * Database Service
 * Manages SQLite database with FTS5 full-text search and vector similarity search
 */

import { Platform } from 'react-native';
import { open, Database } from '@op-engineering/op-sqlite';
import * as FileSystem from 'react-native-fs';
import {
  SuttaMeta,
  SuttaContent,
  SearchResult,
  VectorSearchResult,
  DocumentChunk,
  UserDocument,
} from '@/types';

// ============================================
// Configuration
// ============================================

const DB_NAME = 'tripitaka_v1.sqlite';
const ASSET_PATH = 'assets/database/tripitaka_v1.sqlite';

// ============================================
// Database Service Class
// ============================================

class DatabaseService {
  private db: Database | null = null;
  private initialized = false;

  /**
   * Initialize database - copy from assets if needed
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const dbPath = await this.getDatabasePath();
      
      // Check if database exists, if not copy from assets
      const exists = await FileSystem.exists(dbPath);
      
      if (!exists) {
        await this.copyDatabaseFromAssets(dbPath);
      }

      // Open database
      this.db = open({ name: DB_NAME, location: dbPath });
      
      // Verify database integrity
      await this.verifyDatabase();
      
      this.initialized = true;
      console.log('[DatabaseService] Initialized successfully');
    } catch (error) {
      console.error('[DatabaseService] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Get database file path based on platform
   */
  private async getDatabasePath(): Promise<string> {
    if (Platform.OS === 'android') {
      return `${FileSystem.DocumentDirectoryPath}/${DB_NAME}`;
    } else {
      return `${FileSystem.MainBundlePath}/${DB_NAME}`;
    }
  }

  /**
   * Copy database from assets to device storage
   */
  private async copyDatabaseFromAssets(targetPath: string): Promise<void> {
    // For React Native, we need to copy from bundled assets
    // This is handled differently on Android vs iOS
    
    const sourcePath = Platform.select({
      android: `${FileSystem.DocumentDirectoryPath}/../assets/${DB_NAME}`,
      ios: `${FileSystem.MainBundlePath}/${DB_NAME}`,
    });

    if (sourcePath) {
      const exists = await FileSystem.exists(sourcePath);
      if (exists) {
        await FileSystem.copyFile(sourcePath, targetPath);
        console.log('[DatabaseService] Copied database from assets');
      } else {
        throw new Error(`Database asset not found at ${sourcePath}`);
      }
    }
  }

  /**
   * Verify database is valid and has correct schema
   */
  private async verifyDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not open');

    const result = this.db.execute('SELECT name FROM sqlite_master WHERE type="table"');
    const tables = result.rows?._array?.map((r: any) => r.name) || [];
    
    const requiredTables = ['suttas', 'chunks', 'embeddings', 'metadata'];
    const missingTables = requiredTables.filter(t => !tables.includes(t));
    
    if (missingTables.length > 0) {
      throw new Error(`Missing required tables: ${missingTables.join(', ')}`);
    }
  }

  // ============================================
  // Sutta Operations
  // ============================================

  /**
   * Get all nikayas (collections)
   */
  async getNikayas(): Promise<string[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.execute(
      'SELECT DISTINCT nikaya FROM suttas ORDER BY nikaya'
    );
    
    return result.rows?._array?.map((r: any) => r.nikaya) || [];
  }

  /**
   * Get suttas by nikaya
   */
  async getSuttasByNikaya(nikaya: string, limit = 100, offset = 0): Promise<SuttaMeta[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.execute(
      `SELECT id, sutta_id, title_thai, title_pali, pitaka, nikaya, vagga
       FROM suttas 
       WHERE nikaya = ? 
       ORDER BY sutta_id
       LIMIT ? OFFSET ?`,
      [nikaya, limit, offset]
    );

    return result.rows?._array || [];
  }

  /**
   * Get sutta content by ID
   */
  async getSuttaById(id: string): Promise<SuttaContent | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.execute(
      `SELECT * FROM suttas WHERE id = ?`,
      [id]
    );

    const row = result.rows?._array?.[0];
    if (!row) return null;

    return {
      ...row,
      content_thai: row.content_thai || '',
      content_pali: row.content_pali || null,
    };
  }

  /**
   * Full-text search using FTS5
   */
  async search(query: string, limit = 20): Promise<SearchResult[]> {
    if (!this.db) throw new Error('Database not initialized');

    // Use FTS5 for full-text search
    const result = this.db.execute(
      `SELECT 
        s.id, s.title_thai, s.title_pali, s.pitaka, s.nikaya,
        snippet(suttas_fts, 1, '【', '】', '...', 20) as highlight,
        bm25(suttas_fts) as score
       FROM suttas_fts
       JOIN suttas s ON s.id = suttas_fts.id
       WHERE suttas_fts MATCH ?
       ORDER BY score
       LIMIT ?`,
      [query, limit]
    );

    return (result.rows?._array || []).map((row: any) => ({
      id: row.id,
      title: row.title_thai,
      content: row.highlight || '',
      score: Math.abs(row.score),
      highlight: row.highlight,
      metadata: {
        id: row.id,
        sutta_id: row.id,
        title_thai: row.title_thai,
        title_pali: row.title_pali,
        pitaka: row.pitaka,
        nikaya: row.nikaya,
      },
    }));
  }

  // ============================================
  // Vector Search Operations
  // ============================================

  /**
   * Get chunks with embeddings for a query
   * Note: For production, use sqlite-vec or similar for true vector search
   */
  async vectorSearch(
    queryEmbedding: number[],
    limit = 10,
    threshold = 0.7
  ): Promise<VectorSearchResult[]> {
    if (!this.db) throw new Error('Database not initialized');

    // Get all embeddings (for small dataset)
    // For production, use approximate nearest neighbor index
    const result = this.db.execute(
      `SELECT 
        c.id, c.source_id, c.content, c.chunk_index, c.total_chunks,
        c.title_thai, c.title_pali, c.pitaka, c.nikaya,
        e.embedding, e.dimensions
       FROM chunks c
       JOIN embeddings e ON c.id = e.chunk_id`
    );

    const chunks = result.rows?._array || [];
    
    // Calculate cosine similarity
    const results: VectorSearchResult[] = chunks
      .map((row: any) => {
        const embedding = this.blobToVector(row.embedding, row.dimensions);
        const distance = this.cosineDistance(queryEmbedding, embedding);
        
        return {
          id: row.id,
          title: row.title_thai,
          content: row.content,
          score: 1 - distance,
          distance,
          metadata: {
            id: row.source_id,
            sutta_id: row.source_id,
            title_thai: row.title_thai,
            title_pali: row.title_pali,
            pitaka: row.pitaka,
            nikaya: row.nikaya,
          },
        };
      })
      .filter((r) => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }

  /**
   * Get chunk by ID
   */
  async getChunkById(id: string): Promise<DocumentChunk | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.execute(
      `SELECT c.*, e.embedding, e.dimensions
       FROM chunks c
       LEFT JOIN embeddings e ON c.id = e.chunk_id
       WHERE c.id = ?`,
      [id]
    );

    const row = result.rows?._array?.[0];
    if (!row) return null;

    return {
      id: row.id,
      content: row.content,
      embedding: row.embedding 
        ? this.blobToVector(row.embedding, row.dimensions)
        : undefined,
      metadata: {
        source: 'tripitaka',
        chunkIndex: row.chunk_index,
        totalChunks: row.total_chunks,
        createdAt: Date.now(),
      },
    };
  }

  // ============================================
  // User Document Operations
  // ============================================

  /**
   * Add user document
   */
  async addUserDocument(doc: Omit<UserDocument, 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `user-doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const createdAt = Date.now();

    this.db.execute(
      `INSERT INTO user_documents (id, name, type, size, chunk_count, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, doc.name, doc.type, doc.size, doc.chunkCount, doc.status, createdAt]
    );

    return id;
  }

  /**
   * Get all user documents
   */
  async getUserDocuments(): Promise<UserDocument[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = this.db.execute(
      `SELECT * FROM user_documents ORDER BY created_at DESC`
    );

    return (result.rows?._array || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      size: row.size,
      chunkCount: row.chunk_count,
      createdAt: row.created_at,
      processedAt: row.processed_at,
      status: row.status,
      error: row.error,
    }));
  }

  /**
   * Delete user document and its chunks
   */
  async deleteUserDocument(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Delete embeddings
    this.db.execute(
      `DELETE FROM user_embeddings WHERE chunk_id IN 
       (SELECT id FROM user_chunks WHERE document_id = ?)`,
      [id]
    );

    // Delete chunks
    this.db.execute(`DELETE FROM user_chunks WHERE document_id = ?`, [id]);

    // Delete document
    this.db.execute(`DELETE FROM user_documents WHERE id = ?`, [id]);
  }

  /**
   * Add user chunk with embedding
   */
  async addUserChunk(
    documentId: string,
    content: string,
    chunkIndex: number,
    totalChunks: number,
    embedding: number[]
  ): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `user-chunk-${documentId}-${chunkIndex}`;
    const embeddingBlob = this.vectorToBlob(embedding);

    this.db.execute(
      `INSERT INTO user_chunks (id, document_id, content, chunk_index, total_chunks, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, documentId, content, chunkIndex, totalChunks, Date.now()]
    );

    this.db.execute(
      `INSERT INTO user_embeddings (chunk_id, embedding, dimensions, model, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      [id, embeddingBlob, embedding.length, 'sentence-transformers', Date.now()]
    );

    return id;
  }

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Convert binary blob to number vector
   */
  private blobToVector(blob: Uint8Array, dimensions: number): number[] {
    const view = new Float32Array(blob.buffer || blob);
    return Array.from(view);
  }

  /**
   * Convert number vector to binary blob
   */
  private vectorToBlob(vector: number[]): Uint8Array {
    const float32 = new Float32Array(vector);
    return new Uint8Array(float32.buffer);
  }

  /**
   * Calculate cosine distance between two vectors
   */
  private cosineDistance(a: number[], b: number[]): number {
    if (a.length !== b.length) return 1;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    return 1 - similarity;
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{
    suttasCount: number;
    chunksCount: number;
    embeddingsCount: number;
    userDocumentsCount: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const suttas = this.db.execute('SELECT COUNT(*) as count FROM suttas');
    const chunks = this.db.execute('SELECT COUNT(*) as count FROM chunks');
    const embeddings = this.db.execute('SELECT COUNT(*) as count FROM embeddings');
    const userDocs = this.db.execute('SELECT COUNT(*) as count FROM user_documents');

    return {
      suttasCount: suttas.rows?._array?.[0]?.count || 0,
      chunksCount: chunks.rows?._array?.[0]?.count || 0,
      embeddingsCount: embeddings.rows?._array?.[0]?.count || 0,
      userDocumentsCount: userDocs.rows?._array?.[0]?.count || 0,
    };
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

// Singleton instance
export const databaseService = new DatabaseService();
