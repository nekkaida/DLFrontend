import { Stack } from 'expo-router';
import { DashboardProvider } from '@features/dashboard-user';

export default function DashboardLayout() {
  return (
    <DashboardProvider>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          gestureEnabled: false,
          animation: 'none',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="pickleball" />
        <Stack.Screen name="tennis" />
        <Stack.Screen name="category" options={{ title: 'League Category' }} />
        <Stack.Screen name="seasons" options={{ title: 'Seasons' }} />
        <Stack.Screen
          name="friend-list"
          options={{
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
      </Stack>
    </DashboardProvider>
  );
}



