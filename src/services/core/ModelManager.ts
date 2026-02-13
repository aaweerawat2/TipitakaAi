/**
 * Model Manager
 * Handles loading, caching, and management of AI models (LLM, ASR, TTS)
 */

import { Platform } from 'react-native';
import * as FileSystem from 'react-native-fs';
import { ModelInfo } from '@/types';

// ============================================
// Configuration
// ============================================

const MODELS_CONFIG: ModelInfo[] = [
  // LLM Models
  {
    id: 'llama-3.2-1b-thai',
    name: 'Llama 3.2 1B (Thai-ready)',
    type: 'llm',
    sizeMB: 600,
    ramRequiredMB: 800,
    path: 'models/llm/llama-3.2-1b-q4.pte',
    downloaded: false,
    loaded: false,
  },
  // ASR Models
  {
    id: 'whisper-small-thai',
    name: 'Whisper Small Thai',
    type: 'asr',
    sizeMB: 244,
    ramRequiredMB: 500,
    path: 'models/asr/whisper-small-thai.pte',
    downloaded: false,
    loaded: false,
  },
  {
    id: 'whisper-tiny-thai',
    name: 'Whisper Tiny Thai',
    type: 'asr',
    sizeMB: 39,
    ramRequiredMB: 150,
    path: 'models/asr/whisper-tiny-thai.pte',
    downloaded: false,
    loaded: false,
  },
  // TTS Models
  {
    id: 'vits-thai-female',
    name: 'VITS Thai Female',
    type: 'tts',
    sizeMB: 25,
    ramRequiredMB: 100,
    path: 'models/tts/vits-thai-female.pte',
    downloaded: false,
    loaded: false,
  },
  {
    id: 'vits-thai-male-monk',
    name: 'VITS Thai Male (Monk voice)',
    type: 'tts',
    sizeMB: 25,
    ramRequiredMB: 100,
    path: 'models/tts/vits-thai-male-monk.pte',
    downloaded: false,
    loaded: false,
  },
];

// ============================================
// Model Manager Class
// ============================================

class ModelManager {
  private models: Map<string, ModelInfo> = new Map();
  private loadedModels: Map<string, any> = new Map();
  private initialized = false;

  constructor() {
    // Initialize model registry
    MODELS_CONFIG.forEach((model) => {
      this.models.set(model.id, { ...model });
    });
  }

  /**
   * Initialize model manager and check available models
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Check which models are already downloaded
      for (const [id, model] of this.models) {
        const exists = await this.checkModelExists(model.path);
        model.downloaded = exists;
        this.models.set(id, model);
      }

      this.initialized = true;
      console.log('[ModelManager] Initialized');
      this.logModelStatus();
    } catch (error) {
      console.error('[ModelManager] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Check if model file exists
   */
  private async checkModelExists(relativePath: string): Promise<boolean> {
    const fullPath = await this.getModelFullPath(relativePath);
    return FileSystem.exists(fullPath);
  }

  /**
   * Get full path for model file
   */
  private async getModelFullPath(relativePath: string): Promise<string> {
    if (Platform.OS === 'android') {
      return `${FileSystem.DocumentDirectoryPath}/${relativePath}`;
    } else {
      return `${FileSystem.MainBundlePath}/${relativePath}`;
    }
  }

  /**
   * Get model info by ID
   */
  getModel(id: string): ModelInfo | undefined {
    return this.models.get(id);
  }

  /**
   * Get all models of a specific type
   */
  getModelsByType(type: 'llm' | 'asr' | 'tts'): ModelInfo[] {
    return Array.from(this.models.values()).filter((m) => m.type === type);
  }

  /**
   * Get all models
   */
  getAllModels(): ModelInfo[] {
    return Array.from(this.models.values());
  }

  /**
   * Download model from URL
   */
  async downloadModel(
    modelId: string,
    url: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    const targetPath = await this.getModelFullPath(model.path);
    
    // Ensure directory exists
    const dir = targetPath.substring(0, targetPath.lastIndexOf('/'));
    const dirExists = await FileSystem.exists(dir);
    if (!dirExists) {
      await FileSystem.mkdir(dir);
    }

    // Download with progress
    const downloadResult = await FileSystem.downloadFile({
      fromUrl: url,
      toFile: targetPath,
      progressDivider: 10,
      begin: () => console.log(`[ModelManager] Starting download: ${modelId}`),
      progress: (res) => {
        if (onProgress) {
          const progress = (res.bytesWritten / res.contentLength) * 100;
          onProgress(progress);
        }
      },
    }).promise;

    if (downloadResult.statusCode === 200) {
      model.downloaded = true;
      this.models.set(modelId, model);
      console.log(`[ModelManager] Downloaded: ${modelId}`);
    } else {
      throw new Error(`Download failed with status ${downloadResult.statusCode}`);
    }
  }

  /**
   * Delete model from storage
   */
  async deleteModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    // Unload if loaded
    if (model.loaded) {
      await this.unloadModel(modelId);
    }

    // Delete file
    const fullPath = await this.getModelFullPath(model.path);
    const exists = await FileSystem.exists(fullPath);
    
    if (exists) {
      await FileSystem.unlink(fullPath);
    }

    model.downloaded = false;
    this.models.set(modelId, model);
    console.log(`[ModelManager] Deleted: ${modelId}`);
  }

  /**
   * Load model into memory
   */
  async loadModel(modelId: string): Promise<any> {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);
    if (!model.downloaded) throw new Error(`Model ${modelId} not downloaded`);

    // Check if already loaded
    if (model.loaded && this.loadedModels.has(modelId)) {
      return this.loadedModels.get(modelId);
    }

    // Check available memory
    await this.ensureMemoryAvailable(model.ramRequiredMB);

    // Load model (actual loading handled by specific service)
    // This is a placeholder - actual loading is done by ExecuTorchService
    model.loaded = true;
    this.models.set(modelId, model);
    
    console.log(`[ModelManager] Loaded: ${modelId}`);
    return null; // Actual model returned by specific service
  }

  /**
   * Unload model from memory
   */
  async unloadModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId);
    if (!model) return;

    // Actual unloading handled by specific service
    this.loadedModels.delete(modelId);
    model.loaded = false;
    this.models.set(modelId, model);
    
    console.log(`[ModelManager] Unloaded: ${modelId}`);
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(modelId: string): boolean {
    const model = this.models.get(modelId);
    return model?.loaded || false;
  }

  /**
   * Check if model is downloaded
   */
  isModelDownloaded(modelId: string): boolean {
    const model = this.models.get(modelId);
    return model?.downloaded || false;
  }

  /**
   * Get total storage used by downloaded models
   */
  async getTotalStorageUsed(): Promise<number> {
    let total = 0;
    for (const model of this.models.values()) {
      if (model.downloaded) {
        total += model.sizeMB;
      }
    }
    return total;
  }

  /**
   * Get required RAM for loaded models
   */
  getLoadedModelsRAM(): number {
    let total = 0;
    for (const model of this.models.values()) {
      if (model.loaded) {
        total += model.ramRequiredMB;
      }
    }
    return total;
  }

  /**
   * Ensure enough memory is available
   */
  private async ensureMemoryAvailable(requiredMB: number): Promise<void> {
    // This would use native module to check available memory
    // For now, we'll just check loaded models
    const currentlyUsed = this.getLoadedModelsRAM();
    
    // Assume 4GB max for mobile devices
    const maxRAM = 4096;
    const available = maxRAM - currentlyUsed;
    
    if (available < requiredMB) {
      // Need to evict some models
      await this.evictModels(requiredMB - available);
    }
  }

  /**
   * Evict models to free up memory
   */
  private async evictModels(requiredMB: number): Promise<void> {
    let freed = 0;
    
    // Evict least recently used models (simplified - just unload in order)
    for (const [id, model] of this.models) {
      if (freed >= requiredMB) break;
      if (model.loaded && model.type !== 'llm') { // Keep LLM loaded if possible
        await this.unloadModel(id);
        freed += model.ramRequiredMB;
      }
    }
  }

  /**
   * Log model status for debugging
   */
  private logModelStatus(): void {
    console.log('[ModelManager] Model Status:');
    for (const model of this.models.values()) {
      console.log(
        `  ${model.id}: downloaded=${model.downloaded}, loaded=${model.loaded}`
      );
    }
  }
}

// Singleton instance
export const modelManager = new ModelManager();
