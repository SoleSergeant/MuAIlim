import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { saveProfile } from '../../lib/store';
import { ExamType, Subject, EXAM_TYPE_LABELS, SUBJECT_LABELS } from '../../lib/types';

const STEPS = ['Imtihon turi', 'Fanlar', 'Maqsad ball', 'Imtihon sanasi', 'Tayyor'];
const ALL_SUBJECTS: Subject[] = ['math', 'history', 'uzbek', 'english', 'physics', 'chemistry', 'biology'];
const EXAM_TYPES: ExamType[] = ['dtm', 'attestat_9', 'teacher', 'national_cert'];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [examType, setExamType] = useState<ExamType>('dtm');
  const [subjects, setSubjects] = useState<Subject[]>(['math', 'history', 'uzbek']);
  const [goalScore, setGoalScore] = useState('189');
  const [examDate, setExamDate] = useState('2026-07-15');
  const [name, setName] = useState('');

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const toggleSubject = (s: Subject) => {
    setSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 3 ? [...prev, s] : prev
    );
  };

  const finish = async () => {
    await saveProfile({
      user_id: `user_${Date.now()}`,
      display_name: name || "O'quvchi",
      exam_type: examType,
      subjects,
      goal_score: parseInt(goalScore) || 160,
      exam_date: examDate,
      streak: 0,
      is_premium: false,
    });
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressRow}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>{STEPS[step]}</Text>
        <Text style={styles.stepCount}>{step + 1} / {STEPS.length}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
        {step === 0 && (
          <View style={styles.section}>
            <Text style={styles.question}>Qaysi imtihonga tayyorlanasiz?</Text>
            {EXAM_TYPES.map((et) => (
              <TouchableOpacity
                key={et}
                style={[styles.optionCard, examType === et && styles.optionCardActive]}
                onPress={() => setExamType(et)}
              >
                <Text style={[styles.optionText, examType === et && styles.optionTextActive]}>
                  {EXAM_TYPE_LABELS[et]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 1 && (
          <View style={styles.section}>
            <Text style={styles.question}>Fanlarni tanlang (max 3)</Text>
            <Text style={styles.hint}>Tanlangan: {subjects.length}/3</Text>
            <View style={styles.subjectsGrid}>
              {ALL_SUBJECTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.subjectChip, subjects.includes(s) && styles.subjectChipActive]}
                  onPress={() => toggleSubject(s)}
                >
                  <Text style={[styles.subjectText, subjects.includes(s) && styles.subjectTextActive]}>
                    {SUBJECT_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.section}>
            <Text style={styles.question}>Maqsad ball (200 dan)</Text>
            <TextInput
              style={styles.input}
              value={goalScore}
              onChangeText={setGoalScore}
              keyboardType="numeric"
              placeholder="Masalan: 189"
              placeholderTextColor={C.textTertiary}
              maxLength={3}
            />
            <Text style={styles.hint}>DTM maksimal ball: 200 ta (har 3 fandan 66.6)</Text>
            {['140', '160', '180', '189'].map((v) => (
              <TouchableOpacity key={v} style={styles.quickBtn} onPress={() => setGoalScore(v)}>
                <Text style={styles.quickBtnText}>{v} ball</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {step === 3 && (
          <View style={styles.section}>
            <Text style={styles.question}>Imtihon sanasi</Text>
            <TextInput
              style={styles.input}
              value={examDate}
              onChangeText={setExamDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.textTertiary}
            />
            <Text style={styles.hint}>AI o'qish rejasini shu sanaga qarab tuzadi</Text>
            <TextInput
              style={[styles.input, { marginTop: 16 }]}
              value={name}
              onChangeText={setName}
              placeholder="Ismingiz (ixtiyoriy)"
              placeholderTextColor={C.textTertiary}
            />
          </View>
        )}

        {step === 4 && (
          <View style={styles.section}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Sozlamalar tayyor ✓</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Imtihon:</Text>
                <Text style={styles.summaryValue}>{EXAM_TYPE_LABELS[examType]}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fanlar:</Text>
                <Text style={styles.summaryValue}>{subjects.map((s) => SUBJECT_LABELS[s]).join(', ')}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Maqsad:</Text>
                <Text style={styles.summaryValue}>{goalScore} ball</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sana:</Text>
                <Text style={styles.summaryValue}>{examDate}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(step - 1)}>
            <Text style={styles.backBtnText}>← Orqaga</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, step === 0 && { flex: 1 }]}
          onPress={step === STEPS.length - 1 ? finish : next}
        >
          <Text style={styles.nextBtnText}>
            {step === STEPS.length - 1 ? 'Boshlash 🚀' : 'Keyingisi →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.borderLight },
  progressDotActive: { backgroundColor: C.green },
  stepLabel: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  stepCount: { fontSize: 13, color: C.textSecondary },
  body: { flex: 1, paddingHorizontal: 24 },
  section: { paddingTop: 8 },
  question: { fontSize: 17, fontWeight: '600', color: C.text, marginBottom: 16 },
  hint: { fontSize: 13, color: C.textSecondary, marginBottom: 16 },
  optionCard: {
    padding: 16, borderRadius: 12, borderWidth: 0.5,
    borderColor: C.border, marginBottom: 10, backgroundColor: C.bgSecondary,
  },
  optionCardActive: { borderColor: C.green, backgroundColor: C.greenLight },
  optionText: { fontSize: 15, color: C.text, fontWeight: '500' },
  optionTextActive: { color: C.greenDark },
  subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  subjectChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
    borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary,
  },
  subjectChipActive: { backgroundColor: C.greenLight, borderColor: C.greenBorder },
  subjectText: { fontSize: 14, color: C.textSecondary },
  subjectTextActive: { color: C.greenDark, fontWeight: '500' },
  input: {
    borderWidth: 0.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.text,
    backgroundColor: C.bgSecondary,
  },
  quickBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10,
    borderWidth: 0.5, borderColor: C.border, marginTop: 8, backgroundColor: C.bgSecondary,
  },
  quickBtnText: { fontSize: 14, color: C.text },
  summaryCard: {
    backgroundColor: C.greenLight, borderRadius: 16, padding: 20,
    borderWidth: 0.5, borderColor: C.greenBorder,
  },
  summaryTitle: { fontSize: 18, fontWeight: '600', color: C.greenDark, marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: C.textSecondary },
  summaryValue: { fontSize: 14, color: C.text, fontWeight: '500', flex: 1, textAlign: 'right' },
  footer: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    borderTopWidth: 0.5, borderTopColor: C.border,
  },
  backBtn: {
    paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14,
    borderWidth: 0.5, borderColor: C.border,
  },
  backBtnText: { fontSize: 15, color: C.textSecondary },
  nextBtn: {
    flex: 1, backgroundColor: C.green, paddingVertical: 16,
    borderRadius: 14, alignItems: 'center',
  },
  nextBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
});
