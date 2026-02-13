import React, { Suspense } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useVoiceStore } from '../store/useVoiceStore';

function VoiceChatScreen() {
  const theme = useAppStore((state) => state.settings.reader.theme);
  const { asrLoaded, ttsLoaded, isProcessing } = useVoiceStore();
  
  const colors = theme === 'dark'
    ? { bg: '#1C1917', text: '#FAFAF9', subtext: '#A8A29E' }
    : { bg: '#FFFFFF', text: '#1C1917', subtext: '#78716C' };

  const isReady = asrLoaded && ttsLoaded;

  return (
    <View className="flex-1 items-center justify-center p-4" style={{ backgroundColor: colors.bg }}>
      <Text className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
        🎤 คุยด้วยเสียง
      </Text>
      <Text className="text-center mb-8" style={{ color: colors.subtext }}>
        {isReady 
          ? 'กดปุ่มไมโครโฟนเพื่อเริ่มพูด' 
          : 'กำลังโหลดโมเดลเสียง...'}
      </Text>

      {/* Voice Button */}
      <View 
        className={`w-32 h-32 rounded-full items-center justify-center ${
          isProcessing ? 'bg-red-500' : 'bg-orange-500'
        }`}
      >
        {isProcessing ? (
          <MicOff size={48} color="white" />
        ) : (
          <Mic size={48} color="white" />
        )}
      </View>

      <Text className="text-sm mt-4" style={{ color: colors.subtext }}>
        {isProcessing ? 'กดอีกครั้งเพื่อหยุด' : 'กดค้างเพื่อพูด'}
      </Text>
    </View>
  );
}

export default function VoiceChatScreenWrapper() {
  return (
    <Suspense fallback={<View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#F97316" /></View>}>
      <VoiceChatScreen />
    </Suspense>
  );
}
