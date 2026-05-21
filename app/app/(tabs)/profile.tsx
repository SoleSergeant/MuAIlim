import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { getProfile, clearProfile } from '../../lib/store';
import { UserProfile, SUBJECT_LABELS, EXAM_TYPE_LABELS } from '../../lib/types';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getProfile().then(setProfile);
  }, []);

  const handleLogout = async () => {
    await clearProfile();
    router.replace('/(auth)');
  };

  if (!profile) return <View style={s.center}><Text>Yuklanmoqda...</Text></View>;

  const daysUntil = profile.exam_date
    ? Math.max(0, Math.ceil((new Date(profile.exam_date).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Avatar & name */}
      <View style={s.hero}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{profile.display_name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.name}>{profile.display_name}</Text>
        <Text style={s.examLabel}>{EXAM_TYPE_LABELS[profile.exam_type]}</Text>
        <View style={s.streakRow}>
          <Text style={s.streakEmoji}>🔥</Text>
          <Text style={s.streakText}>{profile.streak} kunlik seriya</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statValue}>{profile.goal_score}</Text>
          <Text style={s.statLabel}>Maqsad ball</Text>
        </View>
        <View style={[s.statBox, s.statBorder]}>
          <Text style={s.statValue}>{daysUntil ?? '—'}</Text>
          <Text style={s.statLabel}>Kun qoldi</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statValue}>{profile.streak}</Text>
          <Text style={s.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Subjects */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>FANLAR</Text>
        <View style={s.card}>
          {profile.subjects.map((sub, i) => (
            <View key={sub} style={[s.subjectRow, i < profile.subjects.length - 1 && s.subjectBorder]}>
              <Text style={s.subjectDot}>●</Text>
              <Text style={s.subjectName}>{SUBJECT_LABELS[sub]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Exam info */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>IMTIHON MA'LUMOTLARI</Text>
        <View style={s.card}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Imtihon turi</Text>
            <Text style={s.infoValue}>{EXAM_TYPE_LABELS[profile.exam_type]}</Text>
          </View>
          {profile.exam_date && (
            <View style={[s.infoRow, s.infoRowBorder]}>
              <Text style={s.infoLabel}>Imtihon sanasi</Text>
              <Text style={s.infoValue}>{new Date(profile.exam_date).toLocaleDateString('uz-UZ')}</Text>
            </View>
          )}
          <View style={[s.infoRow, s.infoRowBorder]}>
            <Text style={s.infoLabel}>Maqsad</Text>
            <Text style={s.infoValue}>{profile.goal_score} ball</Text>
          </View>
        </View>
      </View>

      {/* Mock stats info */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>MOCK IMTIHON</Text>
        <View style={s.card}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Savollar soni</Text>
            <Text style={s.infoValue}>90 ta</Text>
          </View>
          <View style={[s.infoRow, s.infoRowBorder]}>
            <Text style={s.infoLabel}>Har bir fan</Text>
            <Text style={s.infoValue}>30 ta</Text>
          </View>
          <View style={[s.infoRow, s.infoRowBorder]}>
            <Text style={s.infoLabel}>Vaqt</Text>
            <Text style={s.infoValue}>90 daqiqa</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={s.section}>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', paddingTop: 64, paddingBottom: 28, paddingHorizontal: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 34, fontWeight: '700', color: C.white },
  name: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  examLabel: { fontSize: 14, color: C.textSecondary, marginBottom: 10 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF3E0', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100 },
  streakEmoji: { fontSize: 16 },
  streakText: { fontSize: 14, fontWeight: '600', color: C.orange },

  statsRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 24, backgroundColor: C.bgSecondary, borderRadius: 16, borderWidth: 0.5, borderColor: C.border },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statBorder: { borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: C.border },
  statValue: { fontSize: 22, fontWeight: '800', color: C.green, marginBottom: 2 },
  statLabel: { fontSize: 11, color: C.textSecondary },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: C.textTertiary, letterSpacing: 0.08, marginBottom: 10 },
  card: { backgroundColor: C.bgSecondary, borderRadius: 14, borderWidth: 0.5, borderColor: C.border, overflow: 'hidden' },

  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13 },
  subjectBorder: { borderBottomWidth: 0.5, borderColor: C.border },
  subjectDot: { fontSize: 10, color: C.green },
  subjectName: { fontSize: 15, color: C.text },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  infoRowBorder: { borderTopWidth: 0.5, borderColor: C.border },
  infoLabel: { fontSize: 14, color: C.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.text },

  logoutBtn: { borderWidth: 1, borderColor: C.red, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  logoutText: { fontSize: 15, fontWeight: '600', color: C.red },
});
