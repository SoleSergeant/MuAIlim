import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { isOnboarded } from '../lib/store';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="mock" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="results" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="personalized" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </>
  );
}
