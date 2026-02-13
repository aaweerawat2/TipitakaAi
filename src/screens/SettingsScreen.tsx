import React, { Suspense } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronRight, Moon, Type, Volume2, FolderOpen, Info } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function SettingsScreen() {
  const theme = useAppStore((state) => state.settings.reader.theme);
  const navigation = useNavigation<NavigationProp>();
  
  const colors = theme === 'dark'
    ? { bg: '#1C1917', text: '#FAFAF9', subtext: '#A8A29E', card: '#292524' }
    : { bg: '#FFFFFF', text: '#1C1917', subtext: '#78716C', card: '#F5F5F4' };

  const settingsItems = [
    { icon: Type, label: 'การอ่าน', description: 'ขนาดอักษร, ธีม, ฟอนต์', route: null },
    { icon: Volume2, label: 'เสียง', description: 'ASR, TTS, ความเร็ว', route: 'VoiceSettings' as const },
    { icon: FolderOpen, label: 'เอกสารของฉัน', description: 'จัดการเอกสารที่เพิ่ม', route: 'DocumentManager' as const },
    { icon: Moon, label: 'ธีม', description: theme === 'dark' ? 'มืด' : theme === 'sepia' ? 'น้ำตาล' : 'สว่าง', route: null },
    { icon: Info, label: 'เกี่ยวกับ', description: 'เวอร์ชัน 1.0.0', route: null },
  ];

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="p-4">
        <Text className="text-2xl font-bold mb-6" style={{ color: colors.text }}>
          ⚙️ การตั้งค่า
        </Text>

        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            className="flex-row items-center p-4 rounded-xl mb-2"
            style={{ backgroundColor: colors.card }}
            onPress={() => item.route && navigation.navigate(item.route)}
          >
            <item.icon size={24} color="#F97316" />
            <View className="flex-1 ml-3">
              <Text className="font-medium" style={{ color: colors.text }}>
                {item.label}
              </Text>
              <Text className="text-sm" style={{ color: colors.subtext }}>
                {item.description}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.subtext} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

export default function SettingsScreenWrapper() {
  return (
    <Suspense fallback={<View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#F97316" /></View>}>
      <SettingsScreen />
    </Suspense>
  );
}
