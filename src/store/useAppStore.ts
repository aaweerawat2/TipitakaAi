import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppSettings,
  ReaderSettings,
  VoiceSettings,
  ThemeMode,
} from '@/types';

// ============================================
// Default Settings
// ============================================

const defaultReaderSettings: ReaderSettings = {
  fontSize: 18,
  lineHeight: 2.0,
  fontFamily: 'serif',
  theme: 'light',
  textAlign: 'justify',
  autoScroll: false,
  autoScrollSpeed: 1,
};

const defaultVoiceSettings: VoiceSettings = {
  preset: 'balanced',
  asrModel: 'whisper-small-thai',
  ttsModel: 'vits',
  ttsVoice: 'female',
  speed: 1.0,
  pitch: 0,
};

const defaultAppSettings: AppSettings = {
  reader: defaultReaderSettings,
  voice: defaultVoiceSettings,
  firstLaunch: true,
  modelDownloadComplete: false,
};

// ============================================
// App Store Interface
// ============================================

interface AppState {
  // Settings
  settings: AppSettings;
  
  // Actions
  updateReaderSettings: (settings: Partial<ReaderSettings>) => void;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  setTheme: (theme: ThemeMode) => void;
  setFirstLaunch: (value: boolean) => void;
  setModelDownloadComplete: (value: boolean) => void;
  resetSettings: () => void;
}

// ============================================
// App Store
// ============================================

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      settings: defaultAppSettings,

      updateReaderSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, ...newSettings },
          },
        })),

      updateVoiceSettings: (newSettings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            voice: { ...state.settings.voice, ...newSettings },
          },
        })),

      setTheme: (theme) =>
        set((state) => ({
          settings: {
            ...state.settings,
            reader: { ...state.settings.reader, theme },
          },
        })),

      setFirstLaunch: (value) =>
        set((state) => ({
          settings: { ...state.settings, firstLaunch: value },
        })),

      setModelDownloadComplete: (value) =>
        set((state) => ({
          settings: { ...state.settings, modelDownloadComplete: value },
        })),

      resetSettings: () => set({ settings: defaultAppSettings }),
    }),
    {
      name: 'tripitaka-app-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const useReaderSettings = () =>
  useAppStore((state) => state.settings.reader);

export const useVoiceSettings = () =>
  useAppStore((state) => state.settings.voice);

export const useTheme = () =>
  useAppStore((state) => state.settings.reader.theme);

export const useIsFirstLaunch = () =>
  useAppStore((state) => state.settings.firstLaunch);

export const useModelDownloadComplete = () =>
  useAppStore((state) => state.settings.modelDownloadComplete);
