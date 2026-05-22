import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C } from '../constants/colors';
import { getProfile } from '../lib/store';
import { SUBJECT_LABELS, Subject } from '../lib/types';

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function TakeTestScreen() {
  const { test_id } = useLocalSearchParams<{ test_id: string }>();
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [qStartTime, setQStartTime] = useState(Date.now());
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadTest();
  }, [test_id]);

  const loadTest = async () => {
    try {
      const res = await fetch(`${API}/api/teacher/take/${test_id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setTest(data);
    } catch {
      Alert.alert('Xatolik', 'Test topilmadi. Orqaga qayting.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const confirmAnswer = () => {
    if (selected === null || !test) return;
    const q = test.questions[current];
    setAnswers(prev => ({ ...prev, [q.id]: selected }));
    setConfirmed(true);
  };

  const nextQuestion = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    if (current + 1 >= test.questions.length) {
      handleSubmit();
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setConfirmed(false);
      setQStartTime(Date.now());
    }
  };

  const handleSubmit = async () => {
    if (submitting || !test) return;
    setSubmitting(true);
    try {
      const profile = await getProfile();
      const answerList = Object.entries(answers).map(([question_id, selected_index]) => ({
        question_id,
        selected_index,
      }));
      const res = await fetch(`${API}/api/teacher/submit-test/${test_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: profile.user_id,
          student_name: profile.display_name,
          answers: answerList,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      Alert.alert('Xatolik', 'Natijalarni yuborishda muammo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={styles.loadingText}>Test yuklanmoqda...</Text>
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={styles.loadingText}>Natijalar hisoblanmoqda...</Text>
      </View>
    );
  }

  // Results screen
  if (result) {
    const scoreColor = result.score_pct >= 70 ? C.green : result.score_pct >= 50 ? C.orange : C.red;
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{test?.title ?? 'Test natijasi'}</Text>
        </View>
        <ScrollView contentContainerStyle={styles.resultBody}>
          <View style={[styles.scoreCard, { borderColor: scoreColor + '40', backgroundColor: scoreColor + '12' }]}>
            <Text style={[styles.scorePct, { color: scoreColor }]}>{result.score_pct}%</Text>
            <Text style={styles.scoreDetail}>{result.correct} / {result.total} to'g'ri</Text>
            <Text style={styles.scoreLabel}>
              {result.score_pct >= 70 ? "Ajoyib natija! 🎉" : result.score_pct >= 50 ? "Yaxshi, davom eting 💪" : "Ko'proq mashq kerak 📚"}
            </Text>
          </View>

          <View style={styles.testInfoCard}>
            <Text style={styles.testInfoTitle}>{test?.title}</Text>
            <Text style={styles.testInfoMeta}>
              {SUBJECT_LABELS[test?.subject as Subject] ?? test?.subject} · {test?.topic} · {test?.grade}-sinf
            </Text>
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/(tabs)/practice')}>
            <Text style={styles.doneBtnText}>Mashq sahifasiga qaytish</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  if (!test || test.questions.length === 0) return null;

  const q = test.questions[current];
  const isCorrect = (idx: number) => {
    if (!confirmed) return false;
    // We don't have correct_index on student view, show selected only
    return false;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert('Testdan chiqish', "Testni to'xtatmoqchimisiz? Natija saqlanmaydi.", [
          { text: 'Yo\'q' },
          { text: 'Ha', onPress: () => router.back(), style: 'destructive' },
        ])}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{current + 1} / {test.questions.length}</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((current + 1) / test.questions.length) * 100}%` }]} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Topic badge */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{SUBJECT_LABELS[test.subject as Subject] ?? test.subject}</Text>
          </View>
          <View style={[styles.badge, styles.badgeGray]}>
            <Text style={styles.badgeText}>{test.topic}</Text>
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.questionText}>{q.text}</Text>
          <View style={styles.options}>
            {(q.options ?? []).map((opt: string, idx: number) => {
              const isSelected = selected === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionBtn,
                    isSelected && !confirmed && styles.optionSelected,
                    confirmed && isSelected && styles.optionConfirmed,
                  ]}
                  onPress={() => !confirmed && setSelected(idx)}
                  disabled={confirmed}
                >
                  <View style={styles.optionLetter}>
                    <Text style={styles.optionLetterText}>{String.fromCharCode(65 + idx)}</Text>
                  </View>
                  <Text style={styles.optionText}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        {!confirmed ? (
          <TouchableOpacity
            style={[styles.confirmBtn, selected === null && styles.confirmBtnDisabled]}
            onPress={confirmAnswer}
            disabled={selected === null}
          >
            <Text style={styles.confirmBtnText}>Tasdiqlash</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
            <Text style={styles.nextBtnText}>
              {current + 1 >= test.questions.length ? "Natijani ko'rish →" : "Keyingisi →"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 15, color: C.textSecondary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  closeBtn: { fontSize: 18, color: C.textSecondary, padding: 4 },
  headerTitle: { fontSize: 15, fontWeight: '600', color: C.text },
  progressBar: { height: 3, backgroundColor: C.borderLight, marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: C.green, borderRadius: 2 },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 16 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, backgroundColor: C.blueLight, borderWidth: 0.5, borderColor: C.blueBorder },
  badgeGray: { backgroundColor: C.bgSecondary, borderColor: C.border },
  badgeText: { fontSize: 11, color: C.blue, fontWeight: '500' },
  questionText: { fontSize: 17, fontWeight: '500', color: C.text, lineHeight: 26, marginBottom: 20 },
  options: { gap: 10 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 12, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary,
  },
  optionSelected: { borderColor: C.green, backgroundColor: C.greenLight },
  optionConfirmed: { borderColor: C.green, backgroundColor: C.green },
  optionLetter: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  optionText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 20 },
  footer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: C.border },
  confirmBtn: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: C.borderLight },
  confirmBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  nextBtn: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  nextBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  // Results
  resultBody: { padding: 20, gap: 16, paddingBottom: 40 },
  scoreCard: { alignItems: 'center', padding: 32, borderRadius: 20, borderWidth: 1 },
  scorePct: { fontSize: 60, fontWeight: '800', lineHeight: 64 },
  scoreDetail: { fontSize: 16, color: C.textSecondary, marginTop: 4 },
  scoreLabel: { fontSize: 15, color: C.text, marginTop: 8, fontWeight: '500' },
  testInfoCard: {
    backgroundColor: C.bgSecondary, borderRadius: 14, padding: 16,
    borderWidth: 0.5, borderColor: C.border,
  },
  testInfoTitle: { fontSize: 16, fontWeight: '600', color: C.text },
  testInfoMeta: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
  doneBtn: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  doneBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
});
