/**
 * RAG Engine
 * Retrieval-Augmented Generation for question answering with citations
 */

import { databaseService } from '../core/DatabaseService';
import { execuTorchService } from './ExecuTorchService';
import { 
  RAGQuery, 
  RAGResponse, 
  Citation, 
  VectorSearchResult,
  QueryFilters 
} from '@/types';

// ============================================
// Configuration
// ============================================

const DEFAULT_TOP_K = 5;
const DEFAULT_THRESHOLD = 0.6;
const MAX_CONTEXT_TOKENS = 2048;

// System prompt for RAG
const RAG_SYSTEM_PROMPT = `คุณเป็นผู้ช่วยที่เชี่ยวชาญด้านพระพุทธศาสนา 
คุณมีหน้าที่ตอบคำถามโดยอ้างอิงจากพระไตรปิฎกและคำสอนของพระพุทธเจ้า

กฎสำคัญ:
1. ตอบคำถามโดยใช้ข้อมูลจากพระสูตรที่ให้มาเท่านั้น
2. อ้างอิงชื่อพระสูตรเมื่อข้อความสำคัญ
3. หากข้อมูลไม่เพียงพอ ให้บอกว่าไม่พบข้อมูลในพระไตรปิฎก
4. ใช้ภาษาที่สุภาพและเหมาะสมกับธรรมะ
5. หลีกเลี่ยงการตีความส่วนตัว ให้อ้างอิงพระธรรมวจนะ`;

// ============================================
// RAG Engine Class
// ============================================

class RAGEngine {
  private initialized = false;
  private embeddingModel: any = null;

  /**
   * Initialize RAG engine
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Initialize database
      await databaseService.initialize();
      
      // Initialize LLM
      await execuTorchService.initialize();

      this.initialized = true;
      console.log('[RAGEngine] Initialized');
    } catch (error) {
      console.error('[RAGEngine] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Query the RAG system
   */
  async query(query: RAGQuery): Promise<RAGResponse> {
    if (!this.initialized) {
      throw new Error('RAG Engine not initialized');
    }

    const startTime = Date.now();

    try {
      // 1. Generate embedding for query
      const queryEmbedding = await this.getQueryEmbedding(query.question);

      // 2. Retrieve relevant chunks
      const searchResults = await this.retrieveChunks(
        queryEmbedding,
        query.topK || DEFAULT_TOP_K,
        query.threshold || DEFAULT_THRESHOLD,
        query.filters
      );

      // 3. Build context from retrieved chunks
      const context = this.buildContext(searchResults);

      // 4. Generate answer using LLM
      const answer = await this.generateAnswer(query.question, context);

      // 5. Build citations
      const sources = this.buildCitations(searchResults);

      const endTime = Date.now();

      return {
        answer,
        sources,
        confidence: this.calculateConfidence(searchResults),
        processingTime: endTime - startTime,
      };
    } catch (error) {
      console.error('[RAGEngine] Query error:', error);
      throw error;
    }
  }

  /**
   * Get embedding for query text
   * In production, this would use a sentence transformer model
   */
  private async getQueryEmbedding(text: string): Promise<number[]> {
    // Mock embedding - in production, use actual embedding model
    // This would be loaded from a .pte model via ExecuTorch
    
    // Generate pseudo-random embedding for development
    const embedding: number[] = [];
    const hash = this.simpleHash(text);
    
    for (let i = 0; i < 384; i++) {
      // Generate values between -1 and 1
      embedding.push(Math.sin(hash + i * 0.1) * 0.5 + Math.random() * 0.5 - 0.25);
    }
    
    // Normalize
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map(v => v / norm);
  }

  /**
   * Simple hash function for consistent mock embeddings
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
   * Retrieve relevant chunks from database
   */
  private async retrieveChunks(
    queryEmbedding: number[],
    topK: number,
    threshold: number,
    filters?: QueryFilters
  ): Promise<VectorSearchResult[]> {
    // Get chunks from database with vector search
    let results = await databaseService.vectorSearch(
      queryEmbedding,
      topK * 2, // Get more for filtering
      threshold
    );

    // Apply filters if provided
    if (filters) {
      if (filters.pitaka && filters.pitaka.length > 0) {
        results = results.filter((r) =>
          filters.pitaka!.includes(r.metadata.pitaka as any)
        );
      }
      
      if (filters.nikaya && filters.nikaya.length > 0) {
        results = results.filter((r) =>
          filters.nikaya!.includes(r.metadata.nikaya)
        );
      }
    }

    return results.slice(0, topK);
  }

  /**
   * Build context string from search results
   */
  private buildContext(results: VectorSearchResult[]): string {
    const contexts: string[] = [];
    let currentTokens = 0;

    for (const result of results) {
      const chunk = `[${result.metadata.title_thai}]\n${result.content}\n`;
      const tokens = this.estimateTokens(chunk);

      if (currentTokens + tokens > MAX_CONTEXT_TOKENS) {
        break;
      }

      contexts.push(chunk);
      currentTokens += tokens;
    }

    return contexts.join('\n---\n');
  }

  /**
   * Generate answer using LLM
   */
  private async generateAnswer(
    question: string,
    context: string
  ): Promise<string> {
    const prompt = `${RAG_SYSTEM_PROMPT}

ข้อมูลจากพระไตรปิฎก:
${context}

คำถาม: ${question}

คำตอบ:`;

    const response = await execuTorchService.generate(prompt, {
      maxTokens: 512,
      temperature: 0.7,
    });

    return response.text;
  }

  /**
   * Build citations from search results
   */
  private buildCitations(results: VectorSearchResult[]): Citation[] {
    return results.map((result) => ({
      suttaId: result.metadata.id,
      title: result.metadata.title_thai,
      content: result.content.substring(0, 200) + '...',
      relevance: result.score,
    }));
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(results: VectorSearchResult[]): number {
    if (results.length === 0) return 0;

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    const countFactor = Math.min(results.length / DEFAULT_TOP_K, 1);
    
    return avgScore * countFactor;
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    const thaiChars = text.replace(/[^\u0E00-\u0E7F]/g, '').length;
    const otherChars = text.length - thaiChars;
    return Math.ceil(thaiChars / 2 + otherChars / 4);
  }

  /**
   * Add user document to knowledge base
   */
  async addUserContent(
    documentId: string,
    chunks: Array<{ content: string; embedding: number[] }>
  ): Promise<void> {
    for (let i = 0; i < chunks.length; i++) {
      await databaseService.addUserChunk(
        documentId,
        chunks[i].content,
        i,
        chunks.length,
        chunks[i].embedding
      );
    }
  }

  /**
   * Check if engine is ready
   */
  isReady(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const ragEngine = new RAGEngine();
