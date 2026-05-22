import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { isOnboarded, saveProfile, DEMO_PROFILE } from '../../lib/store';
import MuAIlimLogo from '../../components/MuAIlimLogo';

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
        <MuAIlimLogo size="large" />
        <ActivityIndicator size="large" color={C.green} style={{ marginTop: 32 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoArea}>
        <MuAIlimLogo size="large" />
        <Text style={styles.slogan}>Test emas, rivojlanish!</Text>
        <Text style={styles.tagline}>DTM, Attestat va Milliy sertifikat imtihonlariga{'\n'}AI yordamida samarali tayyorlan</Text>
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
          { icon: '🎯', text: 'Zaif mavzularingizni aniq topadi' },
          { icon: '🤖', text: 'Har bir xatoni AI bilan tushuntiradi' },
          { icon: '📈', text: "Haqiqiy ball oralig'ini bashorat qiladi" },
          { icon: '🔥', text: "Streak tizimi bilan o'qishni odatga aylantiradi" },
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
          <Text style={styles.demoBtnText}>🎓 O'quvchi rejimida ko'rish (Jasur, DTM)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoBtn}
          onPress={async () => {
            await saveProfile({
              user_id: 'demo_teacher',
              display_name: 'Abdullayev S.',
              exam_type: 'teacher',
              subjects: ['math'],
              goal_score: 100,
              exam_date: '2026-09-01',
              streak: 0,
              is_premium: false,
              grade_levels: ['5-9', '10-11'],
            });
            router.replace('/(teacher)');
          }}
        >
          <Text style={styles.demoBtnText}>👨‍🏫 O'qituvchi rejimida ko'rish (Matematika)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 24, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginTop: 60, gap: 8 },
  slogan: { fontSize: 16, fontWeight: '700', color: '#7C3AED', letterSpacing: 0.2 },
  tagline: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: 2 },
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
