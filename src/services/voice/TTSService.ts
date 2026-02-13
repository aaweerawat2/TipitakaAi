/**
 * TTS Service (Text-to-Speech)
 * Speech synthesis using VITS Thai, Piper, or System TTS
 */

import { NativeModules, Platform } from 'react-native';
import * as FileSystem from 'react-native-fs';
import { TTSModelType, TTSConfig, TTSResult } from '@/types';
import { modelManager } from '../core/ModelManager';

// ============================================
// Native Module Interfaces
// ============================================

interface VITSNativeInterface {
  loadModel(modelPath: string): Promise<boolean>;
  synthesize(text: string, speed: number, pitch: number): Promise<string>;
  isModelLoaded(): Promise<boolean>;
}

interface PiperNativeInterface {
  synthesize(text: string, modelPath: string, speed: number): Promise<string>;
}

// System TTS
interface SystemTTSInterface {
  speak(text: string): Promise<void>;
  stop(): Promise<void>;
  setRate(rate: number): Promise<void>;
  setPitch(pitch: number): Promise<void>;
  getVoices(): Promise<Array<{ id: string; language: string }>>;
}

const { VITSModule, PiperModule } = NativeModules;
const Tts = require('react-native-tts').default;

// ============================================
// TTS Service Class
// ============================================

class TTSService {
  private modelType: TTSModelType | null = null;
  private voice: TTSConfig['voice'] = 'female';
  private isLoaded = false;
  private config: TTSConfig | null = null;

  // Model paths by voice type
  private modelPaths: Record<string, Record<string, string>> = {
    vits: {
      female: 'models/tts/vits-thai-female.pte',
      male: 'models/tts/vits-thai-male.pte',
      'male-monk': 'models/tts/vits-thai-male-monk.pte',
    },
    piper: {
      female: 'models/tts/piper-thai-female.onnx',
      male: 'models/tts/piper-thai-male.onnx',
    },
  };

  /**
   * Initialize TTS with configuration
   */
  async initialize(config: TTSConfig): Promise<void> {
    if (this.isLoaded && 
        this.modelType === config.modelType && 
        this.voice === config.voice) {
      return;
    }

    // Unload previous model
    if (this.isLoaded && this.modelType !== 'rctp') {
      await this.unload();
    }

    this.config = config;
    this.modelType = config.modelType;
    this.voice = config.voice;

    try {
      switch (config.modelType) {
        case 'vits':
          await this.initializeVITS(config);
          break;
        case 'piper':
          await this.initializePiper(config);
          break;
        case 'rctp':
          await this.initializeSystemTTS(config);
          break;
      }

      console.log(`[TTSService] Initialized: ${config.modelType} (${config.voice})`);
    } catch (error) {
      console.error('[TTSService] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Initialize VITS model
   */
  private async initializeVITS(config: TTSConfig): Promise<void> {
    const modelId = `vits-thai-${config.voice}`;
    
    if (!modelManager.isModelDownloaded(modelId)) {
      // Check for fallback
      if (config.voice === 'male-monk' && !modelManager.isModelDownloaded('vits-thai-male')) {
        throw new Error('VITS Thai model not downloaded');
      }
    }

    const modelPath = this.modelPaths.vits[config.voice] || this.modelPaths.vits.female;

    if (VITSModule) {
      this.isLoaded = await VITSModule.loadModel(modelPath);
    } else {
      console.warn('[TTSService] VITS native module not available');
      this.isLoaded = false;
    }
  }

  /**
   * Initialize Piper model
   */
  private async initializePiper(config: TTSConfig): Promise<void> {
    // Piper uses ONNX runtime, no need to preload
    this.isLoaded = true;
  }

  /**
   * Initialize System TTS
   */
  private async initializeSystemTTS(config: TTSConfig): Promise<void> {
    // Configure system TTS
    await Tts.setDefaultRate(config.speed);
    await Tts.setDefaultPitch(1.0 + config.pitch * 0.1);
    
    // Try to find Thai voice
    const voices = await Tts.voices();
    const thaiVoice = voices.find((v: any) => 
      v.language && v.language.includes('th')
    );
    
    if (thaiVoice) {
      await Tts.setDefaultVoice(thaiVoice.id);
      console.log('[TTSService] Using Thai system voice:', thaiVoice.id);
    } else {
      console.warn('[TTSService] No Thai system voice found');
    }

    this.isLoaded = true;
  }

  /**
   * Synthesize text to speech
   */
  async synthesize(text: string): Promise<TTSResult> {
    if (!this.isLoaded || !this.config) {
      throw new Error('TTS not initialized');
    }

    const startTime = Date.now();

    try {
      let audioUri: string;

      switch (this.modelType) {
        case 'vits':
          audioUri = await this.synthesizeVITS(text);
          break;
        case 'piper':
          audioUri = await this.synthesizePiper(text);
          break;
        case 'rctp':
          audioUri = await this.synthesizeSystem(text);
          break;
        default:
          throw new Error('Unknown TTS model type');
      }

      const endTime = Date.now();

      return {
        audioUri,
        duration: endTime - startTime,
        format: 'wav',
      };
    } catch (error) {
      console.error('[TTSService] Synthesis error:', error);
      throw error;
    }
  }

  /**
   * Synthesize using VITS
   */
  private async synthesizeVITS(text: string): Promise<string> {
    if (!VITSModule || !this.config) {
      // Fallback to system TTS
      return this.synthesizeSystem(text);
    }

    // Preprocess text for Thai
    const processedText = this.preprocessText(text);

    return await VITSModule.synthesize(
      processedText,
      this.config.speed,
      this.config.pitch
    );
  }

  /**
   * Synthesize using Piper
   */
  private async synthesizePiper(text: string): Promise<string> {
    if (!PiperModule || !this.config) {
      return this.synthesizeSystem(text);
    }

    const modelPath = this.modelPaths.piper[this.voice] || this.modelPaths.piper.female;
    const processedText = this.preprocessText(text);

    return await PiperModule.synthesize(
      processedText,
      modelPath,
      this.config.speed
    );
  }

  /**
   * Synthesize using System TTS
   */
  private async synthesizeSystem(text: string): Promise<string> {
    // System TTS plays directly, we need to capture
    // This is a simplified implementation
    
    const audioPath = `${FileSystem.CachesDirectoryPath}/tts_${Date.now()}.wav`;
    
    // For system TTS, we just speak directly
    // Real implementation would need audio capture
    await Tts.speak(text);
    
    // Wait for speech to complete (simplified)
    await new Promise((r) => setTimeout(r, text.length * 50));
    
    return audioPath;
  }

  /**
   * Speak text directly (for system TTS)
   */
  async speak(text: string): Promise<void> {
    if (this.modelType === 'rctp') {
      await Tts.speak(text);
    } else {
      const result = await this.synthesize(text);
      // Would need audio player to play the file
      console.log('[TTSService] Generated audio:', result.audioUri);
    }
  }

  /**
   * Stop current speech
   */
  async stop(): Promise<void> {
    if (this.modelType === 'rctp') {
      await Tts.stop();
    }
  }

  /**
   * Preprocess text for TTS
   */
  private preprocessText(text: string): string {
    let processed = text;

    // 1. Convert numbers to Thai words
    processed = this.convertNumbersToThai(processed);

    // 2. Handle repetition mark (ๆ)
    processed = processed.replace(/(\S+)ๆ/g, '$1$1');

    // 3. Normalize whitespace
    processed = processed.replace(/\s+/g, ' ').trim();

    // 4. Handle Pali/Sanskrit terms (optional)
    // processed = this.transliteratePali(processed);

    return processed;
  }

  /**
   * Convert Arabic numbers to Thai words
   */
  private convertNumbersToThai(text: string): string {
    const thaiNumbers: Record<string, string> = {
      '0': 'ศูนย์', '1': 'หนึ่ง', '2': 'สอง', '3': 'สาม',
      '4': 'สี่', '5': 'ห้า', '6': 'หก', '7': 'เจ็ด',
      '8': 'แปด', '9': 'เก้า', '10': 'สิบ',
    };

    // Simple single digit replacement
    // For production, need proper Thai number-to-word conversion
    return text.replace(/\b\d\b/g, (match) => thaiNumbers[match] || match);
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): string[] {
    switch (this.modelType) {
      case 'vits':
        return ['female', 'male', 'male-monk'];
      case 'piper':
        return ['female', 'male'];
      case 'rctp':
        return ['system'];
      default:
        return [];
    }
  }

  /**
   * Unload model
   */
  async unload(): Promise<void> {
    this.isLoaded = false;
    console.log('[TTSService] Unloaded');
  }
}

// Singleton instance
export const ttsService = new TTSService();
