import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Book, Search, Mic, Settings, Download } from 'lucide-react-native';

// Types
type RootStackParamList = {
  MainTabs: undefined;
  SuttaDetail: { id: string; title: string };
  ModelDownload: undefined;
};

type TabParamList = {
  Home: undefined;
  Search: undefined;
  Voice: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Home Screen
const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const categories = [
    { id: '1', name: 'พระวินัยปิฎก', count: 218, color: '#EF4444' },
    { id: '2', name: 'พระสุตตันตปิฎก', count: 12453, color: '#3B82F6' },
    { id: '3', name: 'พระอภิธรรมปิฎก', count: 7, color: '#10B981' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>พระไตรปิฎก AI</Text>
          <Text style={styles.subtitle}>อ่านพระไตรปิฎกภาษาไทย พร้อม AI ถาม-ตอบ</Text>
        </View>

        {/* Daily Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "ไม่มีบุคคลใดที่ไม่สามารถบรรลุธรรมได้ หากมีความเพียรพยายามอย่างแท้จริง"
          </Text>
          <Text style={styles.quoteSource}>— พระพุทธเจ้า</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>เมนูหลัก</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Search')}
            >
              <Search size={28} color="#3B82F6" />
              <Text style={styles.actionText}>ถาม AI</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Voice')}
            >
              <Mic size={28} color="#10B981" />
              <Text style={styles.actionText}>สนทนาเสียง</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('ModelDownload')}
            >
              <Download size={28} color="#F59E0B" />
              <Text style={styles.actionText}>ดาวน์โหลด AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>หมวดหมู่พระไตรปิฎก</Text>
          {categories.map((category) => (
            <TouchableOpacity key={category.id} style={styles.categoryCard}>
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]} />
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryCount}>{category.count} เรื่อง</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Search Screen
const SearchScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContent}>
        <Search size={48} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>ถาม AI</Text>
        <Text style={styles.emptySubtitle}>
          ดาวน์โหลด AI Models ก่อนเพื่อใช้งาน
        </Text>
      </View>
    </SafeAreaView>
  );
};

// Voice Screen
const VoiceScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContent}>
        <Mic size={48} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>สนทนาเสียง</Text>
        <Text style={styles.emptySubtitle}>
          สนทนากับ AI ด้วยเสียง พร้อมอ่านคำตอบ
        </Text>
      </View>
    </SafeAreaView>
  );
};

// Settings Screen
const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>การตั้งค่า</Text>
        
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('ModelDownload')}
        >
          <Download size={24} color="#3B82F6" />
          <View style={styles.settingInfo}>
            <Text style={styles.settingName}>AI Models</Text>
            <Text style={styles.settingDesc}>ดาวน์โหลด AI models สำหรับใช้งาน offline</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Model Download Screen (simplified)
const ModelDownloadScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContent}>
        <Download size={48} color="#3B82F6" />
        <Text style={styles.emptyTitle}>AI Models</Text>
        <Text style={styles.emptySubtitle}>
          ดาวน์โหลด AI models เพื่อใช้งาน offline
        </Text>
        <Text style={styles.modelInfo}>
          • Llama 3.2 1B Thai (620 MB){'\n'}
          • Whisper Thai ASR (244 MB){'\n'}
          • Thai TTS (50 MB){'\n'}
          • QNN Runtime (30 MB)
        </Text>
      </View>
    </SafeAreaView>
  );
};

// Tab Navigator
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Book size={24} color={color} />,
          tabBarLabel: 'หน้าหลัก',
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
          tabBarLabel: 'ถาม AI',
        }}
      />
      <Tab.Screen 
        name="Voice" 
        component={VoiceScreen}
        options={{
          tabBarIcon: ({ color }) => <Mic size={24} color={color} />,
          tabBarLabel: 'เสียง',
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
          tabBarLabel: 'ตั้งค่า',
        }}
      />
    </Tab.Navigator>
  );
};

// Main App
const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen 
          name="ModelDownload" 
          component={ModelDownloadScreen}
          options={{ headerShown: true, title: 'ดาวน์โหลด AI Models' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  quoteCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  quoteText: {
    fontSize: 16,
    color: '#1E40AF',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  quoteSource: {
    fontSize: 14,
    color: '#3B82F6',
    marginTop: 8,
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  categoryInfo: {
    marginLeft: 12,
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  categoryCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  modelInfo: {
    fontSize: 14,
    color: '#374151',
    marginTop: 24,
    lineHeight: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingInfo: {
    marginLeft: 12,
    flex: 1,
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  settingDesc: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default App;
