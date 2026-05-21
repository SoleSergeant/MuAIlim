import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C } from '../constants/colors';
import { MockResult, SUBJECT_LABELS, WeaknessTopic, Subject } from '../lib/types';
import { api } from '../lib/api';

const PRIORITY_COLORS = {
  high: C.red,
  medium: C.orange,
  low: C.green,
};

export default function ResultsScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const [result, setResult] = useState<MockResult | null>(null);
  const [explaining, setExplaining] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [showWeakness, setShowWeakness] = useState<WeaknessTopic | null>(null);

  useEffect(() => {
    if (data) {
      try { setResult(JSON.parse(data)); } catch { }
    }
  }, [data]);

  if (!result) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.green} />
      </View>
    );
  }

  const scoreColor = result.score_pct >= 70 ? C.green : result.score_pct >= 50 ? C.orange : C.red;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mock natijalari</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Score card */}
        <View style={[styles.scoreCard, { borderColor: scoreColor + '40', backgroundColor: scoreColor + '10' }]}>
          <Text style={[styles.scorePct, { color: scoreColor }]}>{result.score_pct}%</Text>
          <Text style={styles.scoreDetail}>
            {result.correct_count} / {result.total_questions} to'g'ri
          </Text>
          {result.predicted_dtm_score && (
            <View style={styles.predBadge}>
              <Text style={styles.predBadgeText}>
                DTM taxminiy: ~{result.predicted_dtm_score} ball
              </Text>
            </View>
          )}
        </View>

        {/* AI Summary */}
        <View style={styles.aiCard}>
          <View style={styles.aiCardHeader}>
            <Text style={styles.aiLabel}>🤖 AI xulosa</Text>
          </View>
          <Text style={styles.aiText}>{result.ai_summary}</Text>
        </View>

        {/* By subject */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAN BO'YICHA NATIJA</Text>
          {Object.entries(result.by_subject).map(([subj, stats]) => {
            const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
            const color = pct >= 70 ? C.green : pct >= 50 ? C.orange : C.red;
            return (
              <View key={subj} style={styles.subjectRow}>
                <Text style={styles.subjectName}>{SUBJECT_LABELS[subj as Subject] ?? subj}</Text>
                <View style={styles.subjectBar}>
                  <View style={[styles.subjectFill, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
                <Text style={[styles.subjectPct, { color }]}>{pct}%</Text>
              </View>
            );
          })}
        </View>

        {/* Weakness map */}
        {result.weakness_topics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ZAIFLIK XARITASI</Text>
            <Text style={styles.sectionHint}>Maqsadli mashq qilish uchun bosing</Text>
            {result.weakness_topics.map((w, i) => (
              <TouchableOpacity
                key={i}
                style={styles.weaknessCard}
                onPress={() => setShowWeakness(w)}
              >
                <View style={styles.weaknessLeft}>
                  <Text style={styles.weaknessTopic}>{w.topic}</Text>
                  <Text style={styles.weaknessSubject}>{SUBJECT_LABELS[w.subject as Subject] ?? w.subject}</Text>
                </View>
                <View style={styles.weaknessRight}>
                  <Text style={[styles.weaknessPct, { color: PRIORITY_COLORS[w.priority] }]}>
                    {w.accuracy_pct}%
                  </Text>
                  <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[w.priority] }]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* CTA */}
        <View style={styles.ctaRow}>
          {result.weakness_topics.length > 0 && (
            <TouchableOpacity
              style={styles.ctaGreen}
              onPress={() => router.push({
                pathname: '/personalized',
                params: {
                  topic: result.weakness_topics[0].topic,
                  subject: result.weakness_topics[0].subject,
                },
              })}
            >
              <Text style={styles.ctaGreenText}>🎯 Zaif mavzuni ishlash →</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.ctaOutline} onPress={() => router.push('/mock')}>
            <Text style={styles.ctaOutlineText}>Yana mock yechish</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Weakness drill modal overlay */}
      {showWeakness && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Text style={styles.overlayTitle}>{showWeakness.topic}</Text>
            <Text style={styles.overlaySub}>
              {SUBJECT_LABELS[showWeakness.subject]} · {showWeakness.accuracy_pct}% to'g'ri
            </Text>
            <TouchableOpacity
              style={styles.overlayBtn}
              onPress={() => {
                setShowWeakness(null);
                router.push({
                  pathname: '/personalized',
                  params: { topic: showWeakness.topic, subject: showWeakness.subject },
                });
              }}
            >
              <Text style={styles.overlayBtnText}>Maqsadli mashq boshlash →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowWeakness(null)}>
              <Text style={styles.overlayCancelText}>Bekor qilish</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  closeBtn: { fontSize: 18, color: C.textSecondary, padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: C.text },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 40, gap: 16 },
  scoreCard: { alignItems: 'center', padding: 24, borderRadius: 20, borderWidth: 1 },
  scorePct: { fontSize: 56, fontWeight: '800', lineHeight: 60 },
  scoreDetail: { fontSize: 16, color: C.textSecondary, marginTop: 4 },
  predBadge: { marginTop: 10, backgroundColor: C.greenLight, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100 },
  predBadgeText: { fontSize: 13, color: C.greenDark, fontWeight: '500' },
  aiCard: { backgroundColor: C.bgSecondary, borderRadius: 14, padding: 16, borderWidth: 0.5, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.green },
  aiCardHeader: { marginBottom: 8 },
  aiLabel: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  aiText: { fontSize: 14, color: C.text, lineHeight: 22 },
  section: {},
  sectionTitle: { fontSize: 11, fontWeight: '600', color: C.textTertiary, letterSpacing: 0.08, marginBottom: 4 },
  sectionHint: { fontSize: 12, color: C.textSecondary, marginBottom: 12 },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  subjectName: { fontSize: 13, color: C.text, width: 90 },
  subjectBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.borderLight, overflow: 'hidden' },
  subjectFill: { height: '100%', borderRadius: 4 },
  subjectPct: { fontSize: 13, fontWeight: '600', width: 40, textAlign: 'right' },
  weaknessCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    backgroundColor: C.bgSecondary, marginBottom: 8,
  },
  weaknessLeft: { flex: 1 },
  weaknessTopic: { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 2 },
  weaknessSubject: { fontSize: 12, color: C.textSecondary },
  weaknessRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weaknessPct: { fontSize: 16, fontWeight: '700' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  ctaRow: { gap: 10 },
  ctaGreen: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  ctaGreenText: { color: C.white, fontSize: 16, fontWeight: '600' },
  ctaOutline: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 0.5, borderColor: C.border },
  ctaOutlineText: { color: C.textSecondary, fontSize: 15 },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  overlayCard: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  overlayTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  overlaySub: { fontSize: 14, color: C.textSecondary },
  overlayBtn: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  overlayBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  overlayCancelText: { textAlign: 'center', fontSize: 15, color: C.textSecondary, paddingVertical: 8 },
});
