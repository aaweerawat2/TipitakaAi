import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, BookOpen, MessageCircle, Settings } from 'lucide-react-native';

import { RootStackParamList, MainTabParamList } from '../types';
import { useAppStore } from '../store/useAppStore';

// Screens - lazy loaded
const HomeScreen = React.lazy(() => import('../screens/HomeScreen'));
const ReaderScreen = React.lazy(() => import('../screens/ReaderScreen'));
const AISearchScreen = React.lazy(() => import('../screens/AISearchScreen'));
const VoiceChatScreen = React.lazy(() => import('../screens/VoiceChatScreen'));
const SettingsScreen = React.lazy(() => import('../screens/SettingsScreen'));
const VoiceSettingsScreen = React.lazy(() => import('../screens/VoiceSettingsScreen'));
const DocumentManagerScreen = React.lazy(() => import('../screens/DocumentManagerScreen'));
const SuttaListScreen = React.lazy(() => import('../screens/SuttaListScreen'));

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab Navigator
function MainTabs() {
  const theme = useAppStore((state) => state.settings.reader.theme);
  const bgColor = theme === 'dark' ? '#1C1917' : '#FFFFFF';
  const textColor = theme === 'dark' ? '#FAFAF9' : '#1C1917';
  const inactiveColor = theme === 'dark' ? '#78716C' : '#A8A29E';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopColor: theme === 'dark' ? '#292524' : '#E7E5E4',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarIcon: ({ color, size }) => {
          let Icon: React.ComponentType<{ color: string; size: number }>;
          
          switch (route.name) {
            case 'HomeTab':
              Icon = Home;
              break;
            case 'ReaderTab':
              Icon = BookOpen;
              break;
            case 'AISearchTab':
              Icon = MessageCircle;
              break;
            default:
              Icon = Settings;
          }
          
          return <Icon color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ tabBarLabel: 'หน้าแรก' }}
      />
      <Tab.Screen
        name="ReaderTab"
        component={SuttaListScreen}
        options={{ tabBarLabel: 'อ่าน' }}
      />
      <Tab.Screen
        name="AISearchTab"
        component={AISearchScreen}
        options={{ tabBarLabel: 'ถาม AI' }}
      />
    </Tab.Navigator>
  );
}

// Main Stack Navigator
function AppNavigator() {
  const theme = useAppStore((state) => state.settings.reader.theme);
  const bgColor = theme === 'dark' ? '#1C1917' : '#FFFFFF';
  const textColor = theme === 'dark' ? '#FAFAF9' : '#1C1917';

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: bgColor },
          headerTintColor: textColor,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: bgColor },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Home"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Reader"
          component={ReaderScreen}
          options={({ route }) => ({ 
            title: route.params?.suttaId || 'อ่านพระสูตร',
            headerBackTitle: 'กลับ',
          })}
        />
        <Stack.Screen
          name="AISearch"
          component={AISearchScreen}
          options={{ title: 'ถาม-ตอบกับ AI' }}
        />
        <Stack.Screen
          name="VoiceChat"
          component={VoiceChatScreen}
          options={{ title: 'คุยด้วยเสียง' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'ตั้งค่า' }}
        />
        <Stack.Screen
          name="VoiceSettings"
          component={VoiceSettingsScreen}
          options={{ title: 'ตั้งค่าเสียง' }}
        />
        <Stack.Screen
          name="DocumentManager"
          component={DocumentManagerScreen}
          options={{ title: 'จัดการเอกสาร' }}
        />
        <Stack.Screen
          name="SuttaList"
          component={SuttaListScreen}
          options={({ route }) => ({ 
            title: route.params?.nikaya || 'รายการพระสูตร',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
