import React, { Suspense, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Settings, Share, Bookmark, Volume2 } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { SuttaContent } from '../types';

// Mock data - would come from database in production
const mockSutta: SuttaContent = {
  id: 'mn1',
  sutta_id: 'MN 1',
  title_thai: 'มูลปริยายสูตร',
  title_pali: 'Mūlapariyāya Sutta',
  pitaka: 'sutta',
  nikaya: 'มัชฌิมนิกาย',
  content_thai: `เรื่องมูลปริยายสูตร

[๑] ข้าพเจ้าได้สดับมาอย่างนี้ สมัยหนึ่ง พระผู้มีพระภาคอรหันตสัมมาสัมพุทธเจ้า ประทับอยู่ ณ ป่าอัมพลัฏฐิกา ของพราหมณ์ชื่ออัมพลัฏฐิกะ ในเขตพระนครราชคฤห์ กับด้วยภิกษุสงฆ์หมู่ใหญ่ มีภิกษุ ๑,๒๕๐ รูป

[๒] ครั้งนั้น พระผู้มีพระภาคได้ตรัสเรียกภิกษุทั้งหลายว่า ดูกรภิกษุทั้งหลาย เธอทั้งหลายจงฟังธรรมนี้ คือ มูลปริยาย อันเป็นที่ตั้งแห่งธรรมทั้งปวง ที่เธอทั้งหลายไม่เคยได้สดับมาแล้ว ดูกรภิกษุทั้งหลาย เธอทั้งหลายจงฟัง จะกล่าวธรรมนี้ คือ มูลปริยาย อันเป็นที่ตั้งแห่งธรรมทั้งปวง

[๓] ดูกรภิกษุทั้งหลาย บุคคลย่อมรู้จักธาตุทั้งปวง เมื่อรู้จักธาตุทั้งปวงแล้ว ย่อมไม่ยึดถือธาตุทั้งปวงนั้น เมื่อไม่ยึดถือแล้ว ย่อมไม่ยินดีในธาตุทั้งปวงนั้น เมื่อไม่ยินดีแล้ว ย่อมไม่ประกอบด้วยความกำหนัดยินดี เมื่อไม่ประกอบด้วยความกำหนัดยินดีแล้ว ย่อมไม่ถึงความแก่ ความตาย ความโศก ความรำพัน ความทุกข์ใจ ความกระวนกระวาย ในธาตุทั้งปวงนั้น

[๔] ดูกรภิกษุทั้งหลาย อริยสาวกผู้มีปัญญา เบื้องต้นย่อมรู้ชัดซึ่งธาตุทั้งปวง รู้ชัดซึ่งธาตุทั้งปวงแล้ว ย่อมไม่ยึดถือธาตุทั้งปวงนั้น ไม่ยึดถือแล้ว ย่อมไม่ยินดีในธาตุทั้งปวงนั้น ไม่ยินดีแล้ว ย่อมไม่ประกอบด้วยความกำหนัดยินดี ไม่ประกอบด้วยความกำหนัดยินดีแล้ว ย่อมไม่ถึงความแก่ ความตาย ความโศก ความรำพัน ความทุกข์ใจ ความกระวนกระวาย ในธาตุทั้งปวงนั้น`,
  content_pali: 'Mūlapariyāya Sutta...',
  vagga: 'มูลปริยายวรรค',
};

// Theme colors helper
function getThemeColors(theme: string) {
  switch (theme) {
    case 'dark':
      return {
        bg: '#1C1917',
        text: '#FAFAF9',
        subtext: '#A8A29E',
        accent: '#F97316',
        card: '#292524',
      };
    case 'sepia':
      return {
        bg: '#F4ECD8',
        text: '#3D3735',
        subtext: '#6B6361',
        accent: '#C19A6B',
        card: '#FDFCFB',
      };
    default:
      return {
        bg: '#FFFFFF',
        text: '#1C1917',
        subtext: '#78716C',
        accent: '#F97316',
        card: '#F5F5F4',
      };
  }
}

// Reader Settings Modal (simplified)
function ReaderSettingsModal({ 
  visible, 
  onClose 
}: { 
  visible: boolean; 
  onClose: () => void;
}) {
  const settings = useAppStore((state) => state.settings.reader);
  const updateReaderSettings = useAppStore((state) => state.updateReaderSettings);
  const colors = getThemeColors(settings.theme);

  if (!visible) return null;

  return (
    <View className="absolute bottom-0 left-0 right-0 p-4 rounded-t-2xl" 
      style={{ backgroundColor: colors.card }}>
      <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
        การตั้งค่าการอ่าน
      </Text>
      
      {/* Font Size */}
      <View className="flex-row items-center justify-between mb-4">
        <Text style={{ color: colors.text }}>ขนาดอักษร</Text>
        <View className="flex-row items-center">
          <TouchableOpacity 
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.bg }}
            onPress={() => updateReaderSettings({ 
              fontSize: Math.max(12, settings.fontSize - 2) 
            })}
          >
            <Text style={{ color: colors.text }}>-</Text>
          </TouchableOpacity>
          <Text className="mx-4" style={{ color: colors.text }}>{settings.fontSize}</Text>
          <TouchableOpacity 
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.bg }}
            onPress={() => updateReaderSettings({ 
              fontSize: Math.min(32, settings.fontSize + 2) 
            })}
          >
            <Text style={{ color: colors.text }}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Theme */}
      <View className="flex-row items-center justify-between mb-4">
        <Text style={{ color: colors.text }}>ธีม</Text>
        <View className="flex-row">
          {['light', 'sepia', 'dark'].map((t) => (
            <TouchableOpacity
              key={t}
              className={`w-10 h-10 rounded-full mx-1 items-center justify-center ${
                settings.theme === t ? 'border-2 border-orange-500' : ''
              }`}
              style={{ 
                backgroundColor: getThemeColors(t).bg,
                borderColor: settings.theme === t ? '#F97316' : 'transparent'
              }}
              onPress={() => updateReaderSettings({ theme: t as any })}
            />
          ))}
        </View>
      </View>
      
      <TouchableOpacity 
        className="py-3 rounded-xl items-center"
        style={{ backgroundColor: '#F97316' }}
        onPress={onClose}
      >
        <Text className="text-white font-medium">เสร็จสิ้น</Text>
      </TouchableOpacity>
    </View>
  );
}

// Main Reader Screen
function ReaderScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { suttaId } = (route.params as any) || {};
  
  const [sutta, setSutta] = useState<SuttaContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const settings = useAppStore((state) => state.settings.reader);
  const addReadingHistory = useHistoryStore((state) => state.addReadingHistory);
  const updateReadingProgress = useHistoryStore((state) => state.updateReadingProgress);
  
  const { width } = useWindowDimensions();
  const colors = getThemeColors(settings.theme);

  useEffect(() => {
    // Load sutta content
    const loadSutta = async () => {
      setLoading(true);
      try {
        // TODO: Load from database
        await new Promise((resolve) => setTimeout(resolve, 500));
        setSutta(mockSutta);
        
        // Add to reading history
        addReadingHistory({
          suttaId: mockSutta.id,
          title: mockSutta.title_thai,
          progress: 0,
        });
      } catch (error) {
        console.error('Error loading sutta:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSutta();
  }, [suttaId]);

  const handleScroll = (event: any) => {
    // Calculate reading progress
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const progress = (contentOffset.y / (contentSize.height - layoutMeasurement.height)) * 100;
    
    if (sutta) {
      updateReadingProgress(sutta.id, Math.min(100, Math.max(0, progress)));
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  if (!sutta) {
    return (
      <View className="flex-1 items-center justify-center p-4" style={{ backgroundColor: colors.bg }}>
        <Text className="text-lg" style={{ color: colors.text }}>
          ไม่พบพระสูตร
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      {/* Header */}
      <View 
        className="flex-row items-center justify-between px-4 py-3"
        style={{ backgroundColor: colors.bg }}
      >
        <View className="flex-1">
          <Text className="text-xs" style={{ color: colors.subtext }}>
            {sutta.sutta_id} • {sutta.nikaya}
          </Text>
          <Text className="font-semibold" style={{ color: colors.text }} numberOfLines={1}>
            {sutta.title_thai}
          </Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity className="p-2" onPress={() => setShowSettings(true)}>
            <Settings size={22} color={colors.subtext} />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <Volume2 size={22} color={colors.subtext} />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <Bookmark size={22} color={colors.subtext} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {/* Title */}
        <View className="mb-6 pt-4">
          <Text 
            className="text-2xl font-bold mb-2"
            style={{ color: colors.text }}
          >
            {sutta.title_thai}
          </Text>
          {sutta.title_pali && (
            <Text 
              className="text-base italic"
              style={{ color: colors.subtext }}
            >
              {sutta.title_pali}
            </Text>
          )}
          {sutta.vagga && (
            <Text 
              className="text-sm mt-2"
              style={{ color: colors.accent }}
            >
              {sutta.vagga}
            </Text>
          )}
        </View>

        {/* Content */}
        <Text
          className="leading-relaxed"
          style={{
            color: colors.text,
            fontSize: settings.fontSize,
            lineHeight: settings.fontSize * settings.lineHeight,
            fontFamily: settings.fontFamily === 'serif' ? 'NotoSerifThai' : 'NotoSansThai',
            textAlign: settings.textAlign,
          }}
        >
          {sutta.content_thai}
        </Text>

        {/* Bottom padding */}
        <View className="h-16" />
      </ScrollView>

      {/* Settings Modal */}
      <ReaderSettingsModal 
        visible={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </View>
  );
}

// Export with Suspense wrapper
export default function ReaderScreenWrapper() {
  return (
    <Suspense
      fallback={
        <View className="flex-1 items-center justify-center bg-white">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      }
    >
      <ReaderScreen />
    </Suspense>
  );
}
