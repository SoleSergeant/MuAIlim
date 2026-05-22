import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C } from '../constants/colors';
import { MockResult, WrongQuestion, SUBJECT_LABELS, WeaknessTopic, Subject } from '../lib/types';
import { api } from '../lib/api';
import { canExplain, incrementExplainCount, FREE_EXPLAIN_PER_DAY } from '../lib/subscription';
import { getProfile } from '../lib/store';

const PRIORITY_COLORS = {
  high: C.red,
  medium: C.orange,
  low: C.green,
};

export default function ResultsScreen() {
  const { data } = useLocalSearchParams<{ data: string }>();
  const [result, setResult] = useState<MockResult | null>(null);
  const [showWeakness, setShowWeakness] = useState<WeaknessTopic | null>(null);
  const [expandedWrong, setExpandedWrong] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [loadingExplanation, setLoadingExplanation] = useState<string | null>(null);

  const fetchExplanation = async (wq: WrongQuestion) => {
    if (explanations[wq.question_id]) return;
    setLoadingExplanation(wq.question_id);
    try {
      // Check daily explain limit
      const profile = await getProfile();
      const allowed = await canExplain(profile.is_premium);
      if (!allowed) {
        Alert.alert(
          'Kunlik limit tugadi',
          `Bepul rejimda kuniga ${FREE_EXPLAIN_PER_DAY} ta AI tushuntirish. Premium bilan cheksiz tushuntirish oling.`,
          [
            { text: 'Premium →', onPress: () => router.push('/premium') },
            { text: 'OK', style: 'cancel' },
          ]
        );
        setLoadingExplanation(null);
        return;
      }

      const res = await api.explainAnswer({
        question_text: wq.text,
        options: wq.options,
        correct_index: wq.correct_index,
        selected_index: wq.selected_index,
        subject: wq.subject,
        topic: wq.topic,
      });
      await incrementExplainCount();
      setExplanations(prev => ({ ...prev, [wq.question_id]: res.explanation }));
    } catch {
      const correctOpt = wq.options[wq.correct_index] ?? '';
      const selectedOpt = wq.options[wq.selected_index] ?? '';
      setExplanations(prev => ({
        ...prev,
        [wq.question_id]: `Siz "${selectedOpt}" tanladingiz, lekin to'g'ri javob "${correctOpt}". "${wq.topic}" mavzusini qayta ko'rib chiqing.`,
      }));
    } finally {
      setLoadingExplanation(null);
    }
  };

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
                Taxminiy ball: ~{result.predicted_dtm_score} / 200
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
            <Text style={styles.sectionHint}>Bosing — shu mavzu bo'yicha maqsadli mashq boshlash uchun</Text>
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

        {/* Timing analysis */}
        {result.timing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VAQT TAHLILI</Text>
            <View style={styles.timingCard}>
              <View style={styles.timingRow}>
                <Text style={styles.timingLabel}>Jami sarflangan vaqt</Text>
                <Text style={styles.timingValue}>
                  {Math.floor(result.timing.total_secs / 60)}m {result.timing.total_secs % 60}s
                </Text>
              </View>
              <View style={[styles.timingRow, styles.timingBorder]}>
                <Text style={styles.timingLabel}>O'rtacha (1 savol)</Text>
                <Text style={[styles.timingValue, result.timing.avg_per_question > 70 ? styles.timingWarn : styles.timingOk]}>
                  {result.timing.avg_per_question}s
                </Text>
              </View>
              {Object.entries(result.timing.by_difficulty).map(([diff, secs]) => {
                const labels: Record<string, string> = { easy: 'Oson', medium: "O'rta", hard: 'Qiyin' };
                const bench: Record<string, number> = { easy: 45, medium: 60, hard: 90 };
                const isOver = secs > (bench[diff] ?? 60) * 1.4;
                return (
                  <View key={diff} style={[styles.timingRow, styles.timingBorder]}>
                    <Text style={styles.timingLabel}>{labels[diff] ?? diff} savollar</Text>
                    <Text style={[styles.timingValue, isOver ? styles.timingWarn : styles.timingOk]}>
                      {secs}s / savol
                    </Text>
                  </View>
                );
              })}
              {result.timing.flags.length > 0 && (
                <View style={styles.timingFlags}>
                  {result.timing.flags.map((f, i) => (
                    <View key={i} style={styles.timingFlag}>
                      <Text style={styles.timingFlagText}>⚠ {f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Wrong questions review */}
        {result.wrong_questions && result.wrong_questions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>XATO SAVOLLAR ({result.wrong_questions.length} ta)</Text>
            <Text style={styles.sectionHint}>Bosing — savolni ko'ring va AI tushuntirishini so'rang</Text>
            {result.wrong_questions.map((wq, i) => {
              const isExpanded = expandedWrong === wq.question_id;
              const explanation = explanations[wq.question_id];
              const isLoading = loadingExplanation === wq.question_id;
              const DIFF_LABELS: Record<string, string> = { easy: 'Oson', medium: "O'rta", hard: 'Qiyin' };
              return (
                <TouchableOpacity
                  key={wq.question_id}
                  style={styles.wrongCard}
                  onPress={() => setExpandedWrong(isExpanded ? null : wq.question_id)}
                  activeOpacity={0.8}
                >
                  {/* Header row */}
                  <View style={styles.wrongHeader}>
                    <View style={styles.wrongNumBadge}>
                      <Text style={styles.wrongNumText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.wrongTopic}>{wq.topic}</Text>
                      <Text style={styles.wrongDiff}>{DIFF_LABELS[wq.difficulty] ?? wq.difficulty} · {wq.time_spent_secs}s</Text>
                    </View>
                    <Text style={styles.wrongChevron}>{isExpanded ? '▲' : '▼'}</Text>
                  </View>

                  {/* Expanded content */}
                  {isExpanded && (
                    <View style={styles.wrongBody}>
                      <Text style={styles.wrongQuestion}>{wq.text}</Text>

                      {/* Options */}
                      <View style={styles.wrongOptions}>
                        {wq.options.map((opt, idx) => {
                          const isCorrect = idx === wq.correct_index;
                          const isWrong = idx === wq.selected_index && !isCorrect;
                          if (!isCorrect && !isWrong) return null;
                          return (
                            <View
                              key={idx}
                              style={[
                                styles.wrongOption,
                                isCorrect && styles.wrongOptionCorrect,
                                isWrong && styles.wrongOptionWrong,
                              ]}
                            >
                              <Text style={[styles.wrongOptionLabel, isCorrect && { color: C.white }, isWrong && { color: C.white }]}>
                                {isCorrect ? '✓' : '✗'} {String.fromCharCode(65 + idx)}
                              </Text>
                              <Text style={[styles.wrongOptionText, isCorrect && { color: C.white }, isWrong && { color: C.white }]}>
                                {opt}
                              </Text>
                            </View>
                          );
                        })}
                      </View>

                      {/* Explanation */}
                      {explanation ? (
                        <View style={styles.explanationBox}>
                          <Text style={styles.explanationLabel}>🤖 Tushuntirish</Text>
                          <Text style={styles.explanationText}>{explanation}</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.explainBtn}
                          onPress={() => fetchExplanation(wq)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <ActivityIndicator size="small" color={C.green} />
                          ) : (
                            <Text style={styles.explainBtnText}>🤖 AI tushuntirsin</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
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
            <Text style={styles.ctaOutlineText}>Yangi mock imtihon boshlash</Text>
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
              <Text style={styles.overlayCancelText}>Yoping</Text>
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
  timingCard: { backgroundColor: C.bgSecondary, borderRadius: 14, borderWidth: 0.5, borderColor: C.border, overflow: 'hidden' },
  timingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  timingBorder: { borderTopWidth: 0.5, borderColor: C.border },
  timingLabel: { fontSize: 13, color: C.textSecondary },
  timingValue: { fontSize: 13, fontWeight: '600', color: C.text },
  timingOk: { color: C.green },
  timingWarn: { color: C.orange },
  timingFlags: { borderTopWidth: 0.5, borderColor: C.border, padding: 12, gap: 6 },
  timingFlag: { backgroundColor: '#FFF8E1', borderRadius: 8, padding: 10 },
  timingFlagText: { fontSize: 12, color: '#7C5500', lineHeight: 18 },
  ctaRow: { gap: 10 },
  ctaGreen: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  ctaGreenText: { color: C.white, fontSize: 16, fontWeight: '600' },
  ctaOutline: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 0.5, borderColor: C.border },
  ctaOutlineText: { color: C.textSecondary, fontSize: 15 },
  // Wrong questions review
  wrongCard: {
    backgroundColor: C.bgSecondary, borderRadius: 14, borderWidth: 0.5,
    borderColor: C.border, marginBottom: 10, overflow: 'hidden',
  },
  wrongHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  wrongNumBadge: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: C.red + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  wrongNumText: { fontSize: 13, fontWeight: '700', color: C.red },
  wrongTopic: { fontSize: 13, fontWeight: '600', color: C.text },
  wrongDiff: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  wrongChevron: { fontSize: 11, color: C.textTertiary },
  wrongBody: { borderTopWidth: 0.5, borderColor: C.border, padding: 14, gap: 12 },
  wrongQuestion: { fontSize: 14, color: C.text, lineHeight: 22, fontWeight: '500' },
  wrongOptions: { gap: 8 },
  wrongOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10,
    borderRadius: 10, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bg,
  },
  wrongOptionCorrect: { backgroundColor: C.green, borderColor: C.green },
  wrongOptionWrong: { backgroundColor: C.red, borderColor: C.red },
  wrongOptionLabel: { fontSize: 13, fontWeight: '700', color: C.text, width: 28 },
  wrongOptionText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 18 },
  explanationBox: {
    backgroundColor: C.greenLight, borderRadius: 10, padding: 12,
    borderWidth: 0.5, borderColor: C.greenBorder,
  },
  explanationLabel: { fontSize: 11, fontWeight: '700', color: C.greenDark, marginBottom: 6 },
  explanationText: { fontSize: 13, color: C.text, lineHeight: 20 },
  explainBtn: {
    borderWidth: 1, borderColor: C.green, borderRadius: 10, paddingVertical: 10,
    alignItems: 'center',
  },
  explainBtnText: { fontSize: 13, color: C.green, fontWeight: '600' },

  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  overlayCard: { backgroundColor: C.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  overlayTitle: { fontSize: 20, fontWeight: '700', color: C.text },
  overlaySub: { fontSize: 14, color: C.textSecondary },
  overlayBtn: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  overlayBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  overlayCancelText: { textAlign: 'center', fontSize: 15, color: C.textSecondary, paddingVertical: 8 },
});
