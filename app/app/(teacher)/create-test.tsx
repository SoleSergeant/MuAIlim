import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Clipboard,
} from 'react-native';
import { C } from '../../constants/colors';
import { getProfile } from '../../lib/store';
import { SUBJECT_LABELS, Subject } from '../../lib/types';

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

// Real topics matching the uploaded question bank
const TOPICS_BY_SUBJECT: Record<string, string[]> = {
  math: [
    'Kvadrat tenglamalar',
    'Chiziqli tenglamalar sistemasi',
    'Chiziqli tengsizliklar',
    'Modulli tenglamalar',
    "Qisqa ko'paytirish formulalari",
    'Logarifm',
    'Trigonometriya',
    'Geometriya',
  ],
  history: [
    'Amir Temur davri',
    'Mustaqillik davri',
    'Sovet davri',
    "Qadimgi O'zbek davlatlari",
    'Ikkinchi Jahon urushi',
    'Buxoro xonligining tashkil topishi',
    'Dashti qipchoqdagi siyosiy vaziyat',
    "Zahiriddin Muhammad Bobur va Muhammad Shayboniyxon munosabatlari",
  ],
  uzbek: [
    "Gap bo'laklari",
    "So'z turkumlari",
    'Imlo qoidalari',
    'Morfologiya',
    'Sintaksis',
    'Adabiyot',
  ],
  english: ['Grammar', 'Vocabulary', 'Reading', 'Writing'],
  physics: ['Mexanika', 'Elektr', 'Optika', 'Termodinamika'],
  chemistry: ['Kimyoviy reaksiyalar', 'Davriy jadval', 'Organik kimyo'],
  biology: ['Hujayra', 'Genetika', 'Ekologiya', 'Evolyutsiya'],
};

const DIFFICULTIES = [
  { value: 'easy',   label: 'Oson',    desc: '1-4 sinf darajasi' },
  { value: 'medium', label: "O'rta",   desc: '5-9 sinf darajasi' },
  { value: 'hard',   label: 'Qiyin',   desc: '10-11 sinf darajasi' },
];

const GRADES = ['1-4', '5-9', '10-11'];
const SUBJECTS = ['math', 'history', 'uzbek', 'english', 'physics', 'chemistry', 'biology'] as Subject[];

export default function CreateTestScreen() {
  const [subject, setSubject] = useState<Subject>('math');
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [grade, setGrade] = useState('5-9');
  const [count, setCount] = useState('10');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdTest, setCreatedTest] = useState<any>(null);

  const finalTopic = customTopic.trim() || topic;
  const canCreate = finalTopic.length > 0;

  const handleCreate = async () => {
    if (!canCreate) return;
    setLoading(true);
    setCreatedTest(null);
    try {
      const profile = await getProfile();
      const res = await fetch(`${API}/api/teacher/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: profile.user_id,
          subject,
          topic: finalTopic,
          grade,
          difficulty,
          question_count: parseInt(count) || 10,
          title: title.trim() || `${finalTopic} — ${grade} sinf`,
        }),
      });
      const data = await res.json();
      setCreatedTest(data);
    } catch {
      Alert.alert('Xatolik', 'Test yaratishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  if (createdTest) {
    const testCode = createdTest.id ?? '';
    const copyCode = () => {
      Clipboard.setString(testCode);
      Alert.alert('Nusxalandi! ✓', `"${testCode}" bufer xotirasiga saqlandi. O'quvchilarga yuboring.`);
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Test nashr etildi ✓</Text>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          {/* Success + code */}
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>{createdTest.title}</Text>
            <Text style={styles.successMeta}>
              {createdTest.question_count} ta savol · {SUBJECT_LABELS[subject as Subject]} · {grade}-sinf
            </Text>
          </View>

          {/* Share code */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>TEST KODI</Text>
            <Text style={styles.codeValue}>{testCode}</Text>
            <Text style={styles.codeHint}>O'quvchilar Mashq ekranida shu kodni kiritib testni yechadi</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={copyCode}>
              <Text style={styles.copyBtnText}>📋 Kodni nusxalash</Text>
            </TouchableOpacity>
          </View>

          {/* Questions preview */}
          <Text style={styles.sectionTitle}>SAVOLLAR KO'RINISHI ({createdTest.questions?.length ?? 0} ta)</Text>
          {(createdTest.questions ?? []).map((q: any, i: number) => (
            <View key={i} style={styles.questionCard}>
              <Text style={styles.questionNum}>{i + 1}.</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.questionText}>{q.text}</Text>
                {(q.options ?? []).map((opt: string, j: number) => (
                  <Text key={j} style={[styles.option, j === q.correct_index && styles.optionCorrect]}>
                    {['A', 'B', 'C', 'D'][j]}. {opt}
                  </Text>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.newBtn} onPress={() => setCreatedTest(null)}>
            <Text style={styles.newBtnText}>+ Yangi test yaratish</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Test yaratish ✏️</Text>
        <Text style={styles.subtitle}>AI yordamida mavzuga test yarating</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Subject */}
        <Text style={styles.label}>Fan</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          {SUBJECTS.map(s => (
            <TouchableOpacity key={s}
              style={[styles.chip, subject === s && styles.chipActive]}
              onPress={() => { setSubject(s); setTopic(''); }}>
              <Text style={[styles.chipText, subject === s && styles.chipTextActive]}>
                {SUBJECT_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Topic */}
        <Text style={styles.label}>Mavzu</Text>
        <View style={styles.topicsGrid}>
          {(TOPICS_BY_SUBJECT[subject] ?? []).map(t => (
            <TouchableOpacity key={t}
              style={[styles.topicChip, topic === t && styles.topicChipActive]}
              onPress={() => { setTopic(t); setCustomTopic(''); }}>
              <Text style={[styles.topicText, topic === t && styles.topicTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={customTopic}
          onChangeText={(v) => { setCustomTopic(v); setTopic(''); }}
          placeholder="Yoki o'z mavzuingizni yozing..."
          placeholderTextColor={C.textTertiary}
        />

        {/* Grade */}
        <Text style={styles.label}>Sinf</Text>
        <View style={styles.row}>
          {GRADES.map(g => (
            <TouchableOpacity key={g}
              style={[styles.gradeBtn, grade === g && styles.gradeBtnActive]}
              onPress={() => setGrade(g)}>
              <Text style={[styles.gradeBtnText, grade === g && styles.gradeBtnTextActive]}>{g}-sinf</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Difficulty */}
        <Text style={styles.label}>Qiyinlik darajasi</Text>
        {DIFFICULTIES.map(d => (
          <TouchableOpacity key={d.value}
            style={[styles.diffCard, difficulty === d.value && styles.diffCardActive]}
            onPress={() => setDifficulty(d.value)}>
            <Text style={[styles.diffLabel, difficulty === d.value && styles.diffLabelActive]}>{d.label}</Text>
            <Text style={styles.diffDesc}>{d.desc}</Text>
          </TouchableOpacity>
        ))}

        {/* Count */}
        <Text style={styles.label}>Savollar soni</Text>
        <View style={styles.row}>
          {['5', '10', '15', '20'].map(n => (
            <TouchableOpacity key={n}
              style={[styles.countBtn, count === n && styles.countBtnActive]}
              onPress={() => setCount(n)}>
              <Text style={[styles.countBtnText, count === n && styles.countBtnTextActive]}>{n} ta</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Title */}
        <Text style={styles.label}>Test nomi (ixtiyoriy)</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={`${finalTopic || 'Mavzu'} — ${grade} sinf`}
          placeholderTextColor={C.textTertiary}
        />

        {/* Create button */}
        <TouchableOpacity
          style={[styles.createBtn, (!canCreate || loading) && styles.createBtnDisabled]}
          onPress={handleCreate}
          disabled={!canCreate || loading}>
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <ActivityIndicator color={C.white} size="small" />
              <Text style={styles.createBtnText}>AI test yaratyapti...</Text>
            </View>
          ) : (
            <Text style={styles.createBtnText}>🤖 Test yaratish</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  title: { fontSize: 24, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 14, color: C.textSecondary, marginTop: 4 },
  body: { padding: 20, gap: 12, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: C.textSecondary, marginTop: 4 },
  chipScroll: { marginHorizontal: -4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, marginRight: 8,
    backgroundColor: C.bgSecondary, borderWidth: 0.5, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.greenLight, borderColor: C.green },
  chipText: { fontSize: 13, color: C.textSecondary },
  chipTextActive: { color: C.greenDark, fontWeight: '600' },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    backgroundColor: C.bgSecondary, borderWidth: 0.5, borderColor: C.border,
  },
  topicChipActive: { backgroundColor: C.greenLight, borderColor: C.green },
  topicText: { fontSize: 13, color: C.textSecondary },
  topicTextActive: { color: C.greenDark, fontWeight: '500' },
  input: {
    borderWidth: 0.5, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.text,
    backgroundColor: C.bgSecondary,
  },
  row: { flexDirection: 'row', gap: 8 },
  gradeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: C.bgSecondary, borderWidth: 0.5, borderColor: C.border,
  },
  gradeBtnActive: { backgroundColor: C.greenLight, borderColor: C.green },
  gradeBtnText: { fontSize: 13, color: C.textSecondary },
  gradeBtnTextActive: { color: C.greenDark, fontWeight: '600' },
  diffCard: {
    padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary,
  },
  diffCardActive: { borderColor: C.green, backgroundColor: C.greenLight },
  diffLabel: { fontSize: 15, fontWeight: '600', color: C.text },
  diffLabelActive: { color: C.greenDark },
  diffDesc: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  countBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center',
    backgroundColor: C.bgSecondary, borderWidth: 0.5, borderColor: C.border,
  },
  countBtnActive: { backgroundColor: C.greenLight, borderColor: C.green },
  countBtnText: { fontSize: 13, color: C.textSecondary },
  countBtnTextActive: { color: C.greenDark, fontWeight: '600' },
  createBtn: { backgroundColor: C.green, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  createBtnDisabled: { backgroundColor: C.borderLight },
  createBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  // Success state
  successCard: {
    alignItems: 'center', backgroundColor: C.greenLight, borderRadius: 20,
    padding: 28, borderWidth: 0.5, borderColor: C.greenBorder,
  },
  successIcon: { fontSize: 48, marginBottom: 12 },
  successTitle: { fontSize: 18, fontWeight: '700', color: C.text, textAlign: 'center' },
  successMeta: { fontSize: 13, color: C.textSecondary, marginTop: 6 },
  codeCard: {
    backgroundColor: C.bg, borderRadius: 16, padding: 20,
    borderWidth: 1.5, borderColor: C.green, alignItems: 'center', gap: 8,
  },
  codeLabel: { fontSize: 11, fontWeight: '700', color: C.textTertiary, letterSpacing: 1 },
  codeValue: {
    fontSize: 18, fontWeight: '800', color: C.green, letterSpacing: 2,
    fontFamily: 'monospace', textAlign: 'center',
  },
  codeHint: { fontSize: 12, color: C.textSecondary, textAlign: 'center', lineHeight: 18 },
  copyBtn: {
    backgroundColor: C.green, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 100, marginTop: 4,
  },
  copyBtnText: { color: C.white, fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.textTertiary, letterSpacing: 0.5 },
  questionCard: {
    flexDirection: 'row', gap: 10, backgroundColor: C.bgSecondary,
    borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: C.border,
  },
  questionNum: { fontSize: 14, fontWeight: '700', color: C.green, minWidth: 20 },
  questionText: { fontSize: 14, color: C.text, fontWeight: '500', marginBottom: 8, lineHeight: 20 },
  option: { fontSize: 13, color: C.textSecondary, marginBottom: 4, paddingLeft: 4 },
  optionCorrect: { color: C.green, fontWeight: '600' },
  newBtn: {
    paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 0.5, borderColor: C.border, marginTop: 8,
  },
  newBtnText: { color: C.textSecondary, fontSize: 15 },
});
