import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { getProfile, clearProfile } from '../../lib/store';
import { UserProfile, SUBJECT_LABELS, Subject } from '../../lib/types';

const DEMO_CODE = 'MUA-2026';

export default function TeacherProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => { getProfile().then(setProfile); }, []);

  const handleLogout = () => {
    Alert.alert('Chiqish', 'Profilingizni o\'chirmoqchimisiz?', [
      { text: 'Bekor', style: 'cancel' },
      { text: 'Ha, chiqish', style: 'destructive', onPress: async () => {
        await clearProfile();
        router.replace('/(auth)');
      }},
    ]);
  };

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{profile.display_name[0]}</Text>
        </View>
        <Text style={styles.name}>{profile.display_name}</Text>
        <Text style={styles.role}>O'qituvchi</Text>
        <Text style={styles.subject}>{SUBJECT_LABELS[profile.subjects[0] as Subject]}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Row label="Fan" value={SUBJECT_LABELS[profile.subjects[0] as Subject]} />
          <Row label="Sinf kodi" value={DEMO_CODE} highlight />
          {profile.grade_levels && profile.grade_levels.length > 0 && (
            <Row label="Sinflar" value={profile.grade_levels.join(', ')} />
          )}
          <Row label="Imtihon sanasi" value={profile.exam_date} />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            📋 Sinf kodingiz: <Text style={styles.infoCode}>{DEMO_CODE}</Text>{'\n'}
            O'quvchilar bu kodni "Sinfga qo'shilish" bo'limidan kiritib sizning sinfingizga qo'shiladi.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    alignItems: 'center', paddingTop: 56, paddingBottom: 24,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: C.green,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: C.white },
  name: { fontSize: 22, fontWeight: '700', color: C.text },
  role: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  subject: { fontSize: 14, color: C.green, fontWeight: '600', marginTop: 4 },
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  card: {
    backgroundColor: C.bgSecondary, borderRadius: 16, borderWidth: 0.5,
    borderColor: C.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  rowLabel: { fontSize: 14, color: C.textSecondary },
  rowValue: { fontSize: 14, fontWeight: '500', color: C.text },
  rowValueHighlight: { color: C.green, fontWeight: '700', fontSize: 16, letterSpacing: 1 },
  infoCard: {
    backgroundColor: C.greenLight, borderRadius: 14, padding: 16,
    borderWidth: 0.5, borderColor: C.greenBorder,
  },
  infoText: { fontSize: 13, color: C.greenDark, lineHeight: 20 },
  infoCode: { fontWeight: '800', fontSize: 15 },
  logoutBtn: {
    paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 0.5, borderColor: C.border,
  },
  logoutText: { fontSize: 15, color: C.red },
});
