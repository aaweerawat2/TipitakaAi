import React, { Suspense, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Search, ChevronRight } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';

interface SuttaItem {
  id: string;
  sutta_id: string;
  title_thai: string;
  title_pali?: string;
  nikaya: string;
}

// Mock data
const mockSuttas: SuttaItem[] = [
  { id: 'mn1', sutta_id: 'MN 1', title_thai: 'มูลปริยายสูตร', title_pali: 'Mūlapariyāya', nikaya: 'มัชฌิมนิกาย' },
  { id: 'mn2', sutta_id: 'MN 2', title_thai: 'สพพาสวสูตร', title_pali: 'Sabbāsava', nikaya: 'มัชฌิมนิกาย' },
  { id: 'mn3', sutta_id: 'MN 3', title_thai: 'ธัมมสังคาณีสูตร', title_pali: 'Dhammasaṅgaṇī', nikaya: 'มัชฌิมนิกาย' },
  { id: 'mn4', sutta_id: 'MN 4', title_thai: 'ภยเภรวสูตร', title_pali: 'Bhayabherava', nikaya: 'มัชฌิมนิกาย' },
  { id: 'mn5', sutta_id: 'MN 5', title_thai: 'อนังคณสูตร', title_pali: 'Anaṅgaṇa', nikaya: 'มัชฌิมนิกาย' },
  { id: 'mn10', sutta_id: 'MN 10', title_thai: 'สติปัฏฐานสูตร', title_pali: 'Satipaṭṭhāna', nikaya: 'มัชฌิมนิกาย' },
];

function SuttaListScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { nikaya } = (route.params as any) || {};
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suttas] = useState(mockSuttas);
  
  const theme = useAppStore((state) => state.settings.reader.theme);
  const colors = theme === 'dark'
    ? { bg: '#1C1917', text: '#FAFAF9', subtext: '#A8A29E', card: '#292524' }
    : { bg: '#FFFFFF', text: '#1C1917', subtext: '#78716C', card: '#F5F5F4' };

  const filteredSuttas = searchQuery
    ? suttas.filter((s) =>
        s.title_thai.includes(searchQuery) ||
        s.sutta_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : suttas;

  const renderSutta = ({ item }: { item: SuttaItem }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 rounded-xl mb-2"
      style={{ backgroundColor: colors.card }}
      onPress={() => (navigation as any).navigate('Reader', { suttaId: item.id })}
    >
      <View className="flex-1">
        <Text className="font-medium" style={{ color: colors.text }}>
          {item.sutta_id} • {item.title_thai}
        </Text>
        {item.title_pali && (
          <Text className="text-sm italic" style={{ color: colors.subtext }}>
            {item.title_pali}
          </Text>
        )}
      </View>
      <ChevronRight size={20} color={colors.subtext} />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.bg }}>
      {/* Search bar */}
      <View className="p-4">
        <View
          className="flex-row items-center px-4 py-3 rounded-xl"
          style={{ backgroundColor: colors.card }}
        >
          <Search size={20} color={colors.subtext} />
          <TextInput
            className="flex-1 ml-3 text-base"
            style={{ color: colors.text }}
            placeholder="ค้นหาพระสูตร..."
            placeholderTextColor={colors.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredSuttas}
        keyExtractor={(item) => item.id}
        renderItem={renderSutta}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        ListHeaderComponent={
          <Text className="text-sm mb-3" style={{ color: colors.subtext }}>
            {filteredSuttas.length} พระสูตร
          </Text>
        }
        ListEmptyComponent={
          <View className="items-center py-8">
            <Text style={{ color: colors.subtext }}>ไม่พบพระสูตร</Text>
          </View>
        }
      />
    </View>
  );
}

export default function SuttaListScreenWrapper() {
  return (
    <Suspense fallback={<View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#F97316" /></View>}>
      <SuttaListScreen />
    </Suspense>
  );
}
