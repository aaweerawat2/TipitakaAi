import React, { Suspense } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { useVoiceStore, VOICE_PRESETS } from '../store/useVoiceStore';

function VoiceSettingsScreen() {
  const theme = useAppStore((state) => state.settings.reader.theme);
  const { currentPreset, applyPreset, asrModel, ttsModel, setASR, setTTS } = useVoiceStore();
  
  const colors = theme === 'dark'
    ? { bg: '#1C1917', text: '#FAFAF9', subtext: '#A8A29E', card: '#292524' }
    : { bg: '#FFFFFF', text: '#1C1917', subtext: '#78716C', card: '#F5F5F4' };

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="p-4">
        <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
          🎛️ รูปแบบพร้อมใช้
        </Text>

        {/* Presets */}
        {VOICE_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            className={`p-4 rounded-xl mb-2 border-2 ${
              currentPreset === preset.id ? 'border-orange-500' : 'border-transparent'
            }`}
            style={{ backgroundColor: colors.card }}
            onPress={() => applyPreset(preset)}
          >
            <Text className="font-medium" style={{ color: colors.text }}>
              {preset.name}
            </Text>
            <Text className="text-sm" style={{ color: colors.subtext }}>
              {preset.description}
            </Text>
          </TouchableOpacity>
        ))}

        <Text className="text-lg font-semibold mt-6 mb-4" style={{ color: colors.text }}>
          🎙️ การรับเสียง (ASR)
        </Text>

        {/* ASR Options */}
        {[
          { id: 'whisper-small-thai', name: 'Whisper Small', size: '244 MB', accuracy: 'สูง' },
          { id: 'whisper-tiny-thai', name: 'Whisper Tiny', size: '39 MB', accuracy: 'ปานกลาง' },
        ].map((model) => (
          <TouchableOpacity
            key={model.id}
            className={`p-4 rounded-xl mb-2 ${
              asrModel === model.id ? 'bg-orange-100 dark:bg-orange-900' : ''
            }`}
            style={{ backgroundColor: asrModel === model.id ? '#FEF3C7' : colors.card }}
            onPress={() => setASR(model.id as any)}
          >
            <Text className="font-medium" style={{ color: colors.text }}>
              {model.name}
            </Text>
            <Text className="text-sm" style={{ color: colors.subtext }}>
              {model.size} • ความแม่นยำ: {model.accuracy}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

export default function VoiceSettingsScreenWrapper() {
  return (
    <Suspense fallback={<View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#F97316" /></View>}>
      <VoiceSettingsScreen />
    </Suspense>
  );
}
