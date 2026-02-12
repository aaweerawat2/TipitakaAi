/**
 * QNN (Qualcomm Neural Network) Runtime Service
 * จัดการ QNN HTP acceleration สำหรับ AI inference
 */

import { NativeModules, Platform } from 'react-native';

const { QNNModule } = NativeModules;

export interface QNNDevice {
  name: string;
  type: 'cpu' | 'gpu' | 'dsp' | 'htp';
  available: boolean;
}

export interface QNNModel {
  id: string;
  name: string;
  loaded: boolean;
  backend: 'cpu' | 'htp';
}

class QNNService {
  private initialized: boolean = false;
  private htpAvailable: boolean = false;
  private loadedModels: Map<string, QNNModel> = new Map();

  /**
   * Initialize QNN runtime
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('QNN only available on Android');
      return false;
    }

    try {
      // Check if QNN native module is available
      if (!QNNModule) {
        console.log('QNN module not available, falling back to CPU');
        this.initialized = true;
        this.htpAvailable = false;
        return true;
      }

      // Initialize QNN runtime
      const result = await QNNModule.initialize();
      this.initialized = true;
      this.htpAvailable = result?.htpAvailable ?? false;

      console.log(`QNN initialized. HTP available: ${this.htpAvailable}`);
      return true;
    } catch (error) {
      console.error('Failed to initialize QNN:', error);
      this.initialized = true;
      this.htpAvailable = false;
      return true; // Still return true to use CPU fallback
    }
  }

  /**
   * Check if QNN HTP is available (Snapdragon only)
   */
  isHTPAvailable(): boolean {
    return this.htpAvailable;
  }

  /**
   * Get available QNN backends
   */
  async getAvailableBackends(): Promise<QNNDevice[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const devices: QNNDevice[] = [
      { name: 'CPU', type: 'cpu', available: true },
    ];

    if (this.htpAvailable) {
      devices.push({ name: 'HTP (NPU)', type: 'htp', available: true });
    }

    return devices;
  }

  /**
   * Load a model into QNN
   */
  async loadModel(modelPath: string, modelId: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      if (QNNModule) {
        const backend = this.htpAvailable ? 'htp' : 'cpu';
        await QNNModule.loadModel(modelPath, modelId, backend);
        
        this.loadedModels.set(modelId, {
          id: modelId,
          name: modelId,
          loaded: true,
          backend: backend as 'cpu' | 'htp',
        });
      }
      return true;
    } catch (error) {
      console.error(`Failed to load model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Run inference on a loaded model
   */
  async inference(modelId: string, input: number[]): Promise<number[]> {
    const model = this.loadedModels.get(modelId);
    if (!model || !model.loaded) {
      throw new Error(`Model ${modelId} not loaded`);
    }

    if (QNNModule) {
      return await QNNModule.inference(modelId, input);
    }

    // Fallback: return dummy output
    return new Array(1000).fill(0);
  }

  /**
   * Run LLM inference
   */
  async generateText(prompt: string, maxTokens: number = 512): Promise<string> {
    if (!this.loadedModels.has('llm')) {
      throw new Error('LLM model not loaded');
    }

    if (QNNModule) {
      return await QNNModule.generateText(prompt, maxTokens);
    }

    // Fallback response
    return 'AI models need to be downloaded first. Please go to Settings > AI Models to download.';
  }

  /**
   * Run ASR (speech-to-text)
   */
  async transcribe(audioPath: string): Promise<string> {
    if (!this.loadedModels.has('asr')) {
      throw new Error('ASR model not loaded');
    }

    if (QNNModule) {
      return await QNNModule.transcribe(audioPath);
    }

    return 'Speech recognition requires model download.';
  }

  /**
   * Run TTS (text-to-speech)
   */
  async synthesize(text: string, outputPath: string): Promise<string> {
    if (!this.loadedModels.has('tts')) {
      throw new Error('TTS model not loaded');
    }

    if (QNNModule) {
      return await QNNModule.synthesize(text, outputPath);
    }

    return '';
  }

  /**
   * Unload a model
   */
  async unloadModel(modelId: string): Promise<void> {
    if (QNNModule) {
      await QNNModule.unloadModel(modelId);
    }
    this.loadedModels.delete(modelId);
  }

  /**
   * Get loaded models
   */
  getLoadedModels(): QNNModel[] {
    return Array.from(this.loadedModels.values());
  }

  /**
   * Get preferred backend for device
   */
  getPreferredBackend(): 'cpu' | 'htp' {
    return this.htpAvailable ? 'htp' : 'cpu';
  }

  /**
   * Get performance estimate
   */
  getPerformanceEstimate(modelType: 'llm' | 'asr' | 'tts'): {
    cpu: number; // tokens/sec or realtime factor
    htp: number;
  } {
    // Estimates based on Snapdragon 8 Gen 2
    const estimates = {
      llm: { cpu: 5, htp: 25 }, // tokens/sec
      asr: { cpu: 0.5, htp: 2 }, // realtime factor (higher is better)
      tts: { cpu: 0.3, htp: 1.5 },
    };

    return estimates[modelType];
  }
}

export default new QNNService();
