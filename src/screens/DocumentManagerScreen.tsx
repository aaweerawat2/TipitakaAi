import React, { Suspense } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FileUp, File, Trash2 } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';

function DocumentManagerScreen() {
  const theme = useAppStore((state) => state.settings.reader.theme);
  
  const colors = theme === 'dark'
    ? { bg: '#1C1917', text: '#FAFAF9', subtext: '#A8A29E', card: '#292524' }
    : { bg: '#FFFFFF', text: '#1C1917', subtext: '#78716C', card: '#F5F5F4' };

  // Mock documents
  const documents = [
    { id: '1', name: 'หลักสูตรการปฏิบัติธรรม.pdf', chunks: 45, date: '2024-01-15' },
    { id: '2', name: 'ประวัติพระสาวก.txt', chunks: 23, date: '2024-01-10' },
  ];

  return (
    <ScrollView className="flex-1" style={{ backgroundColor: colors.bg }}>
      <View className="p-4">
        <Text className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
          📁 เอกสารของฉัน
        </Text>

        {/* Import button */}
        <TouchableOpacity
          className="flex-row items-center justify-center p-4 rounded-xl mb-4"
          style={{ backgroundColor: '#F97316' }}
        >
          <FileUp size={24} color="white" />
          <Text className="text-white font-medium ml-2">เพิ่มเอกสาร</Text>
        </TouchableOpacity>

        {/* Document list */}
        {documents.length === 0 ? (
          <View className="items-center py-8">
            <File size={48} color={colors.subtext} />
            <Text className="mt-4" style={{ color: colors.subtext }}>
              ยังไม่มีเอกสาร
            </Text>
          </View>
        ) : (
          documents.map((doc) => (
            <View
              key={doc.id}
              className="flex-row items-center p-4 rounded-xl mb-2"
              style={{ backgroundColor: colors.card }}
            >
              <File size={24} color="#F97316" />
              <View className="flex-1 ml-3">
                <Text className="font-medium" style={{ color: colors.text }}>
                  {doc.name}
                </Text>
                <Text className="text-sm" style={{ color: colors.subtext }}>
                  {doc.chunks} ส่วน • {doc.date}
                </Text>
              </View>
              <TouchableOpacity className="p-2">
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Supported formats */}
        <View className="mt-6 p-4 rounded-xl" style={{ backgroundColor: colors.card }}>
          <Text className="font-medium mb-2" style={{ color: colors.text }}>
            รูปแบบที่รองรับ:
          </Text>
          <Text style={{ color: colors.subtext }}>
            PDF, TXT, DOCX, EPUB
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

export default function DocumentManagerScreenWrapper() {
  return (
    <Suspense fallback={<View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#F97316" /></View>}>
      <DocumentManagerScreen />
    </Suspense>
  );
}
