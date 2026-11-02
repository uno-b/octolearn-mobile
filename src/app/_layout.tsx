import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { iconFonts } from '@/components/Icon';
import { useHydrated, useProgressStore } from '@/store/progressStore';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = { anchor: '(tabs)' };

const noGesture = { gestureEnabled: false };

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    ...iconFonts,
  });
  const hydrated = useHydrated();
  const signedIn = useProgressStore((s) => s.user !== null);

  // A failed font load falls back to the system font rather than blocking the app.
  const ready = hydrated && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="lesson/[id]/index" />
          <Stack.Screen name="lesson/[id]/done" options={{ animation: 'fade', ...noGesture }} />
          <Stack.Screen
            name="quiz/[id]/index"
            options={{ animation: 'slide_from_bottom', ...noGesture }}
          />
          <Stack.Screen name="quiz/[id]/result" options={{ animation: 'fade', ...noGesture }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}
