/**
 * Model Download Service
 * ดาวน์โหลด AI models แยกจาก APK
 */

import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

// Model URLs - hosted on GitHub Releases
const MODEL_URLS = {
  llm: {
    name: 'Llama 3.2 1B (Thai)',
    url: 'https://github.com/aaweerawat19/TipitakaAi/releases/download/models/llama-3.2-1b-thai-qnn.zip',
    size: 620, // MB
    required: true,
    type: 'llm',
    file: 'llama-3.2-1b-thai.pte',
  },
  asr: {
    name: 'Whisper Thai (ASR)',
    url: 'https://github.com/aaweerawat19/TipitakaAi/releases/download/models/whisper-thai-small-qnn.zip',
    size: 244, // MB
    required: true,
    type: 'asr',
    file: 'whisper-thai-small.bin',
  },
  tts: {
    name: 'Thai TTS (VITS)',
    url: 'https://github.com/aaweerawat19/TipitakaAi/releases/download/models/thai-tts-vits.zip',
    size: 50, // MB
    required: false,
    type: 'tts',
    file: 'thai-tts.onnx',
  },
  qnn: {
    name: 'QNN Runtime',
    url: 'https://github.com/aaweerawat19/TipitakaAi/releases/download/models/qnn-runtime.zip',
    size: 30, // MB
    required: true,
    type: 'qnn',
    file: 'libQnnHtp.so',
  },
};

export interface DownloadProgress {
  model: string;
  progress: number; // 0-100
  downloadedMB: number;
  totalMB: number;
  status: 'pending' | 'downloading' | 'extracting' | 'completed' | 'error';
  error?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  size: number;
  required: boolean;
  downloaded: boolean;
  installed: boolean;
}

class ModelDownloadService {
  private modelsDir: string;
  private listeners: ((progress: DownloadProgress) => void)[] = [];

  constructor() {
    // Store models in app's document directory
    this.modelsDir = `${RNFS.DocumentDirectoryPath}/models`;
    this.ensureModelsDir();
  }

  private async ensureModelsDir(): Promise<void> {
    const exists = await RNFS.exists(this.modelsDir);
    if (!exists) {
      await RNFS.mkdir(this.modelsDir);
    }
  }

  /**
   * Subscribe to download progress updates
   */
  subscribe(callback: (progress: DownloadProgress) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify(progress: DownloadProgress): void {
    this.listeners.forEach(callback => callback(progress));
  }

  /**
   * Get list of available models
   */
  getAvailableModels(): ModelInfo[] {
    return Object.entries(MODEL_URLS).map(([id, config]) => ({
      id,
      name: config.name,
      size: config.size,
      required: config.required,
      downloaded: false,
      installed: false,
    }));
  }

  /**
   * Check which models are already installed
   */
  async checkInstalledModels(): Promise<Record<string, boolean>> {
    const installed: Record<string, boolean> = {};

    for (const [id, config] of Object.entries(MODEL_URLS)) {
      const modelPath = `${this.modelsDir}/${config.type}/${config.file}`;
      try {
        installed[id] = await RNFS.exists(modelPath);
      } catch {
        installed[id] = false;
      }
    }

    return installed;
  }

  /**
   * Download a specific model
   */
  async downloadModel(modelId: string): Promise<boolean> {
    const config = MODEL_URLS[modelId as keyof typeof MODEL_URLS];
    if (!config) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    const targetDir = `${this.modelsDir}/${config.type}`;
    const zipPath = `${RNFS.CachesDirectoryPath}/${modelId}.zip`;

    try {
      // Ensure target directory exists
      const dirExists = await RNFS.exists(targetDir);
      if (!dirExists) {
        await RNFS.mkdir(targetDir);
      }

      // Notify start
      this.notify({
        model: modelId,
        progress: 0,
        downloadedMB: 0,
        totalMB: config.size,
        status: 'downloading',
      });

      // Download with progress
      const downloadResult = await RNFS.downloadFile({
        fromUrl: config.url,
        toFile: zipPath,
        progressDivider: 10,
        begin: () => {
          // Download started
        },
        progress: (res) => {
          const progress = Math.round((res.bytesWritten / res.contentLength) * 100);
          const downloadedMB = Math.round(res.bytesWritten / (1024 * 1024));
          this.notify({
            model: modelId,
            progress,
            downloadedMB,
            totalMB: config.size,
            status: 'downloading',
          });
        },
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error(`Download failed: ${downloadResult.statusCode}`);
      }

      // Notify extracting
      this.notify({
        model: modelId,
        progress: 100,
        downloadedMB: config.size,
        totalMB: config.size,
        status: 'extracting',
      });

      // Extract zip (using native module)
      // await unzip(zipPath, targetDir);

      // Clean up zip
      await RNFS.unlink(zipPath);

      // Notify completed
      this.notify({
        model: modelId,
        progress: 100,
        downloadedMB: config.size,
        totalMB: config.size,
        status: 'completed',
      });

      return true;
    } catch (error: any) {
      // Clean up on error
      try {
        if (await RNFS.exists(zipPath)) {
          await RNFS.unlink(zipPath);
        }
      } catch {}

      this.notify({
        model: modelId,
        progress: 0,
        downloadedMB: 0,
        totalMB: config.size,
        status: 'error',
        error: error.message || 'Unknown error',
      });

      return false;
    }
  }

  /**
   * Download all required models
   */
  async downloadRequiredModels(): Promise<boolean> {
    const required = Object.entries(MODEL_URLS)
      .filter(([_, config]) => config.required)
      .map(([id]) => id);

    for (const modelId of required) {
      const success = await this.downloadModel(modelId);
      if (!success) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get model file path
   */
  getModelPath(modelId: string): string | null {
    const config = MODEL_URLS[modelId as keyof typeof MODEL_URLS];
    if (!config) return null;
    return `${this.modelsDir}/${config.type}/${config.file}`;
  }

  /**
   * Get total size of all models
   */
  getTotalSize(): number {
    return Object.values(MODEL_URLS).reduce((sum, config) => sum + config.size, 0);
  }

  /**
   * Delete a model
   */
  async deleteModel(modelId: string): Promise<boolean> {
    const config = MODEL_URLS[modelId as keyof typeof MODEL_URLS];
    if (!config) return false;

    const modelDir = `${this.modelsDir}/${config.type}`;
    try {
      if (await RNFS.exists(modelDir)) {
        await RNFS.unlink(modelDir);
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get total downloaded size
   */
  async getDownloadedSize(): Promise<number> {
    const installed = await this.checkInstalledModels();
    let total = 0;
    for (const [id, isInstalled] of Object.entries(installed)) {
      if (isInstalled) {
        total += MODEL_URLS[id as keyof typeof MODEL_URLS].size;
      }
    }
    return total;
  }
}

export default new ModelDownloadService();
