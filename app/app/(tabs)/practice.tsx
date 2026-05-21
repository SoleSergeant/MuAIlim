import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { api } from '../../lib/api';
import { getProfile } from '../../lib/store';
import { SUBJECT_LABELS, Subject } from '../../lib/types';

const SUBJECT_ICONS: Record<Subject, string> = {
  math: '📐', history: '📜', uzbek: '✍️',
  english: '🇬🇧', physics: '⚛️', chemistry: '🧪', biology: '🧬',
};

const QUICK_TOPICS: Record<Subject, string[]> = {
  math: ['Kvadrat tenglamalar', 'Logarifmlar', 'Trigonometriya', 'Foizlar'],
  history: ['Amir Temur davri', 'Mustaqillik davri', 'Jadidchilik', 'Ipak yo\'li'],
  uzbek: ['Gap bo\'laklari', 'So\'z turkumlari', 'Adabiyot', 'Imlo qoidalari'],
  english: ['Tenses', 'Conditionals', 'Passive Voice', 'Modal verbs'],
  physics: ['Mexanika', 'Elektr', 'Optika', 'Termodinamika'],
  chemistry: ['Kimyoviy reaksiyalar', 'Elementlar', 'Organik kimyo'],
  biology: ['Hujayra', 'Genetika', 'Ekologiya'],
};

export default function PracticeScreen() {
  const [weaknesses, setWeaknesses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(['math', 'history', 'uzbek']);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState('');

  const load = async () => {
    try {
      const p = await getProfile();
      setUserId(p.user_id);
      setSubjects(p.subjects);
      const res = await api.getWeaknessMap(p.user_id);
      setWeaknesses(res.weaknesses || []);
    } catch {
      setWeaknesses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const startPractice = (topic: string, subject: Subject) => {
    router.push({ pathname: '/personalized', params: { topic, subject } });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Mashq qilish 🎯</Text>
        <Text style={styles.subtitle}>Zaif mavzularni maqsadli ishlang</Text>
      </View>

      {/* Weakness-based suggestions */}
      {weaknesses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ZAIFLIKLARINGIZ — PRIORITY</Text>
          {weaknesses.slice(0, 5).map((w, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.weakCard, w.priority === 'high' && styles.weakCardHigh]}
              onPress={() => startPractice(w.topic, w.subject)}
            >
              <View style={styles.weakLeft}>
                <Text style={styles.weakIcon}>{SUBJECT_ICONS[w.subject as Subject] || '📚'}</Text>
                <View>
                  <Text style={styles.weakTopic}>{w.topic}</Text>
                  <Text style={styles.weakSubject}>{SUBJECT_LABELS[w.subject as Subject]}</Text>
                </View>
              </View>
              <View style={styles.weakRight}>
                <Text style={[styles.weakPct, w.accuracy_pct < 50 && { color: C.red }]}>
                  {w.accuracy_pct}%
                </Text>
                <Text style={styles.startBtn}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Mock exam CTA */}
      <TouchableOpacity style={styles.mockCta} onPress={() => router.push('/mock')}>
        <View>
          <Text style={styles.mockCtaTitle}>📝 Mock imtihon boshlash</Text>
          <Text style={styles.mockCtaSub}>10 ta savol · 3 fan · Zaifliklar aniqlanadi</Text>
        </View>
        <Text style={styles.mockCtaArrow}>→</Text>
      </TouchableOpacity>

      {/* All subjects */}
      {subjects.map((subj) => (
        <View key={subj} style={styles.section}>
          <View style={styles.subjectHeader}>
            <Text style={styles.subjectIcon}>{SUBJECT_ICONS[subj]}</Text>
            <Text style={styles.sectionTitle}>{SUBJECT_LABELS[subj].toUpperCase()}</Text>
          </View>
          <View style={styles.topicsGrid}>
            {(QUICK_TOPICS[subj] || []).map((topic) => (
              <TouchableOpacity
                key={topic}
                style={styles.topicChip}
                onPress={() => startPractice(topic, subj)}
              >
                <Text style={styles.topicChipText}>{topic}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: C.textTertiary, letterSpacing: 0.08, marginBottom: 10 },
  subjectHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  subjectIcon: { fontSize: 16 },
  weakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: C.border,
    backgroundColor: C.bgSecondary, marginBottom: 8,
  },
  weakCardHigh: { borderColor: '#FC8181', backgroundColor: '#FFF5F5' },
  weakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  weakIcon: { fontSize: 22 },
  weakTopic: { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 2 },
  weakSubject: { fontSize: 11, color: C.textSecondary },
  weakRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weakPct: { fontSize: 16, fontWeight: '700', color: C.textSecondary },
  startBtn: { fontSize: 16, color: C.green, fontWeight: '600' },
  mockCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 20, padding: 18,
    backgroundColor: C.green, borderRadius: 16,
  },
  mockCtaTitle: { fontSize: 16, fontWeight: '600', color: C.white, marginBottom: 3 },
  mockCtaSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  mockCtaArrow: { fontSize: 22, color: C.white },
  topicsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100,
    borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary,
  },
  topicChipText: { fontSize: 13, color: C.text },
});
