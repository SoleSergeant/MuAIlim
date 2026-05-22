import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { C } from '../../constants/colors';
import { getProfile } from '../../lib/store';
import { UserProfile, SUBJECT_LABELS, Subject } from '../../lib/types';

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const DEMO_CODE = 'MUA-2026';

interface ClassStats {
  total_students: number;
  avg_score_pct: number;
  top_student: { name: string; score_pct: number } | null;
  common_weak_topic: string | null;
  struggling_count: number;
  mock_count_avg: number;
}

export default function TeacherDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ClassStats | null>(null);
  const [loading, setLoading] = useState(true);
  const classCode = DEMO_CODE;

  const FALLBACK_STATS: ClassStats = {
    total_students: 5,
    avg_score_pct: 71,
    top_student: { name: 'Malika Toshmatova', score_pct: 88 },
    common_weak_topic: 'Logarifm',
    struggling_count: 1,
    mock_count_avg: 4,
  };

  useEffect(() => {
    getProfile().then(setProfile);
    fetch(`${API}/api/teacher/class/${classCode}/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => setStats(FALLBACK_STATS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>O'qituvchi paneli 👨‍🏫</Text>
          <Text style={styles.name}>{profile?.display_name ?? "O'qituvchi"}</Text>
          <Text style={styles.subject}>{SUBJECT_LABELS[profile?.subjects?.[0] as Subject] ?? ''}</Text>
        </View>
      </View>

      {/* Class code card */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>SINF KODI</Text>
        <Text style={styles.codeValue}>{classCode}</Text>
        <Text style={styles.codeHint}>O'quvchilar bu kodni kiritib sinfingizga qo'shiladi</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 32, gap: 16 }}>
        {loading ? (
          <ActivityIndicator color={C.green} style={{ marginTop: 40 }} />
        ) : stats ? (
          <>
            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <StatCard icon="👥" label="O'quvchilar" value={`${stats.total_students} ta`} />
              <StatCard icon="📊" label="O'rtacha ball" value={`${stats.avg_score_pct}%`}
                color={stats.avg_score_pct >= 70 ? C.green : stats.avg_score_pct >= 50 ? C.orange : C.red} />
              <StatCard icon="⚠️" label="Qiyinalayotgan" value={`${stats.struggling_count} ta`}
                color={stats.struggling_count > 0 ? C.red : C.green} />
              <StatCard icon="📝" label="Mock o'rt." value={`${stats.mock_count_avg} ta`} />
            </View>

            {/* Top student */}
            {stats.top_student && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>ENG YAXSHI O'QUVCHI</Text>
                <View style={styles.topCard}>
                  <Text style={styles.trophy}>🏆</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topName}>{stats.top_student.name}</Text>
                    <Text style={styles.topScore}>{stats.top_student.score_pct}% o'rtacha natija</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Common weak topic */}
            {stats.common_weak_topic && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>SINFDAGI UMUMIY ZAIF MAVZU</Text>
                <View style={styles.weakCard}>
                  <Text style={styles.weakIcon}>⚠️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.weakTopic}>{stats.common_weak_topic}</Text>
                    <Text style={styles.weakHint}>Ko'p o'quvchi bu mavzuda qiynalyapti</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Grade levels */}
            {profile?.grade_levels && profile.grade_levels.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>DARS BERADIGAN SINFLAR</Text>
                <View style={styles.gradesRow}>
                  {profile.grade_levels.map(g => (
                    <View key={g} style={styles.gradeBadge}>
                      <Text style={styles.gradeText}>{g}-sinf</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.emptyText}>Ma'lumot yuklanmadi</Text>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  greeting: { fontSize: 13, color: C.textSecondary, marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '700', color: C.text },
  subject: { fontSize: 13, color: C.green, fontWeight: '500', marginTop: 2 },
  codeCard: {
    marginHorizontal: 20, marginTop: 16, backgroundColor: C.green,
    borderRadius: 16, padding: 20, alignItems: 'center',
  },
  codeLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 6 },
  codeValue: { fontSize: 36, fontWeight: '800', color: C.white, letterSpacing: 4, marginBottom: 6 },
  codeHint: { fontSize: 12, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  body: { flex: 1, paddingHorizontal: 20, marginTop: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%', backgroundColor: C.bgSecondary, borderRadius: 14,
    padding: 16, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', gap: 4,
  },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: 22, fontWeight: '700', color: C.text },
  statLabel: { fontSize: 12, color: C.textSecondary, textAlign: 'center' },
  section: { gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: C.textTertiary, letterSpacing: 0.5 },
  topCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.greenLight,
    borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: C.greenBorder,
  },
  trophy: { fontSize: 32 },
  topName: { fontSize: 16, fontWeight: '600', color: C.text },
  topScore: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  weakCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFF8E1', borderRadius: 14, padding: 16,
    borderWidth: 0.5, borderColor: '#FFE082',
  },
  weakIcon: { fontSize: 28 },
  weakTopic: { fontSize: 15, fontWeight: '600', color: C.text },
  weakHint: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  gradesRow: { flexDirection: 'row', gap: 8 },
  gradeBadge: {
    backgroundColor: C.greenLight, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 0.5, borderColor: C.greenBorder,
  },
  gradeText: { fontSize: 13, color: C.greenDark, fontWeight: '500' },
  emptyText: { textAlign: 'center', color: C.textSecondary, marginTop: 40 },
});
