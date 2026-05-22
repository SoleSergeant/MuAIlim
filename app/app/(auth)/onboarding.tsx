import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { saveProfile } from '../../lib/store';
import { ExamType, Subject, EXAM_TYPE_LABELS, SUBJECT_LABELS } from '../../lib/types';
import MuAIlimLogo from '../../components/MuAIlimLogo';

// ── Subject lists ────────────────────────────────────────────────
const DTM_SUBJECTS: Subject[] = ['math', 'history', 'uzbek', 'english', 'physics', 'chemistry', 'biology'];
const SINGLE_SUBJECTS: Subject[] = ['math', 'history', 'uzbek', 'english', 'physics', 'chemistry', 'biology'];
const GRADE_GROUPS = [
  { label: '1–4 sinf (boshlang\'ich)', value: '1-4' },
  { label: '5–9 sinf (asosiy)', value: '5-9' },
  { label: '10–11 sinf (yuqori)', value: '10-11' },
];
const EXAM_TYPES: { type: ExamType; icon: string; desc: string }[] = [
  { type: 'dtm',          icon: '🎓', desc: 'Oliy ta\'limga kirish — 3 fan, 90 savol' },
  { type: 'attestat_9',   icon: '📋', desc: 'Attestatsiya imtihoni — 1 fan, 30 savol' },
  { type: 'teacher',      icon: '👨‍🏫', desc: 'O\'qituvchi attestatsiyasi — sinf va fan tanlang' },
  { type: 'national_cert',icon: '🏅', desc: 'Milliy sertifikat — 1 fan bo\'yicha chuqur tayyorgarlik' },
];

// ── Step helpers ─────────────────────────────────────────────────
function getSteps(examType: ExamType): string[] {
  if (examType === 'dtm') {
    return ['Imtihon turi', 'Fanlar', 'Maqsad ball', 'Sana & Ism', 'Tayyor'];
  }
  if (examType === 'teacher') {
    return ['Imtihon turi', 'Fan', 'Sinflar', 'Sana & Ism', 'Tayyor'];
  }
  // attestat_9, national_cert
  return ['Imtihon turi', 'Fan', 'Sana & Ism', 'Tayyor'];
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [examType, setExamType]   = useState<ExamType>('dtm');
  const [subjects, setSubjects]   = useState<Subject[]>(['math', 'history', 'uzbek']);
  const [singleSubject, setSingle] = useState<Subject>('math');
  const [grades, setGrades]       = useState<string[]>([]);
  const [goalScore, setGoalScore] = useState('189');
  const [examDate, setExamDate]   = useState('2026-07-15');
  const [name, setName]           = useState('');

  const steps = getSteps(examType);
  const totalSteps = steps.length;

  const isDtm      = examType === 'dtm';
  const isTeacher  = examType === 'teacher';
  const isSingle   = !isDtm; // attestat_9, teacher, national_cert

  // Map visual step index to logical content
  // step 0 always = exam type picker
  // then branches depending on examType

  const next = () => { if (step < totalSteps - 1) setStep(step + 1); };
  const back = () => { if (step > 0) setStep(step - 1); };

  const toggleDtmSubject = (s: Subject) => {
    setSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 3 ? [...prev, s] : prev
    );
  };

  const toggleGrade = (g: string) => {
    setGrades((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]);
  };

  const canNext = (): boolean => {
    if (step === 1 && isDtm)     return subjects.length > 0;
    if (step === 1 && isSingle)  return true; // singleSubject always set
    if (step === 2 && isTeacher) return grades.length > 0;
    return true;
  };

  const finish = async () => {
    const finalSubjects = isDtm ? subjects : [singleSubject];
    await saveProfile({
      user_id:      `user_${Date.now()}`,
      display_name: name || (isTeacher ? "O'qituvchi" : "O'quvchi"),
      exam_type:    examType,
      subjects:     finalSubjects,
      goal_score:   isDtm ? (parseInt(goalScore) || 160) : 100,
      exam_date:    examDate,
      streak:       0,
      is_premium:   false,
      grade_levels: isTeacher ? grades : [],
    });
    router.replace(isTeacher ? '/(teacher)' : '/(tabs)');
  };

  // ── Render helpers ───────────────────────────────────────────
  const renderStep = () => {
    // STEP 0 — exam type (all flows)
    if (step === 0) return (
      <View style={styles.section}>
        <Text style={styles.question}>Qaysi imtihonga tayyorlanasiz?</Text>
        {EXAM_TYPES.map(({ type, icon, desc }) => (
          <TouchableOpacity
            key={type}
            style={[styles.optionCard, examType === type && styles.optionCardActive]}
            onPress={() => {
              setExamType(type);
              // reset dependent state
              setSubjects(['math', 'history', 'uzbek']);
              setSingle('math');
              setGrades([]);
            }}
          >
            <View style={styles.optionRow}>
              <Text style={styles.optionIcon}>{icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.optionText, examType === type && styles.optionTextActive]}>
                  {EXAM_TYPE_LABELS[type]}
                </Text>
                <Text style={[styles.optionDesc, examType === type && styles.optionDescActive]}>
                  {desc}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );

    // ── DTM FLOW ─────────────────────────────────────────────
    if (isDtm) {
      if (step === 1) return (
        <View style={styles.section}>
          <Text style={styles.question}>3 ta fan tanlang</Text>
          <Text style={styles.hint}>Tanlangan: {subjects.length}/3</Text>
          <View style={styles.subjectsGrid}>
            {DTM_SUBJECTS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.subjectChip, subjects.includes(s) && styles.subjectChipActive]}
                onPress={() => toggleDtmSubject(s)}
              >
                <Text style={[styles.subjectText, subjects.includes(s) && styles.subjectTextActive]}>
                  {SUBJECT_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );

      if (step === 2) return (
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
          <Text style={styles.hint}>Kirish imtixoni maksimal ball: 200 (har fandan 66.6)</Text>
          <View style={styles.quickRow}>
            {['140', '160', '180', '189'].map((v) => (
              <TouchableOpacity key={v} style={[styles.quickBtn, goalScore === v && styles.quickBtnActive]}
                onPress={() => setGoalScore(v)}>
                <Text style={[styles.quickBtnText, goalScore === v && styles.quickBtnTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );

      if (step === 3) return <DateNameStep examDate={examDate} setExamDate={setExamDate} name={name} setName={setName} hint="Kirish imtixoni sanasi" />;

      if (step === 4) return (
        <SummaryStep rows={[
          { label: 'Imtihon', value: EXAM_TYPE_LABELS[examType] },
          { label: 'Fanlar',  value: subjects.map((s) => SUBJECT_LABELS[s]).join(', ') },
          { label: 'Maqsad', value: `${goalScore} ball` },
          { label: 'Sana',   value: examDate },
          { label: 'Ism',    value: name || "O'quvchi" },
        ]} />
      );
    }

    // ── TEACHER FLOW ────────────────────────────────────────
    if (isTeacher) {
      if (step === 1) return (
        <SingleSubjectStep subject={singleSubject} setSubject={setSingle}
          title="Qaysi fandan o'qitasiz?"
          hint="Dars beruvchi fan — shu bo'yicha testlar va mavzular tayyorlanadi" />
      );

      if (step === 2) return (
        <View style={styles.section}>
          <Text style={styles.question}>Qaysi sinflarda dars berasiz?</Text>
          <Text style={styles.hint}>Bir yoki bir nechta tanlang</Text>
          {GRADE_GROUPS.map(({ label, value }) => (
            <TouchableOpacity
              key={value}
              style={[styles.optionCard, grades.includes(value) && styles.optionCardActive]}
              onPress={() => toggleGrade(value)}
            >
              <Text style={[styles.optionText, grades.includes(value) && styles.optionTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );

      if (step === 3) return <DateNameStep examDate={examDate} setExamDate={setExamDate} name={name} setName={setName} hint="Attestatsiya sanasi (taxminiy)" />;

      if (step === 4) return (
        <SummaryStep rows={[
          { label: 'Imtihon', value: EXAM_TYPE_LABELS[examType] },
          { label: 'Fan',     value: SUBJECT_LABELS[singleSubject] },
          { label: 'Sinflar', value: grades.join(', ') || '—' },
          { label: 'Sana',   value: examDate },
          { label: 'Ism',    value: name || "O'qituvchi" },
        ]} />
      );
    }

    // ── ATTESTAT_9 & NATIONAL_CERT FLOW ────────────────────
    if (step === 1) return (
      <SingleSubjectStep subject={singleSubject} setSubject={setSingle}
        title="Imtihon fani"
        hint="Shu fan bo'yicha topik savollar va mashqlar tayyorlanadi" />
    );

    if (step === 2) return <DateNameStep examDate={examDate} setExamDate={setExamDate} name={name} setName={setName} hint="Imtihon sanasi (taxminiy)" />;

    if (step === 3) return (
      <SummaryStep rows={[
        { label: 'Imtihon', value: EXAM_TYPE_LABELS[examType] },
        { label: 'Fan',     value: SUBJECT_LABELS[singleSubject] },
        { label: 'Sana',   value: examDate },
        { label: 'Ism',    value: name || "O'quvchi" },
      ]} />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <MuAIlimLogo size="small" />
          <Text style={styles.stepCount}>{step + 1} / {totalSteps}</Text>
        </View>
        <View style={styles.progressRow}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>{steps[step]}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
        {renderStep()}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={back}>
            <Text style={styles.backBtnText}>← Orqaga</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, step === 0 && { flex: 1 }, !canNext() && styles.nextBtnDisabled]}
          onPress={step === totalSteps - 1 ? finish : next}
          disabled={!canNext()}
        >
          <Text style={styles.nextBtnText}>
            {step === totalSteps - 1 ? 'Boshlash 🚀' : 'Keyingisi →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Reusable sub-components ──────────────────────────────────────

function SingleSubjectStep({ subject, setSubject, title, hint }: {
  subject: Subject; setSubject: (s: Subject) => void; title: string; hint: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.question}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
      {SINGLE_SUBJECTS.map((s) => (
        <TouchableOpacity
          key={s}
          style={[styles.optionCard, subject === s && styles.optionCardActive]}
          onPress={() => setSubject(s)}
        >
          <Text style={[styles.optionText, subject === s && styles.optionTextActive]}>
            {SUBJECT_LABELS[s]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function DateNameStep({ examDate, setExamDate, name, setName, hint }: {
  examDate: string; setExamDate: (v: string) => void;
  name: string; setName: (v: string) => void; hint: string;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.question}>Sana va ismingiz</Text>
      <Text style={styles.hint}>{hint}</Text>
      <TextInput
        style={styles.input}
        value={examDate}
        onChangeText={setExamDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={C.textTertiary}
      />
      <TextInput
        style={[styles.input, { marginTop: 14 }]}
        value={name}
        onChangeText={setName}
        placeholder="Ismingiz (ixtiyoriy)"
        placeholderTextColor={C.textTertiary}
      />
    </View>
  );
}

function SummaryStep({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <View style={styles.section}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Sozlamalar tayyor ✓</Text>
        {rows.map(({ label, value }) => (
          <View key={label} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{label}:</Text>
            <Text style={styles.summaryValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.borderLight },
  progressDotActive: { backgroundColor: C.green },
  stepLabel: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 4 },
  stepCount: { fontSize: 13, color: C.textSecondary },
  body: { flex: 1, paddingHorizontal: 24 },
  section: { paddingTop: 8 },
  question: { fontSize: 17, fontWeight: '600', color: C.text, marginBottom: 8 },
  hint: { fontSize: 13, color: C.textSecondary, marginBottom: 16 },

  optionCard: {
    padding: 16, borderRadius: 12, borderWidth: 0.5,
    borderColor: C.border, marginBottom: 10, backgroundColor: C.bgSecondary,
  },
  optionCardActive: { borderColor: C.green, backgroundColor: C.greenLight },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionIcon: { fontSize: 22 },
  optionText: { fontSize: 15, color: C.text, fontWeight: '500' },
  optionTextActive: { color: C.greenDark },
  optionDesc: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  optionDescActive: { color: C.greenDark },

  subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  subjectChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
    borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary,
  },
  subjectChipActive: { backgroundColor: C.greenLight, borderColor: C.greenBorder },
  subjectText: { fontSize: 14, color: C.textSecondary },
  subjectTextActive: { color: C.greenDark, fontWeight: '500' },

  quickRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  quickBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary, alignItems: 'center',
  },
  quickBtnActive: { backgroundColor: C.greenLight, borderColor: C.green },
  quickBtnText: { fontSize: 14, color: C.text },
  quickBtnTextActive: { color: C.greenDark, fontWeight: '600' },

  input: {
    borderWidth: 0.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: C.text,
    backgroundColor: C.bgSecondary,
  },

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
  nextBtn: { flex: 1, backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: C.borderLight },
  nextBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
});
