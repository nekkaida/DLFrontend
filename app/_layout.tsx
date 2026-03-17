import { useColorScheme } from '@/hooks/useColorScheme';
import { authClient, useSession } from '@/lib/auth-client';
import { socketService } from '@/lib/socket-service';
import { useChatStore } from '@/src/features/chat/stores/ChatStore';
import { NavigationInterceptor } from '@core/navigation/NavigationInterceptor';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { Toaster } from 'sonner-native';
import { usePushNotifications } from '@/src/hooks/usePushNotifications';
import { configureGoogleSignIn } from '@/lib/google-signin';
import { ErrorBoundary } from '@shared/components/layout';
import { reportRenderError, reportJSError } from '@/src/services/crashReporter';
import { ErrorUtils } from 'react-native';

// Configure Google Sign-In at app startup
configureGoogleSignIn();

// Clean up any stale OAuth sessions from previous app launches
// This MUST be called before any OAuth flow to prevent invalid state errors
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { data: session } = useSession();
  // Font loading disabled - SpaceMono not used in the app
  // If you need custom fonts, add them to app.json under expo.fonts instead
  const loaded = true;

  // Initialize push notifications (auto-registers when user is authenticated)
  usePushNotifications();

  // Initialize socket connection and load threads when user is authenticated
  useEffect(() => {
    let cancelled = false;

    const initSocket = async () => {
      if (session?.user?.id) {
        console.log('🔌 RootLayout: User authenticated, initializing socket connection...');

        // Small delay to ensure session cookie is fully synced to SecureStore
        // This prevents race conditions during initial auth flow (e.g., after email verification)
        await new Promise(resolve => setTimeout(resolve, 300));

        if (cancelled) return;

        // Verify the session cookie is available before attempting socket connection
        const cookies = authClient.getCookie();
        if (!cookies) {
          console.log('⚠️ RootLayout: Session cookie not yet available, deferring socket connection');
          return;
        }

        try {
          await socketService.connect();
          if (cancelled) return;
          console.log('✅ RootLayout: Socket connection initialized');

          // Load threads early so useChatSocketEvents can join rooms
          // This ensures real-time updates work from app startup
          const { loadThreads } = useChatStore.getState();
          await loadThreads(session.user.id);
          console.log('✅ RootLayout: Threads loaded for real-time updates');
        } catch (error) {
          // Socket connection failures are non-fatal - app can work without real-time updates
          console.error('❌ RootLayout: Failed to initialize socket:', error);
        }
      } else {
        console.log('👤 RootLayout: No user session, skipping socket initialization');
      }
    };

    initSocket();

    // Cleanup on unmount
    return () => {
      cancelled = true;
      if (session?.user?.id) {
        console.log('🔌 RootLayout: Disconnecting socket on unmount');
        socketService.disconnect();
      }
    };
  }, [session?.user?.id]);

  // Set up global JS error handler for crash reporting
  useEffect(() => {
    if (!__DEV__) {
      const defaultHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
        reportJSError(error, isFatal ?? false);
        defaultHandler(error, isFatal);
      });
    }
  }, []);

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
        <BottomSheetModalProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <ErrorBoundary onError={reportRenderError}>
            <NavigationInterceptor>
            <Stack
            screenOptions={{
              gestureEnabled: true,
              headerShown: false,
              presentation: 'card',
            }}
          >
        <Stack.Screen 
          name="index" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="dev" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="register" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="resetPassword" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="verifyEmail" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
          }} 
        />
        <Stack.Screen 
          name="user-dashboard" 
          options={{ 
            headerShown: false,
            gestureEnabled: false,
            animation: 'none',
          }} 
        />
        <Stack.Screen 
          name="profile" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="edit-profile" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            headerShown: false,
            gestureEnabled: true,
          }} 
        />
        <Stack.Screen
          name="match-history"
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="chat/new-message"
          options={{
            presentation: 'modal',
            headerShown: false,
            gestureEnabled: true,
            animation: 'slide_from_bottom',
          }}
        />
        </Stack>
            </NavigationInterceptor>
            </ErrorBoundary>
            <StatusBar style="auto" />
            <Toaster />
          </ThemeProvider>
        </BottomSheetModalProvider>
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}