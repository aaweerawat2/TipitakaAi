/**
 * Voice Pipeline
 * Orchestrates ASR -> RAG -> TTS for voice-based interaction
 */

import { asrService } from './ASRService';
import { ttsService } from './TTSService';
import { ragEngine } from '../ai/RAGEngine';
import { modelManager } from '../core/ModelManager';
import { useVoiceStore } from '@/store/useVoiceStore';
import { ASRResult, TTSResult, RAGResponse, VoicePreset } from '@/types';

// ============================================
// Types
// ============================================

export interface VoicePipelineCallbacks {
  onListeningStart?: () => void;
  onListeningEnd?: () => void;
  onTranscript?: (text: string, confidence: number) => void;
  onProcessing?: () => void;
  onResponse?: (text: string) => void;
  onSpeakingStart?: () => void;
  onSpeakingEnd?: () => void;
  onError?: (error: Error) => void;
  onAudioLevel?: (level: number) => void;
}

export interface VoicePipelineConfig {
  asrModel: 'whisper-small-thai' | 'whisper-tiny-thai';
  ttsModel: 'vits' | 'piper' | 'rctp';
  ttsVoice: 'female' | 'male' | 'male-monk' | 'system';
  speed: number;
  pitch: number;
  autoSpeak: boolean;
}

// ============================================
// Voice Pipeline Class
// ============================================

class VoicePipeline {
  private isProcessing = false;
  private config: VoicePipelineConfig | null = null;
  private callbacks: VoicePipelineCallbacks = {};

  /**
   * Initialize voice pipeline with configuration
   */
  async initialize(config: VoicePipelineConfig): Promise<void> {
    this.config = config;

    try {
      // Initialize ASR
      await asrService.initialize({
        modelType: config.asrModel,
        language: 'th',
        enableVAD: true,
        silenceThreshold: 500,
      });

      // Initialize TTS
      await ttsService.initialize({
        modelType: config.ttsModel,
        voice: config.ttsVoice,
        speed: config.speed,
        pitch: config.pitch,
        volume: 1.0,
      });

      console.log('[VoicePipeline] Initialized');
    } catch (error) {
      console.error('[VoicePipeline] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Apply preset configuration
   */
  async applyPreset(preset: VoicePreset): Promise<void> {
    await this.initialize({
      asrModel: preset.asr,
      ttsModel: preset.tts,
      ttsVoice: preset.ttsVoice,
      speed: preset.speed,
      pitch: preset.pitch,
      autoSpeak: true,
    });
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: VoicePipelineCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Start voice interaction (record -> transcribe -> process -> speak)
   */
  async startVoiceInteraction(): Promise<void> {
    if (this.isProcessing) {
      console.warn('[VoicePipeline] Already processing');
      return;
    }

    if (!this.config) {
      throw new Error('Pipeline not initialized');
    }

    this.isProcessing = true;
    const setIsProcessing = useVoiceStore.getState().setIsProcessing;
    setIsProcessing(true);

    try {
      // 1. Start listening
      this.callbacks.onListeningStart?.();
      console.log('[VoicePipeline] Listening...');

      // 2. Record and transcribe
      const asrResult = await this.recordAndTranscribe();
      
      this.callbacks.onListeningEnd?.();
      this.callbacks.onTranscript?.(asrResult.text, asrResult.confidence);

      // 3. Process with RAG
      this.callbacks.onProcessing?.();
      console.log('[VoicePipeline] Processing:', asrResult.text);

      const ragResponse = await ragEngine.query({
        question: asrResult.text,
        topK: 5,
        threshold: 0.6,
      });

      this.callbacks.onResponse?.(ragResponse.answer);

      // 4. Synthesize and play response
      if (this.config.autoSpeak) {
        this.callbacks.onSpeakingStart?.();
        console.log('[VoicePipeline] Speaking...');

        await this.speak(ragResponse.answer);

        this.callbacks.onSpeakingEnd?.();
      }

    } catch (error) {
      console.error('[VoicePipeline] Error:', error);
      this.callbacks.onError?.(error as Error);
    } finally {
      this.isProcessing = false;
      setIsProcessing(false);
    }
  }

  /**
   * Record audio and transcribe
   */
  private async recordAndTranscribe(): Promise<ASRResult> {
    // Start recording
    await asrService.startRecording();

    // Wait for recording (would be controlled by VAD in production)
    // For now, record for a fixed duration or until silence
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Stop recording
    const audioPath = await asrService.stopRecording();

    // Transcribe
    return asrService.transcribe(audioPath);
  }

  /**
   * Speak text using TTS
   */
  private async speak(text: string): Promise<void> {
    if (this.config?.ttsModel === 'rctp') {
      // System TTS plays directly
      await ttsService.speak(text);
    } else {
      // Synthesize to file, then would play
      const result = await ttsService.synthesize(text);
      console.log('[VoicePipeline] Audio generated:', result.audioUri);
      // In production, would use audio player to play the file
    }
  }

  /**
   * Start streaming voice interaction
   * Returns intermediate results as they become available
   */
  async *startStreamingInteraction(): AsyncGenerator<{
    type: 'transcript' | 'response' | 'audio';
    data: any;
  }> {
    if (!this.config) {
      throw new Error('Pipeline not initialized');
    }

    this.isProcessing = true;

    try {
      // Record and transcribe
      await asrService.startRecording();
      await new Promise((r) => setTimeout(r, 2000));
      const audioPath = await asrService.stopRecording();
      
      const asrResult = await asrService.transcribe(audioPath);
      yield { type: 'transcript', data: asrResult };

      // Process with RAG
      const ragResponse = await ragEngine.query({
        question: asrResult.text,
      });
      yield { type: 'response', data: ragResponse };

      // Synthesize
      if (this.config.ttsModel === 'rctp') {
        await ttsService.speak(ragResponse.answer);
      } else {
        const ttsResult = await ttsService.synthesize(ragResponse.answer);
        yield { type: 'audio', data: ttsResult };
      }

    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Stop current processing
   */
  stop(): void {
    if (asrService.isRecording()) {
      asrService.stopRecording();
    }
    
    ttsService.stop();
    this.isProcessing = false;
    console.log('[VoicePipeline] Stopped');
  }

  /**
   * Check if currently processing
   */
  isActive(): boolean {
    return this.isProcessing;
  }

  /**
   * Check if pipeline is ready
   */
  isReady(): boolean {
    return asrService.isReady() && ttsService.isReady();
  }

  /**
   * Get available memory for models
   */
  async getMemoryStatus(): Promise<{
    used: number;
    available: number;
    canLoadAll: boolean;
  }> {
    // Rough estimation
    const used = modelManager.getLoadedModelsRAM();
    const available = 4096 - used; // Assume 4GB total
    const required = 
      (this.config?.asrModel === 'whisper-small-thai' ? 500 : 150) +
      (this.config?.ttsModel === 'vits' ? 100 : 50);

    return {
      used,
      available,
      canLoadAll: available >= required,
    };
  }
}

// Singleton instance
export const voicePipeline = new VoicePipeline();
