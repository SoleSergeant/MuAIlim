import { useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { C } from '../constants/colors';
import { api } from '../lib/api';
import { getProfile } from '../lib/store';
import { Question, MockAnswer, SUBJECT_LABELS } from '../lib/types';

export default function MockScreen() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<MockAnswer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5400);
  const [qStartTime, setQStartTime] = useState(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadMock();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); handleSubmit(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [questions]);

  const loadMock = async () => {
    try {
      const profile = await getProfile();
      const [qRes, sessRes] = await Promise.all([
        api.getMockQuestions('math,history,uzbek', 90),
        api.startMock(profile.user_id, profile.exam_type),
      ]);
      setQuestions(qRes.questions);
      setSessionId(sessRes.session_id);
    } catch (e) {
      Alert.alert('Xatolik', 'Savollarni yuklashda muammo. Internet ulanishini tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  const selectOption = (idx: number) => {
    if (confirmed) return;
    setSelected(idx);
  };

  const confirmAnswer = () => {
    if (selected === null) return;
    const timeTaken = Math.round((Date.now() - qStartTime) / 1000);
    const q = questions[current];
    setAnswers((prev) => [...prev, {
      question_id: q.id,
      selected_index: selected,
      time_spent_seconds: timeTaken,
    }]);
    setConfirmed(true);
  };

  const nextQuestion = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    if (current + 1 >= questions.length) {
      handleSubmit();
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setConfirmed(false);
      setQStartTime(Date.now());
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const profile = await getProfile();
      const finalAnswers = [...answers];
      if (selected !== null && !confirmed) {
        finalAnswers.push({
          question_id: questions[current].id,
          selected_index: selected,
          time_spent_seconds: Math.round((Date.now() - qStartTime) / 1000),
        });
      }
      const result = await api.submitMock(sessionId, profile.user_id, finalAnswers);
      router.replace({ pathname: '/results', params: { data: JSON.stringify(result) } });
    } catch (e) {
      Alert.alert('Xatolik', 'Natijalarni yuborishda muammo yuz berdi.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={styles.loadingText}>Savollar yuklanmoqda...</Text>
      </View>
    );
  }

  if (submitting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={styles.loadingText}>AI tahlil qilmoqda...</Text>
        <Text style={styles.loadingSubText}>AI natijalarni ko'rib chiqmoqda...</Text>
      </View>
    );
  }

  const q = questions[current];
  if (!q) return null;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isLowTime = timeLeft < 60;

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => Alert.alert('Chiqish', "Mock ni to'xtatmoqchimisiz?", [
          { text: 'Yo\'q' },
          { text: 'Ha', onPress: () => router.back(), style: 'destructive' },
        ])}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.progressText}>{current + 1} / {questions.length}</Text>
        <View style={[styles.timer, isLowTime && styles.timerRed]}>
          <Text style={[styles.timerText, isLowTime && styles.timerTextRed]}>
            {mins}:{secs.toString().padStart(2, '0')}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* Subject / topic badge */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{SUBJECT_LABELS[q.subject]}</Text>
          </View>
          <View style={[styles.badge, styles.badgeGray]}>
            <Text style={styles.badgeText}>{q.topic}</Text>
          </View>
          {q.source.startsWith('ai') && (
            <View style={[styles.badge, styles.badgeGreen]}>
              <Text style={[styles.badgeText, { color: C.greenDark }]}>🤖 AI</Text>
            </View>
          )}
        </View>

        {/* Question */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.questionText}>{q.text}</Text>

          {/* Options */}
          <View style={styles.options}>
            {q.options.map((opt, idx) => {
              const isSelected = selected === idx;
              const isCorrect = confirmed && idx === q.correct_index;
              const isWrong = confirmed && isSelected && idx !== q.correct_index;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionBtn,
                    isSelected && !confirmed && styles.optionSelected,
                    isCorrect && styles.optionCorrect,
                    isWrong && styles.optionWrong,
                  ]}
                  onPress={() => selectOption(idx)}
                  disabled={confirmed}
                >
                  <View style={styles.optionLetter}>
                    <Text style={[styles.optionLetterText, isCorrect && { color: C.white }, isWrong && { color: C.white }]}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, isCorrect && { color: C.white }, isWrong && { color: C.white }]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Footer */}
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
              {current + 1 >= questions.length ? 'Natijalarni ko\'rish →' : 'Keyingisi →'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  loadingText: { fontSize: 16, fontWeight: '500', color: C.text, marginTop: 8 },
  loadingSubText: { fontSize: 13, color: C.textSecondary },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  closeBtn: { fontSize: 18, color: C.textSecondary, padding: 4 },
  progressText: { fontSize: 14, fontWeight: '600', color: C.text },
  timer: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, backgroundColor: C.bgSecondary, borderWidth: 0.5, borderColor: C.border },
  timerRed: { backgroundColor: '#FFF5F5', borderColor: '#FC8181' },
  timerText: { fontSize: 14, fontWeight: '600', color: C.text },
  timerTextRed: { color: C.red },
  progressBar: { height: 3, backgroundColor: C.borderLight, marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: '100%', backgroundColor: C.green, borderRadius: 2 },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 16 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, backgroundColor: C.blueLight, borderWidth: 0.5, borderColor: C.blueBorder },
  badgeGray: { backgroundColor: C.bgSecondary, borderColor: C.border },
  badgeGreen: { backgroundColor: C.greenLight, borderColor: C.greenBorder },
  badgeText: { fontSize: 11, color: C.blue, fontWeight: '500' },
  questionText: { fontSize: 17, fontWeight: '500', color: C.text, lineHeight: 26, marginBottom: 20 },
  options: { gap: 10 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 12, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary,
  },
  optionSelected: { borderColor: C.green, backgroundColor: C.greenLight },
  optionCorrect: { borderColor: C.green, backgroundColor: C.green },
  optionWrong: { borderColor: C.red, backgroundColor: C.red },
  optionLetter: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: C.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  optionLetterText: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  optionText: { flex: 1, fontSize: 14, color: C.text, lineHeight: 20 },
  footer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: C.border },
  confirmBtn: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: C.borderLight },
  confirmBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  nextBtn: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  nextBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
});
