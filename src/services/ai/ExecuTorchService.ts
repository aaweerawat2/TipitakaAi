/**
 * ExecuTorch Service
 * Handles LLM inference using Meta's ExecuTorch framework
 */

import { NativeModules, Platform } from 'react-native';
import { LLMConfig, LLMResponse, Citation } from '@/types';
import { modelManager } from './ModelManager';

// ============================================
// Native Module Interface
// ============================================

interface ExecuTorchNativeInterface {
  loadModel(modelPath: string, tokenizerPath: string): Promise<boolean>;
  generate(prompt: string, maxTokens: number, temperature: number): Promise<string>;
  generateStream(prompt: string, maxTokens: number, temperature: number): Promise<void>;
  unloadModel(): Promise<boolean>;
  isModelLoaded(): Promise<boolean>;
}

// Link to native module
const { ExecuTorchModule } = NativeModules;

// ============================================
// ExecuTorch Service Class
// ============================================

class ExecuTorchService {
  private modelPath: string | null = null;
  private tokenizerPath: string | null = null;
  private isLoaded = false;
  private config: LLMConfig | null = null;

  // Default configuration
  private defaultConfig: LLMConfig = {
    modelPath: 'models/llm/llama-3.2-1b-q4.pte',
    tokenizerPath: 'models/tokenizer.model',
    maxTokens: 512,
    temperature: 0.7,
    topP: 0.9,
    delegate: Platform.OS === 'android' ? 'qnn' : 'xnnpack',
  };

  /**
   * Initialize LLM with configuration
   */
  async initialize(config?: Partial<LLMConfig>): Promise<boolean> {
    if (this.isLoaded) {
      await this.unload();
    }

    this.config = { ...this.defaultConfig, ...config };

    try {
      // Check if model is downloaded
      const modelId = 'llama-3.2-1b-thai';
      if (!modelManager.isModelDownloaded(modelId)) {
        throw new Error('LLM model not downloaded. Please download the model first.');
      }

      // Load model via native module
      const modelPath = await this.getAssetPath(this.config.modelPath);
      const tokenizerPath = await this.getAssetPath(this.config.tokenizerPath);

      if (ExecuTorchModule) {
        this.isLoaded = await ExecuTorchModule.loadModel(modelPath, tokenizerPath);
      } else {
        // Fallback for development/testing without native module
        console.warn('[ExecuTorchService] Native module not available, using mock');
        this.isLoaded = true;
      }

      if (this.isLoaded) {
        console.log('[ExecuTorchService] Model loaded successfully');
        await modelManager.loadModel(modelId);
      }

      return this.isLoaded;
    } catch (error) {
      console.error('[ExecuTorchService] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Get full asset path
   */
  private async getAssetPath(relativePath: string): Promise<string> {
    // In React Native, assets are bundled differently on each platform
    if (Platform.OS === 'android') {
      return `file:///android_asset/${relativePath}`;
    } else {
      return `${NSBundle.mainBundle.bundlePath}/${relativePath}`;
    }
  }

  /**
   * Generate text from prompt
   */
  async generate(prompt: string, options?: Partial<LLMConfig>): Promise<LLMResponse> {
    if (!this.isLoaded || !this.config) {
      throw new Error('Model not initialized');
    }

    const config = { ...this.config, ...options };
    const startTime = Date.now();

    try {
      let response: string;

      if (ExecuTorchModule) {
        response = await ExecuTorchModule.generate(
          prompt,
          config.maxTokens,
          config.temperature
        );
      } else {
        // Mock response for development
        response = await this.mockGenerate(prompt);
      }

      const endTime = Date.now();

      return {
        text: response,
        tokens: this.estimateTokens(response),
        time_ms: endTime - startTime,
      };
    } catch (error) {
      console.error('[ExecuTorchService] Generation error:', error);
      throw error;
    }
  }

  /**
   * Generate text with streaming
   */
  async *generateStream(
    prompt: string,
    options?: Partial<LLMConfig>
  ): AsyncGenerator<string> {
    if (!this.isLoaded || !this.config) {
      throw new Error('Model not initialized');
    }

    const config = { ...this.config, ...options };

    // For now, generate all at once and yield character by character
    // Real implementation would use native streaming
    const response = await this.generate(prompt, options);
    
    // Simulate streaming
    const words = response.text.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i < words.length - 1 ? ' ' : '');
      await new Promise((r) => setTimeout(r, 20));
    }
  }

  /**
   * Unload model from memory
   */
  async unload(): Promise<void> {
    if (this.isLoaded && ExecuTorchModule) {
      await ExecuTorchModule.unloadModel();
    }
    
    this.isLoaded = false;
    console.log('[ExecuTorchService] Model unloaded');
  }

  /**
   * Check if model is loaded
   */
  isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for Thai
    // This is a simplified calculation
    const thaiChars = text.replace(/[^\u0E00-\u0E7F]/g, '').length;
    const otherChars = text.length - thaiChars;
    
    return Math.ceil(thaiChars / 2 + otherChars / 4);
  }

  /**
   * Mock generation for development
   */
  private async mockGenerate(prompt: string): Promise<string> {
    await new Promise((r) => setTimeout(r, 500));
    
    // Return mock response based on prompt keywords
    if (prompt.includes('ประมาท')) {
      return 'ความไม่ประมาท คือ การมีสติอยู่เสมอ ไม่ปล่อยใจให้ฟุ้งซ่าน ' +
        'พระพุทธเจ้าตรัสว่า "ความไม่ประมาทเป็นทางแห่งอมตะ ความประมาทเป็นทางแห่งมัจจุ" (ธรรมบท ๒๑)';
    }
    
    return 'ขออภัย ผมยังไม่สามารถตอบคำถามนี้ได้อย่างแม่นยำ ' +
      'กรุณาลองถามคำถามที่เกี่ยวข้องกับพระธรรมอีกครั้ง';
  }
}

// Singleton instance
export const execuTorchService = new ExecuTorchService();
