import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { getProfile, daysUntilExam } from '../../lib/store';
import { UserProfile, SUBJECT_LABELS } from '../../lib/types';
import { api } from '../../lib/api';

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [prediction, setPrediction] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const p = await getProfile();
    setProfile(p);
    setDaysLeft(daysUntilExam(p.exam_date));
    try {
      const pred = await api.predictScore(p.user_id, p.goal_score);
      setPrediction(pred);
    } catch { }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (!profile) return <View style={styles.center}><Text>Yuklanmoqda...</Text></View>;

  const readiness = prediction?.readiness_pct ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Salom, {profile.display_name} 👋</Text>
          <Text style={styles.subGreeting}>Bugun ham o'qiymizmi?</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNum}>{profile.streak}</Text>
        </View>
      </View>

      {/* Countdown */}
      <View style={styles.countdownCard}>
        <View style={styles.countdownLeft}>
          <Text style={styles.countdownDays}>{daysLeft}</Text>
          <Text style={styles.countdownLabel}>kun qoldi</Text>
        </View>
        <View style={styles.countdownRight}>
          <Text style={styles.countdownExam}>{profile.exam_type.toUpperCase()} ga</Text>
          <Text style={styles.countdownGoal}>Maqsad: {profile.goal_score} ball</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${readiness}%` }]} />
          </View>
          <Text style={styles.readinessText}>
            {prediction?.available ? `${readiness}% tayyor` : 'Tayyorlik hisoblash uchun 3 ta mock kerak'}
          </Text>
        </View>
      </View>

      {/* Today's task */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BUGUNGI VAZIFA</Text>
        <View style={styles.taskCard}>
          <View style={styles.taskIcon}><Text style={{ fontSize: 20 }}>📚</Text></View>
          <View style={styles.taskBody}>
            <Text style={styles.taskTitle}>
              {SUBJECT_LABELS[profile.subjects[0]]}: Zaif mavzularni ishlash
            </Text>
            <Text style={styles.taskSub}>15 ta savol · ~20 daqiqa</Text>
          </View>
          <TouchableOpacity
            style={styles.taskBtn}
            onPress={() => router.push('/personalized')}
          >
            <Text style={styles.taskBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TEZKOR HARAKATLAR</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionCard, styles.actionGreen]} onPress={() => router.push('/mock')}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionTitle}>Mock imtihon</Text>
            <Text style={styles.actionSub}>Barcha 3 fan</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, styles.actionBlue]} onPress={() => router.push('/personalized')}>
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionTitle}>Maqsadli test</Text>
            <Text style={styles.actionSub}>Zaif mavzular</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, styles.actionAmber]} onPress={() => router.push('/(tabs)/notebook')}>
            <Text style={styles.actionIcon}>📒</Text>
            <Text style={styles.actionTitle}>Xatolar daftari</Text>
            <Text style={styles.actionSub}>Takrorlash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, styles.actionPurple]} onPress={() => router.push('/(tabs)/leaderboard')}>
            <Text style={styles.actionIcon}>🏆</Text>
            <Text style={styles.actionTitle}>Reyting</Text>
            <Text style={styles.actionSub}>Do'stlar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Score prediction */}
      {prediction?.available && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BASHORAT</Text>
          <View style={styles.predictionCard}>
            <Text style={styles.predLabel}>Taxminiy ball</Text>
            <Text style={styles.predScore}>{prediction.predicted_range} / 200</Text>
            <Text style={styles.predSub}>
              Maqsadga {prediction.gap_to_goal > 0 ? `${prediction.gap_to_goal} ball qoldi` : 'yetdingiz! 🎉'}
            </Text>
          </View>
        </View>
      )}

      {/* Fan holati */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FAN HOLATI</Text>
        {profile.subjects.map((s) => (
          <View key={s} style={styles.subjectRow}>
            <Text style={styles.subjectName}>{SUBJECT_LABELS[s]}</Text>
            <View style={styles.subjectBar}>
              <View style={[styles.subjectFill, { width: `${Math.floor(40 + Math.random() * 40)}%` }]} />
            </View>
            <Text style={styles.subjectPct}>—</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: C.text },
  subGreeting: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  streakEmoji: { fontSize: 16 },
  streakNum: { fontSize: 16, fontWeight: '700', color: C.orange },
  countdownCard: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 24,
    backgroundColor: C.green, borderRadius: 20, padding: 20, gap: 16,
  },
  countdownLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 64 },
  countdownDays: { fontSize: 44, fontWeight: '800', color: C.white, lineHeight: 48 },
  countdownLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  countdownRight: { flex: 1, justifyContent: 'center' },
  countdownExam: { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 4 },
  countdownGoal: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: C.white, borderRadius: 3 },
  readinessText: { fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: C.textTertiary, letterSpacing: 0.08, marginBottom: 12 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.bgSecondary, borderRadius: 14, padding: 14,
    borderWidth: 0.5, borderColor: C.border,
  },
  taskIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.amberLight, alignItems: 'center', justifyContent: 'center' },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 3 },
  taskSub: { fontSize: 12, color: C.textSecondary },
  taskBtn: { width: 36, height: 36, backgroundColor: C.green, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  taskBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { flex: 1, minWidth: '45%', borderRadius: 14, padding: 14, gap: 4 },
  actionGreen: { backgroundColor: C.greenLight, borderWidth: 0.5, borderColor: C.greenBorder },
  actionBlue: { backgroundColor: C.blueLight, borderWidth: 0.5, borderColor: C.blueBorder },
  actionAmber: { backgroundColor: C.amberLight, borderWidth: 0.5, borderColor: C.amberBorder },
  actionPurple: { backgroundColor: C.purpleLight, borderWidth: 0.5, borderColor: '#CECBF6' },
  actionIcon: { fontSize: 22 },
  actionTitle: { fontSize: 13, fontWeight: '600', color: C.text },
  actionSub: { fontSize: 11, color: C.textSecondary },
  predictionCard: { backgroundColor: C.greenLight, borderRadius: 14, padding: 18, borderWidth: 0.5, borderColor: C.greenBorder },
  predLabel: { fontSize: 12, color: C.textSecondary, marginBottom: 4 },
  predScore: { fontSize: 28, fontWeight: '800', color: C.greenDark, marginBottom: 4 },
  predSub: { fontSize: 13, color: C.textSecondary },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  subjectName: { fontSize: 13, color: C.text, width: 90 },
  subjectBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.borderLight, overflow: 'hidden' },
  subjectFill: { height: '100%', backgroundColor: C.green, borderRadius: 4 },
  subjectPct: { fontSize: 12, color: C.textSecondary, width: 30, textAlign: 'right' },
});
