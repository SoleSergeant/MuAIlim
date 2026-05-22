import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C } from '../constants/colors';
import { api } from '../lib/api';
import { getProfile } from '../lib/store';
import { Question, SUBJECT_LABELS, Subject } from '../lib/types';

export default function PersonalizedScreen() {
  const params = useLocalSearchParams<{ topic?: string; subject?: string }>();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [prevScore, setPrevScore] = useState(61);
  const [profile, setProfileState] = useState<any>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const p = await getProfile();
      setProfileState(p);
      const topic = params.topic || 'Zaif mavzular';
      const subject = params.subject || p.subjects[0];
      const res = await api.getPersonalizedQuestions(topic, subject, 5);
      if (!res.questions || res.questions.length === 0) {
        Alert.alert('Savollar topilmadi', `"${topic}" mavzusi bo'yicha savollar hali tayyorlanmagan.`, [
          { text: 'Orqaga', onPress: () => router.back() }
        ]);
        return;
      }
      setQuestions(res.questions);
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('404') || msg.includes('topilmadi')) {
        Alert.alert('Mavzu topilmadi', `Bu mavzu bo'yicha savollar hali yo'q. Boshqa mavzuni tanlang.`, [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Xatolik', 'Savollarni yuklashda muammo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmAnswer = () => {
    if (selected === null) return;
    const q = questions[current];
    const isCorrect = selected === q.correct_index;
    if (isCorrect) setCorrectCount((c) => c + 1);
    setConfirmed(true);
    setExplanation(null);
  };

  const askWhy = async () => {
    const q = questions[current];
    if (selected === null) return;
    setExplaining(true);
    try {
      const res = await api.explainAnswer({
        question_text: q.text,
        options: q.options,
        correct_index: q.correct_index,
        selected_index: selected,
        subject: q.subject,
        topic: q.topic,
      });
      setExplanation(res.explanation);
    } catch {
      setExplanation("Tushuntirma olishda muammo. Internet ulanishini tekshiring.");
    } finally {
      setExplaining(false);
    }
  };

  const next = () => {
    if (current + 1 >= questions.length) {
      setDone(true);
    } else {
      setCurrent(current + 1);
      setSelected(null);
      setConfirmed(false);
      setExplanation(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.green} />
        <Text style={styles.loadingText}>Savollar tayyorlanmoqda...</Text>
      </View>
    );
  }

  if (done) {
    const newScore = Math.round(prevScore + (correctCount / questions.length) * 20);
    const improved = newScore > prevScore;
    return (
      <View style={styles.doneContainer}>
        <Text style={styles.doneEmoji}>{improved ? '🎉' : '💪'}</Text>
        <Text style={styles.doneTitle}>{improved ? 'Yaxshi ishladi!' : 'Davom eting!'}</Text>
        <View style={styles.scoreCompare}>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreBoxLabel}>Avval</Text>
            <Text style={[styles.scoreBoxNum, { color: C.textSecondary }]}>{prevScore}%</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
          <View style={styles.scoreBox}>
            <Text style={styles.scoreBoxLabel}>Hozir</Text>
            <Text style={[styles.scoreBoxNum, { color: C.green }]}>{newScore}%</Text>
          </View>
        </View>
        <Text style={styles.doneStats}>{correctCount} / {questions.length} to'g'ri javob</Text>
        <Text style={styles.doneTopic}>
          Mavzu: {params.topic || 'Aralash'} ·{' '}
          {SUBJECT_LABELS[(params.subject as Subject) || 'math'] ?? params.subject}
        </Text>
        <View style={styles.doneActions}>
          <TouchableOpacity style={styles.doneGreenBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.doneGreenBtnText}>Bosh sahifaga →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.doneOutlineBtn}
            onPress={() => {
              setCurrent(0); setCorrectCount(0); setDone(false);
              setSelected(null); setConfirmed(false); setExplanation(null);
            }}
          >
            <Text style={styles.doneOutlineBtnText}>Qaytadan yechish</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const q = questions[current];
  if (!q) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Maqsadli mashq</Text>
          <Text style={styles.headerSub}>{params.topic || SUBJECT_LABELS[q.subject]}</Text>
        </View>
        <Text style={styles.progress}>{current + 1}/{questions.length}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{SUBJECT_LABELS[q.subject]}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: C.amberLight, borderColor: C.amberBorder }]}>
            <Text style={[styles.badgeText, { color: C.amber }]}>{q.difficulty}</Text>
          </View>
        </View>

        <Text style={styles.questionText}>{q.text}</Text>

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
                onPress={() => !confirmed && setSelected(idx)}
                disabled={confirmed}
              >
                <View style={[styles.optionLetter, isCorrect && { backgroundColor: 'rgba(255,255,255,0.3)' }, isWrong && { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                  <Text style={[styles.optionLetterText, (isCorrect || isWrong) && { color: C.white }]}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text style={[styles.optionText, (isCorrect || isWrong) && { color: C.white }]}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation */}
        {confirmed && (
          <View style={styles.explainArea}>
            {selected !== q.correct_index && (
              <TouchableOpacity style={styles.whyBtn} onPress={askWhy} disabled={explaining}>
                {explaining ? (
                  <ActivityIndicator size="small" color={C.green} />
                ) : (
                  <Text style={styles.whyBtnText}>🤖 Nega xato qildim?</Text>
                )}
              </TouchableOpacity>
            )}
            {explanation && (
              <View style={styles.explanationCard}>
                <Text style={styles.explanationText}>{explanation}</Text>
              </View>
            )}
          </View>
        )}
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
          <TouchableOpacity style={styles.nextBtn} onPress={next}>
            <Text style={styles.nextBtnText}>
              {current + 1 >= questions.length ? 'Natijani ko\'rish 🎉' : 'Keyingisi →'}
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
  loadingText: { fontSize: 15, color: C.textSecondary, marginTop: 8 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12,
  },
  backBtn: { fontSize: 22, color: C.textSecondary, padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: C.text, textAlign: 'center' },
  headerSub: { fontSize: 12, color: C.textSecondary, textAlign: 'center' },
  progress: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
  progressBar: { height: 3, backgroundColor: C.borderLight, marginHorizontal: 20, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: C.green, borderRadius: 2 },
  body: { flex: 1 },
  bodyContent: { padding: 20, paddingBottom: 16 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, backgroundColor: C.blueLight, borderWidth: 0.5, borderColor: C.blueBorder },
  badgeText: { fontSize: 11, color: C.blue, fontWeight: '500' },
  questionText: { fontSize: 17, fontWeight: '500', color: C.text, lineHeight: 26, marginBottom: 20 },
  options: { gap: 10 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 12, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary,
  },
  optionSelected: { borderColor: C.green, backgroundColor: C.greenLight },
  optionCorrect: { backgroundColor: C.green, borderColor: C.green },
  optionWrong: { backgroundColor: C.red, borderColor: C.red },
  optionLetter: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.borderLight, alignItems: 'center', justifyContent: 'center' },
  optionLetterText: { fontSize: 12, fontWeight: '600', color: C.textSecondary },
  optionText: { flex: 1, fontSize: 14, color: C.text },
  explainArea: { marginTop: 16, gap: 10 },
  whyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 0.5, borderColor: C.greenBorder, backgroundColor: C.greenLight },
  whyBtnText: { fontSize: 14, color: C.greenDark, fontWeight: '500' },
  explanationCard: { backgroundColor: C.bgSecondary, borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: C.border, borderLeftWidth: 3, borderLeftColor: C.green },
  explanationText: { fontSize: 13, color: C.text, lineHeight: 22 },
  footer: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12, borderTopWidth: 0.5, borderTopColor: C.border },
  confirmBtn: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmBtnDisabled: { backgroundColor: C.borderLight },
  confirmBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  nextBtn: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  nextBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  doneContainer: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  doneEmoji: { fontSize: 56 },
  doneTitle: { fontSize: 26, fontWeight: '700', color: C.text },
  scoreCompare: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  scoreBox: { alignItems: 'center', gap: 4 },
  scoreBoxLabel: { fontSize: 12, color: C.textSecondary },
  scoreBoxNum: { fontSize: 36, fontWeight: '800' },
  arrow: { fontSize: 28, color: C.textSecondary },
  doneStats: { fontSize: 15, color: C.textSecondary },
  doneTopic: { fontSize: 13, color: C.textTertiary },
  doneActions: { width: '100%', gap: 10, marginTop: 8 },
  doneGreenBtn: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  doneGreenBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  doneOutlineBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 0.5, borderColor: C.border },
  doneOutlineBtnText: { color: C.textSecondary, fontSize: 15 },
});
