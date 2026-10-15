import {
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  useFonts as useFraunces,
} from '@expo-google-fonts/fraunces';
import {
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
  InterTight_700Bold,
  useFonts as useInterTight,
} from '@expo-google-fonts/inter-tight';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { useStore } from '@/store/inspections';
import { C } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [frauncesLoaded] = useFraunces({ Fraunces_400Regular_Italic, Fraunces_600SemiBold, Fraunces_700Bold });
  const [interLoaded] = useInterTight({
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    InterTight_700Bold,
  });
  const hydrated = useStore((s) => s.hydrated);
  const ready = frauncesLoaded && interLoaded && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.paper } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" />
      </Stack>
    </>
  );
}
