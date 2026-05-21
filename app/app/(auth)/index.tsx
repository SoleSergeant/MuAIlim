import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { isOnboarded, saveProfile, DEMO_PROFILE } from '../../lib/store';

export default function LoginScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isOnboarded().then((done) => {
      if (done) router.replace('/(tabs)');
      else setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.green} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <View style={styles.logoMark}>
          <Text style={styles.logoText}>م</Text>
        </View>
        <Text style={styles.appName}>MuAIlim</Text>
        <Text style={styles.tagline}>Kirish imtixoni, Attestat va Milliy sertifikat{'\n'}imtihonlariga AI bilan tayyorlan</Text>
      </View>

      <View style={styles.pillsRow}>
        {['Matematika', 'Tarix', 'Ona tili'].map((s) => (
          <View key={s} style={styles.pill}>
            <Text style={styles.pillText}>{s}</Text>
          </View>
        ))}
      </View>

      <View style={styles.features}>
        {[
          { icon: '🎯', text: 'Zaifliklaringni aniq topadi' },
          { icon: '🤖', text: 'AI bilan xatolaringni tushuntiradi' },
          { icon: '📈', text: 'Real ball bashorat qiladi' },
          { icon: '🔥', text: 'Streak bilan motivatsiya' },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(auth)/onboarding')}>
          <Text style={styles.primaryBtnText}>Boshlash →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoBtn}
          onPress={async () => {
            await saveProfile(DEMO_PROFILE);
            router.replace('/(tabs)');
          }}
        >
          <Text style={styles.demoBtnText}>Demo rejimda kirish (Jasur, 12-kun streak)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 24, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginTop: 60 },
  logoMark: {
    width: 64, height: 64, borderRadius: 18,
    backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  logoText: { color: C.white, fontSize: 28, fontWeight: '600' },
  appName: { fontSize: 32, fontWeight: '700', color: C.text, letterSpacing: -0.5, marginBottom: 8 },
  tagline: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
  pillsRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, backgroundColor: C.greenLight, borderWidth: 0.5, borderColor: C.greenBorder },
  pillText: { fontSize: 12, color: C.greenDark, fontWeight: '500' },
  features: { gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  featureIcon: { fontSize: 22, width: 30 },
  featureText: { fontSize: 15, color: C.text, flex: 1 },
  actions: { gap: 12, marginBottom: 40 },
  primaryBtn: {
    backgroundColor: C.green, paddingVertical: 16, borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  demoBtn: {
    paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary,
  },
  demoBtnText: { color: C.textSecondary, fontSize: 13 },
});
