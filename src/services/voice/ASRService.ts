/**
 * ASR Service (Automatic Speech Recognition)
 * Speech-to-text using Whisper Thai models
 */

import { NativeModules, Platform } from 'react-native';
import { ASRModelType, ASRConfig, ASRResult } from '@/types';
import { modelManager } from '../core/ModelManager';

// ============================================
// Native Module Interface
// ============================================

interface ASRNativeInterface {
  loadModel(modelPath: string): Promise<boolean>;
  transcribe(audioPath: string): Promise<{ text: string; confidence: number }>;
  startRecording(): Promise<void>;
  stopRecording(): Promise<string>;
  isModelLoaded(): Promise<boolean>;
}

const { WhisperModule } = NativeModules;

// ============================================
// Audio Recording State
// ============================================

interface AudioRecorder {
  isRecording: boolean;
  audioPath: string | null;
}

// ============================================
// ASR Service Class
// ============================================

class ASRService {
  private modelType: ASRModelType | null = null;
  private isLoaded = false;
  private config: ASRConfig | null = null;
  private recorder: AudioRecorder = {
    isRecording: false,
    audioPath: null,
  };

  // Model paths
  private modelPaths: Record<ASRModelType, string> = {
    'whisper-small-thai': 'models/asr/whisper-small-thai.pte',
    'whisper-tiny-thai': 'models/asr/whisper-tiny-thai.pte',
  };

  /**
   * Initialize ASR with specified model
   */
  async initialize(config: ASRConfig): Promise<void> {
    if (this.isLoaded && this.modelType === config.modelType) {
      return;
    }

    // Unload previous model if different
    if (this.isLoaded && this.modelType !== config.modelType) {
      await this.unload();
    }

    this.config = config;
    this.modelType = config.modelType;

    try {
      // Check if model is downloaded
      if (!modelManager.isModelDownloaded(config.modelType)) {
        throw new Error(`ASR model ${config.modelType} not downloaded`);
      }

      const model = modelManager.getModel(config.modelType);
      const modelPath = model?.path || this.modelPaths[config.modelType];

      if (WhisperModule) {
        this.isLoaded = await WhisperModule.loadModel(modelPath);
      } else {
        // Mock for development
        console.warn('[ASRService] Native module not available, using mock');
        this.isLoaded = true;
      }

      if (this.isLoaded) {
        await modelManager.loadModel(config.modelType);
        console.log(`[ASRService] Loaded: ${config.modelType}`);
      }
    } catch (error) {
      console.error('[ASRService] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio file
   */
  async transcribe(audioPath: string): Promise<ASRResult> {
    if (!this.isLoaded) {
      throw new Error('ASR not initialized');
    }

    const startTime = Date.now();

    try {
      let result: { text: string; confidence: number };

      if (WhisperModule) {
        result = await WhisperModule.transcribe(audioPath);
      } else {
        // Mock result for development
        result = await this.mockTranscribe(audioPath);
      }

      const endTime = Date.now();

      return {
        text: result.text,
        confidence: result.confidence,
        language: 'th',
        duration: endTime - startTime,
      };
    } catch (error) {
      console.error('[ASRService] Transcription error:', error);
      throw error;
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(): Promise<void> {
    if (this.recorder.isRecording) {
      console.warn('[ASRService] Already recording');
      return;
    }

    if (WhisperModule) {
      await WhisperModule.startRecording();
    }

    this.recorder.isRecording = true;
    this.recorder.audioPath = null;
    console.log('[ASRService] Started recording');
  }

  /**
   * Stop recording and get audio path
   */
  async stopRecording(): Promise<string> {
    if (!this.recorder.isRecording) {
      throw new Error('Not recording');
    }

    let audioPath: string;

    if (WhisperModule) {
      audioPath = await WhisperModule.stopRecording();
    } else {
      // Mock path for development
      audioPath = `/tmp/recording_${Date.now()}.wav`;
    }

    this.recorder.isRecording = false;
    this.recorder.audioPath = audioPath;
    console.log('[ASRService] Stopped recording:', audioPath);

    return audioPath;
  }

  /**
   * Record and transcribe in one call
   */
  async recordAndTranscribe(maxDuration = 30000): Promise<ASRResult> {
    await this.startRecording();

    // Auto-stop after max duration
    const timeoutId = setTimeout(() => {
      if (this.recorder.isRecording) {
        this.stopRecording();
      }
    }, maxDuration);

    // Wait for recording to complete (would be triggered by VAD or user action)
    // In real implementation, this would use VAD for silence detection
    
    // For now, simulate a short recording
    await new Promise((r) => setTimeout(r, 2000));
    
    clearTimeout(timeoutId);

    const audioPath = await this.stopRecording();
    return this.transcribe(audioPath);
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.recorder.isRecording;
  }

  /**
   * Check if model is loaded
   */
  isReady(): boolean {
    return this.isLoaded;
  }

  /**
   * Get current model type
   */
  getModelType(): ASRModelType | null {
    return this.modelType;
  }

  /**
   * Unload model
   */
  async unload(): Promise<void> {
    if (this.modelType && this.isLoaded) {
      await modelManager.unloadModel(this.modelType);
    }
    
    this.isLoaded = false;
    this.modelType = null;
    console.log('[ASRService] Unloaded');
  }

  /**
   * Mock transcription for development
   */
  private async mockTranscribe(audioPath: string): Promise<{ text: string; confidence: number }> {
    await new Promise((r) => setTimeout(r, 500));
    
    // Return mock Thai text
    const mockTexts = [
      'ความไม่ประมาทคืออะไร',
      'วิธีฝึกสติตามพระสูตร',
      'อริยสัจสี่มีอะไรบ้าง',
      'สติปัฏฐานสี่คืออะไร',
    ];
    
    return {
      text: mockTexts[Math.floor(Math.random() * mockTexts.length)],
      confidence: 0.85 + Math.random() * 0.1,
    };
  }
}

// Singleton instance
export const asrService = new ASRService();
