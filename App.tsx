import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, I18nManager } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAppStore } from './src/store/useAppStore';

// Force RTL for Thai
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

// Lazy load navigation
const AppNavigator = React.lazy(() => import('./src/navigation/AppNavigator'));

function App(): React.JSX.Element {
  const [isReady, setIsReady] = useState(false);
  const firstLaunch = useAppStore((state) => state.settings.firstLaunch);
  const theme = useAppStore((state) => state.settings.reader.theme);

  useEffect(() => {
    // Initialize app
    const initialize = async () => {
      try {
        // TODO: Initialize database
        // TODO: Check model availability
        // TODO: Load user preferences
        
        // Simulate initialization
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        setIsReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsReady(true);
      }
    };

    initialize();
  }, []);

  // Theme-based background color
  const getBackgroundColor = () => {
    switch (theme) {
      case 'dark':
        return '#1C1917';
      case 'sepia':
        return '#F4ECD8';
      default:
        return '#FFFFFF';
    }
  };

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: getBackgroundColor(),
        }}
      >
        <ActivityIndicator size="large" color="#F97316" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={getBackgroundColor()}
        />
        <React.Suspense
          fallback={
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: getBackgroundColor(),
              }}
            >
              <ActivityIndicator size="large" color="#F97316" />
            </View>
          }
        >
          <AppNavigator />
        </React.Suspense>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
