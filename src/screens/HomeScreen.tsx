import React, { Suspense, useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BookOpen, MessageCircle, Mic, Clock, ChevronRight } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { useHistoryStore, useRecentReading } from '../store/useHistoryStore';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Daily quote component
function DailyQuote() {
  const theme = useAppStore((state) => state.settings.reader.theme);
  
  // Sample Buddhist quotes (would come from database in production)
  const quotes = [
    {
      pali: 'Sabba pāpassa akaraṇaṃ, kusalassa upasampadā.',
      thai: 'การไม่ทำความชั่วทั้งปวง เป็นการทำความดีให้ถึงพร้อม',
      source: 'ธรรมบท ๑๘๓',
    },
    {
      pali: 'Appamādo amatapadaṃ, pamādo maccuno padaṃ.',
      thai: 'ความไม่ประมาท เป็นทางแห่งอมตะ ความประมาท เป็นทางแห่งมัจจุ',
      source: 'ธรรมบท ๒๑',
    },
    {
      pali: 'Yo ca vassasataṃ jīve, apassaṃ dhammamm uttamaṃ.',
      thai: 'ผู้ใดเห็นธรรมอันสูงสุด ผู้นั้นเป็นผู้มีชีวิตอยู่ร้อยปี',
      source: 'ธรรมบท ๑๑๕',
    },
  ];
  
  // Get quote based on day
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const quote = quotes[dayOfYear % quotes.length];
  
  const bgColor = theme === 'dark' ? '#292524' : '#FEF3C7';
  const textColor = theme === 'dark' ? '#FAFAF9' : '#1C1917';
  const accentColor = theme === 'dark' ? '#FBBF24' : '#D97706';

  return (
    <View className="p-4 rounded-2xl mb-4" style={{ backgroundColor: bgColor }}>
      <Text className="text-sm font-medium mb-2" style={{ color: accentColor }}>
        📜 พุทธวจนะประจำวัน
      </Text>
      <Text className="text-lg font-serif leading-relaxed mb-2" style={{ color: textColor }}>
        {quote.thai}
      </Text>
      <Text className="text-sm italic mb-1" style={{ color: accentColor }}>
        {quote.pali}
      </Text>
      <Text className="text-xs text-right" style={{ color: theme === 'dark' ? '#78716C' : '#92400E' }}>
        — {quote.source}
      </Text>
    </View>
  );
}

// Quick action buttons
function QuickActions() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useAppStore((state) => state.settings.reader.theme);
  
  const actions = [
    { icon: BookOpen, label: 'อ่านพระสูตร', route: 'SuttaList' as const, color: '#3B82F6' },
    { icon: MessageCircle, label: 'ถาม AI', route: 'AISearch' as const, color: '#10B981' },
    { icon: Mic, label: 'คุยด้วยเสียง', route: 'VoiceChat' as const, color: '#F97316' },
  ];
  
  const bgColor = theme === 'dark' ? '#292524' : '#F5F5F4';

  return (
    <View className="flex-row justify-between mb-6">
      {actions.map((action) => (
        <TouchableOpacity
          key={action.route}
          onPress={() => navigation.navigate(action.route)}
          className="flex-1 mx-1 p-4 rounded-xl items-center"
          style={{ backgroundColor: bgColor }}
        >
          <View 
            className="w-12 h-12 rounded-full items-center justify-center mb-2"
            style={{ backgroundColor: action.color + '20' }}
          >
            <action.icon size={24} color={action.color} />
          </View>
          <Text 
            className="text-sm font-medium text-center"
            style={{ color: theme === 'dark' ? '#FAFAF9' : '#1C1917' }}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Recent reading section
function RecentReading() {
  const navigation = useNavigation<NavigationProp>();
  const recentReads = useRecentReading(5);
  const theme = useAppStore((state) => state.settings.reader.theme);
  
  if (recentReads.length === 0) return null;
  
  const bgColor = theme === 'dark' ? '#292524' : '#F5F5F4';
  const textColor = theme === 'dark' ? '#FAFAF9' : '#1C1917';
  const subtextColor = theme === 'dark' ? '#A8A29E' : '#78716C';

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <Clock size={18} color={theme === 'dark' ? '#78716C' : '#A8A29E'} />
          <Text className="text-base font-semibold ml-2" style={{ color: textColor }}>
            อ่านล่าสุด
          </Text>
        </View>
        <TouchableOpacity>
          <Text className="text-sm" style={{ color: '#F97316' }}>ดูทั้งหมด</Text>
        </TouchableOpacity>
      </View>
      
      {recentReads.map((item) => (
        <TouchableOpacity
          key={item.suttaId}
          onPress={() => navigation.navigate('Reader', { suttaId: item.suttaId })}
          className="flex-row items-center p-3 rounded-xl mb-2"
          style={{ backgroundColor: bgColor }}
        >
          <View className="flex-1">
            <Text className="font-medium" style={{ color: textColor }}>
              {item.title}
            </Text>
            <Text className="text-sm" style={{ color: subtextColor }}>
              {Math.round(item.progress)}% อ่านแล้ว
            </Text>
          </View>
          <ChevronRight size={20} color={subtextColor} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Categories section
function Categories() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useAppStore((state) => state.settings.reader.theme);
  
  const categories = [
    { name: 'ทีฆนิกาย', count: 34, nikaya: 'dn' },
    { name: 'มัชฌิมนิกาย', count: 152, nikaya: 'mn' },
    { name: 'สังยุตตนิกาย', count: 2875, nikaya: 'sn' },
    { name: 'อังคุตตรนิกาย', count: 9550, nikaya: 'an' },
    { name: 'ขุททกนิกาย', count: 15, nikaya: 'kn' },
  ];
  
  const bgColor = theme === 'dark' ? '#292524' : '#F5F5F4';
  const textColor = theme === 'dark' ? '#FAFAF9' : '#1C1917';
  const subtextColor = theme === 'dark' ? '#78716C' : '#A8A29E';

  return (
    <View className="mb-6">
      <Text className="text-base font-semibold mb-3" style={{ color: textColor }}>
        📚 หมวดหมู่
      </Text>
      
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.nikaya}
          onPress={() => navigation.navigate('SuttaList', { nikaya: cat.name })}
          className="flex-row items-center justify-between p-4 rounded-xl mb-2"
          style={{ backgroundColor: bgColor }}
        >
          <View>
            <Text className="font-medium" style={{ color: textColor }}>
              {cat.name}
            </Text>
            <Text className="text-sm" style={{ color: subtextColor }}>
              {cat.count.toLocaleString()} พระสูตร
            </Text>
          </View>
          <ChevronRight size={20} color={subtextColor} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Main Home Screen
function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const theme = useAppStore((state) => state.settings.reader.theme);
  
  const bgColor = theme === 'dark' ? '#1C1917' : '#FFFFFF';
  const textColor = theme === 'dark' ? '#FAFAF9' : '#1C1917';

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh data
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1 p-4"
      style={{ backgroundColor: bgColor }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="mb-4">
        <Text className="text-2xl font-bold" style={{ color: textColor }}>
          🙏 สวัสดี
        </Text>
        <Text className="text-base" style={{ color: theme === 'dark' ? '#A8A29E' : '#78716C' }}>
          วันนี้ต้องการศึกษาอะไร?
        </Text>
      </View>

      {/* Daily Quote */}
      <DailyQuote />

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Reading */}
      <RecentReading />

      {/* Categories */}
      <Categories />

      {/* Bottom padding */}
      <View className="h-8" />
    </ScrollView>
  );
}

// Export with Suspense wrapper
export default function HomeScreenWrapper() {
  return (
    <Suspense
      fallback={
        <View className="flex-1 items-center justify-center bg-white dark:bg-stone-900">
          <ActivityIndicator size="large" color="#F97316" />
        </View>
      }
    >
      <HomeScreen />
    </Suspense>
  );
}
