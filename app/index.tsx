import React from 'react';
import { useRouter } from 'expo-router';
import { useSession } from '@/lib/auth-client';
import { LoadingScreen } from '@/src/features/auth/screens/LoadingScreen';

export default function HomeRoute() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const handleGetStarted = () => {
    router.replace('/register');
  };

  const handleLogin = () => {
    router.replace('/login');
  };

  // Let NavigationInterceptor handle auth redirects - keep this route simple
  console.log('HomeRoute: Showing loading screen, auth status:', { isPending, hasUser: !!session?.user });

  return (
    <LoadingScreen
      onGetStarted={handleGetStarted}
      onLogin={handleLogin}
    />
  );
}