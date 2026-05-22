import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { getProfile, clearProfile, daysUntilExam } from '../../lib/store';
import { UserProfile, SUBJECT_LABELS, EXAM_TYPE_LABELS, Roadmap, RoadmapWeek } from '../../lib/types';
import { api } from '../../lib/api';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(true);
  const [roadmapCollapsed, setRoadmapCollapsed] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const p = await getProfile();
    setProfile(p);
    // Load roadmap in parallel
    try {
      const days = daysUntilExam(p.exam_date);
      const subjectsStr = p.subjects.join(',');
      const rm = await api.getRoadmap(p.user_id, p.goal_score, days, subjectsStr);
      setRoadmap(rm);
    } catch {
      setRoadmap(null);
    } finally {
      setRoadmapLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearProfile();
    router.replace('/(auth)');
  };

  if (!profile) return <View style={s.center}><ActivityIndicator color={C.green} /></View>;

  const daysLeft = daysUntilExam(profile.exam_date);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* ── Avatar & name ── */}
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

      {/* ── Stats row ── */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statValue}>{profile.goal_score}</Text>
          <Text style={s.statLabel}>Maqsad ball</Text>
        </View>
        <View style={[s.statBox, s.statBorder]}>
          <Text style={s.statValue}>{daysLeft}</Text>
          <Text style={s.statLabel}>Kun qoldi</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statValue}>{profile.streak}</Text>
          <Text style={s.statLabel}>Streak</Text>
        </View>
      </View>

      {/* ── Personalized Learning Roadmap ── */}
      <View style={s.section}>
        {/* Section header — tapping it collapses/expands the whole roadmap */}
        <TouchableOpacity
          style={s.roadmapSectionHeader}
          onPress={() => setRoadmapCollapsed((v) => !v)}
          activeOpacity={0.7}
        >
          <Text style={s.sectionTitle}>SHAXSIY O'QUV YO'L XARITASI</Text>
          <Text style={s.roadmapCollapseChevron}>{roadmapCollapsed ? '›' : '‹'}</Text>
        </TouchableOpacity>

        {roadmapCollapsed ? null : !profile.is_premium ? (
          /* ── Premium gate for roadmap ── */
          <TouchableOpacity style={s.roadmapGate} onPress={() => router.push('/premium')} activeOpacity={0.85}>
            <Text style={s.roadmapGateIcon}>🔒</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.roadmapGateTitle}>Premium xususiyat</Text>
              <Text style={s.roadmapGateSub}>Sizning zaifliklaringizga asoslanib AI tuzgan haftalik reja</Text>
            </View>
            <Text style={s.roadmapGateArrow}>→</Text>
          </TouchableOpacity>
        ) : roadmapLoading ? (
          <View style={s.roadmapLoading}>
            <ActivityIndicator color={C.green} size="small" />
            <Text style={s.roadmapLoadingText}>AI yo'l xaritasi tuzilmoqda...</Text>
          </View>
        ) : roadmap ? (
          <>
            {/* Progress overview card */}
            <View style={s.overviewCard}>
              <View style={s.overviewRow}>
                <View style={s.overviewLeft}>
                  <Text style={s.overviewTitle}>
                    {roadmap.has_data ? 'Hozirgi tayyorlik' : 'Mock imtihon o\'tkazing'}
                  </Text>
                  <Text style={s.overviewSub}>
                    {roadmap.total_weeks} hafta · {roadmap.days_remaining} kun qoldi
                  </Text>
                </View>
                <View style={s.overviewRight}>
                  {roadmap.has_data ? (
                    <>
                      <Text style={s.overviewPct}>{roadmap.current_readiness_pct}%</Text>
                      <Text style={s.overviewPctLabel}>tayyor</Text>
                    </>
                  ) : (
                    <Text style={s.overviewPct}>—</Text>
                  )}
                </View>
              </View>

              {/* Progress bar: current → needed */}
              <View style={s.progressTrack}>
                <View
                  style={[
                    s.progressFill,
                    {
                      width: `${Math.min(100, roadmap.has_data
                        ? (roadmap.current_readiness_pct / roadmap.needed_pct) * 100
                        : 0)}%`,
                    },
                  ]}
                />
                {/* Goal marker */}
                <View style={[s.goalMarker, { left: '100%' }]}>
                  <View style={s.goalDot} />
                </View>
              </View>
              <View style={s.progressLabels}>
                <Text style={s.progressLabelLeft}>
                  {roadmap.has_data ? `${roadmap.current_readiness_pct}%` : '0%'}
                </Text>
                <Text style={s.progressLabelRight}>Maqsad: {roadmap.needed_pct}%</Text>
              </View>

              {/* AI advice */}
              {roadmap.ai_advice ? (
                <View style={s.adviceBox}>
                  <Text style={s.adviceIcon}>🤖</Text>
                  <Text style={s.adviceText}>{roadmap.ai_advice}</Text>
                </View>
              ) : null}
            </View>

            {/* Week cards */}
            {roadmap.weeks.map((week) => (
              <WeekCard key={week.week_num} week={week} />
            ))}

            {!roadmap.has_data && (
              <View style={s.noDataHint}>
                <Text style={s.noDataHintText}>
                  💡 Mock imtihon yechganingizdan so'ng yo'l xaritasi siz uchun aniq zaif mavzularga moslashtiriladi.
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={s.noDataHint}>
            <Text style={s.noDataHintText}>
              Yo'l xaritasini ko'rish uchun mock imtihon yeching.
            </Text>
          </View>
        )}
      </View>

      {/* ── Subjects ── */}
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

      {/* ── Exam info ── */}
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

      {/* ── Premium / Upgrade ── */}
      {!profile.is_premium ? (
        <View style={s.section}>
          <TouchableOpacity style={s.upgradeBtn} onPress={() => router.push('/premium')}>
            <Text style={s.upgradeText}>⭐ Premium — 25 000 UZS/oydan →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.section}>
          <View style={s.premiumActive}>
            <Text style={s.premiumActiveText}>⭐ Premium faol</Text>
          </View>
        </View>
      )}

      {/* ── Logout ── */}
      <View style={s.section}>
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Chiqish</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Week Card Component (collapsible) ──────────────────────────────────────
function WeekCard({ week }: { week: RoadmapWeek }) {
  const isCurrent = week.status === 'current';
  // Current week starts expanded; upcoming weeks start collapsed
  const [collapsed, setCollapsed] = useState(!isCurrent);

  return (
    <View style={[wk.card, isCurrent && wk.cardCurrent]}>
      {/* Tappable header row — toggles collapse */}
      <TouchableOpacity
        style={wk.header}
        onPress={() => setCollapsed((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={wk.headerLeft}>
          <View style={wk.headerTitleRow}>
            <Text style={[wk.weekNum, isCurrent && wk.weekNumCurrent]}>
              {isCurrent ? '🔥 ' : ''}{week.week_num}-hafta
            </Text>
            {isCurrent && (
              <View style={wk.currentBadge}>
                <Text style={wk.currentBadgeText}>JORIY</Text>
              </View>
            )}
          </View>
          <Text style={wk.dateLabel}>{week.date_label}</Text>
        </View>
        {/* Chevron */}
        <Text style={[wk.chevron, isCurrent && wk.chevronCurrent]}>
          {collapsed ? '›' : '‹'}
        </Text>
      </TouchableOpacity>

      {/* Theme line — always visible */}
      <Text style={[wk.theme, isCurrent && wk.themeCurrent]}>{week.theme}</Text>

      {/* Collapsible body */}
      {!collapsed && (
        week.is_review_week ? (
          <View style={wk.reviewRow}>
            <Text style={wk.reviewIcon}>🎯</Text>
            <Text style={wk.reviewText}>Barcha mavzularni takrorlash va mock imtihon yeching</Text>
          </View>
        ) : (
          <View style={wk.topics}>
            {week.focus_topics.map((t, i) => {
              const pct = t.accuracy_pct;
              const color = pct === null ? C.textTertiary
                : pct < 40 ? C.red
                : pct < 70 ? C.orange
                : C.green;
              return (
                <View key={i} style={wk.topicRow}>
                  <Text style={wk.topicIcon}>{t.icon}</Text>
                  <Text style={wk.topicName} numberOfLines={1}>{t.topic}</Text>
                  <Text style={[wk.topicPct, { color }]}>
                    {pct !== null ? `${pct}%` : '—'}
                  </Text>
                  <View style={[wk.dot, { backgroundColor: color }]} />
                </View>
              );
            })}
            {week.focus_topics.length === 0 && (
              <Text style={wk.noTopics}>Mavzular aniqlanmoqda...</Text>
            )}
          </View>
        )
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: { alignItems: 'center', paddingTop: 64, paddingBottom: 24, paddingHorizontal: 20 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 34, fontWeight: '700', color: C.white },
  name: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  examLabel: { fontSize: 14, color: C.textSecondary, marginBottom: 10 },
  streakRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF3E0', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100,
  },
  streakEmoji: { fontSize: 16 },
  streakText: { fontSize: 14, fontWeight: '600', color: C.orange },

  statsRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 24,
    backgroundColor: C.bgSecondary, borderRadius: 16, borderWidth: 0.5, borderColor: C.border,
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statBorder: { borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: C.border },
  statValue: { fontSize: 22, fontWeight: '800', color: C.green, marginBottom: 2 },
  statLabel: { fontSize: 11, color: C.textSecondary },

  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: C.textTertiary, letterSpacing: 0.08, marginBottom: 10 },
  card: { backgroundColor: C.bgSecondary, borderRadius: 14, borderWidth: 0.5, borderColor: C.border, overflow: 'hidden' },

  // Roadmap
  roadmapSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingVertical: 2 },
  roadmapCollapseChevron: { fontSize: 22, color: C.green, fontWeight: '300', lineHeight: 26 },
  roadmapGate: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#DDD6FE' },
  roadmapGateIcon: { fontSize: 22 },
  roadmapGateTitle: { fontSize: 13, fontWeight: '700', color: '#5B21B6' },
  roadmapGateSub: { fontSize: 12, color: '#7C3AED', marginTop: 2 },
  roadmapGateArrow: { fontSize: 18, color: '#7C3AED', fontWeight: '600' },
  roadmapLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, backgroundColor: C.bgSecondary, borderRadius: 14, borderWidth: 0.5, borderColor: C.border },
  roadmapLoadingText: { fontSize: 13, color: C.textSecondary },

  overviewCard: {
    backgroundColor: C.bgSecondary, borderRadius: 16, padding: 18,
    borderWidth: 0.5, borderColor: C.border, marginBottom: 12, gap: 12,
  },
  overviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overviewLeft: { flex: 1 },
  overviewTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  overviewSub: { fontSize: 12, color: C.textSecondary },
  overviewRight: { alignItems: 'center' },
  overviewPct: { fontSize: 28, fontWeight: '800', color: C.green, lineHeight: 32 },
  overviewPctLabel: { fontSize: 11, color: C.textSecondary },

  progressTrack: { height: 10, backgroundColor: C.borderLight, borderRadius: 5, overflow: 'visible', position: 'relative' },
  progressFill: { height: '100%', backgroundColor: C.green, borderRadius: 5 },
  goalMarker: { position: 'absolute', top: -3, marginLeft: -6 },
  goalDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.green, borderWidth: 3, borderColor: C.white },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressLabelLeft: { fontSize: 11, color: C.green, fontWeight: '600' },
  progressLabelRight: { fontSize: 11, color: C.textSecondary },

  adviceBox: { flexDirection: 'row', gap: 10, backgroundColor: C.greenLight, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: C.greenBorder },
  adviceIcon: { fontSize: 18, marginTop: 1 },
  adviceText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 20 },

  noDataHint: { backgroundColor: C.amberLight, borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: C.amberBorder },
  noDataHintText: { fontSize: 13, color: C.amber, lineHeight: 20 },

  // Subjects / exam info
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 13 },
  subjectBorder: { borderBottomWidth: 0.5, borderColor: C.border },
  subjectDot: { fontSize: 10, color: C.green },
  subjectName: { fontSize: 15, color: C.text },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  infoRowBorder: { borderTopWidth: 0.5, borderColor: C.border },
  infoLabel: { fontSize: 14, color: C.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: C.text },

  upgradeBtn: { backgroundColor: '#7C3AED', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  upgradeText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  premiumActive: { backgroundColor: '#F5F3FF', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#DDD6FE' },
  premiumActiveText: { fontSize: 14, fontWeight: '600', color: '#7C3AED' },
  logoutBtn: { borderWidth: 1, borderColor: C.red, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  logoutText: { fontSize: 15, fontWeight: '600', color: C.red },
});

// Week card styles
const wk = StyleSheet.create({
  card: {
    backgroundColor: C.bgSecondary, borderRadius: 14, padding: 14,
    borderWidth: 0.5, borderColor: C.border, marginBottom: 10,
  },
  cardCurrent: {
    borderColor: C.green, backgroundColor: '#F0FDF4',
    shadowColor: C.green, shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerLeft: { flex: 1 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 1 },
  weekNum: { fontSize: 14, fontWeight: '700', color: C.text },
  weekNumCurrent: { color: C.greenDark },
  dateLabel: { fontSize: 11, color: C.textTertiary, marginTop: 1 },
  currentBadge: { backgroundColor: C.green, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  currentBadgeText: { fontSize: 10, fontWeight: '700', color: C.white, letterSpacing: 0.5 },
  chevron: { fontSize: 22, color: C.textTertiary, fontWeight: '300', paddingLeft: 8, lineHeight: 26 },
  chevronCurrent: { color: C.green },
  theme: { fontSize: 12, color: C.textSecondary, marginBottom: 8, fontStyle: 'italic' },
  themeCurrent: { color: C.greenDark, fontStyle: 'normal', fontWeight: '500' },

  topics: { gap: 8 },
  topicRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topicIcon: { fontSize: 16, width: 22 },
  topicName: { flex: 1, fontSize: 13, color: C.text, fontWeight: '500' },
  topicPct: { fontSize: 13, fontWeight: '700', width: 36, textAlign: 'right' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  noTopics: { fontSize: 12, color: C.textTertiary, fontStyle: 'italic' },

  reviewRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  reviewIcon: { fontSize: 20 },
  reviewText: { flex: 1, fontSize: 13, color: C.textSecondary, lineHeight: 20 },
});
