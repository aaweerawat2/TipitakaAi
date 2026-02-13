import { create } from 'zustand';
import {
  VoicePreset,
  VoiceSettings,
  ASRModelType,
  TTSModelType,
  TTSConfig,
} from '@/types';

// ============================================
// Voice Presets
// ============================================

export const VOICE_PRESETS: VoicePreset[] = [
  {
    id: 'monk-meditation',
    name: 'พระสอนธรรม',
    description: 'เสียงพระสงบ อัตราช้า เหมาะกับการนั่งสมาธิ',
    asr: 'whisper-small-thai',
    tts: 'vits',
    ttsVoice: 'male-monk',
    speed: 0.8,
    pitch: -2,
  },
  {
    id: 'fast-qa',
    name: 'ถาม-ตอบเร็ว',
    description: 'ตอบสนองรวดเร็ว เหมาะกับการค้นหาสั้นๆ',
    asr: 'whisper-tiny-thai',
    tts: 'vits',
    ttsVoice: 'female',
    speed: 1.1,
    pitch: 0,
  },
  {
    id: 'balanced',
    name: 'สมดุล',
    description: 'สมดุลระหว่างความแม่นยำและความเร็ว',
    asr: 'whisper-small-thai',
    tts: 'vits',
    ttsVoice: 'female',
    speed: 1.0,
    pitch: 0,
  },
  {
    id: 'system-tts',
    name: 'ใช้เสียงระบบ',
    description: 'ไม่ใช้โมเดล ประหยัดพื้นที่',
    asr: 'whisper-tiny-thai',
    tts: 'rctp',
    ttsVoice: 'system',
    speed: 1.0,
    pitch: 0,
  },
];

// ============================================
// Store Interface
// ============================================

interface VoiceState {
  // Current Settings
  selectedASR: ASRModelType;
  selectedTTS: TTSModelType;
  selectedVoice: TTSConfig['voice'];
  speed: number;
  pitch: number;
  volume: number;
  currentPreset: string | null;
  
  // Model Loading State
  asrLoaded: boolean;
  ttsLoaded: boolean;
  isProcessing: boolean;
  
  // Actions
  setASR: (model: ASRModelType) => void;
  setTTS: (model: TTSModelType) => void;
  setVoice: (voice: TTSConfig['voice']) => void;
  setSpeed: (speed: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  applyPreset: (preset: VoicePreset) => void;
  setASRLoaded: (loaded: boolean) => void;
  setTTSLoaded: (loaded: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  resetToDefaults: () => void;
}

// ============================================
// Default Values
// ============================================

const defaultPreset = VOICE_PRESETS.find((p) => p.id === 'balanced')!;

// ============================================
// Voice Store
// ============================================

export const useVoiceStore = create<VoiceState>((set) => ({
  selectedASR: defaultPreset.asr,
  selectedTTS: defaultPreset.tts,
  selectedVoice: defaultPreset.ttsVoice,
  speed: defaultPreset.speed,
  pitch: defaultPreset.pitch,
  volume: 1.0,
  currentPreset: defaultPreset.id,
  asrLoaded: false,
  ttsLoaded: false,
  isProcessing: false,

  setASR: (model) =>
    set({ selectedASR: model, currentPreset: null }),

  setTTS: (model) =>
    set({ selectedTTS: model, currentPreset: null }),

  setVoice: (voice) =>
    set({ selectedVoice: voice, currentPreset: null }),

  setSpeed: (speed) =>
    set({ speed, currentPreset: null }),

  setPitch: (pitch) =>
    set({ pitch, currentPreset: null }),

  setVolume: (volume) => set({ volume }),

  applyPreset: (preset) =>
    set({
      selectedASR: preset.asr,
      selectedTTS: preset.tts,
      selectedVoice: preset.ttsVoice,
      speed: preset.speed,
      pitch: preset.pitch,
      currentPreset: preset.id,
    }),

  setASRLoaded: (loaded) => set({ asrLoaded: loaded }),

  setTTSLoaded: (loaded) => set({ ttsLoaded: loaded }),

  setIsProcessing: (processing) => set({ isProcessing: processing }),

  resetToDefaults: () =>
    set({
      selectedASR: defaultPreset.asr,
      selectedTTS: defaultPreset.tts,
      selectedVoice: defaultPreset.ttsVoice,
      speed: defaultPreset.speed,
      pitch: defaultPreset.pitch,
      volume: 1.0,
      currentPreset: defaultPreset.id,
    }),
}));

// ============================================
// Selectors
// ============================================

export const useCurrentPreset = () =>
  useVoiceStore((state) =>
    VOICE_PRESETS.find((p) => p.id === state.currentPreset)
  );

export const useVoiceConfig = (): TTSConfig =>
  useVoiceStore((state) => ({
    modelType: state.selectedTTS,
    voice: state.selectedVoice,
    speed: state.speed,
    pitch: state.pitch,
    volume: state.volume,
  }));

export const useIsVoiceReady = () =>
  useVoiceStore((state) => state.asrLoaded && state.ttsLoaded);
