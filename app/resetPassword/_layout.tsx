import { Stack } from 'expo-router';

export default function ResetPasswordLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'default',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="password" />
    </Stack>
  );
}
