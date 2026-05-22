import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal,
} from 'react-native';
import { C } from '../../constants/colors';

const API = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const DEMO_CODE = 'MUA-2026';

const FALLBACK_STUDENTS: Student[] = [
  { id: 's1', name: 'Kamola Yusupova', score_pct: 72, streak: 5, mock_count: 4, avg_time_per_q: 58,
    weak_topics: [{ topic: 'Kvadrat tenglamalar', accuracy_pct: 33, priority: 'high' }, { topic: 'Logarifm', accuracy_pct: 45, priority: 'high' }],
    by_subject: { math: { correct: 21, total: 30 } } },
  { id: 's2', name: 'Bobur Rahimov', score_pct: 55, streak: 2, mock_count: 2, avg_time_per_q: 74,
    weak_topics: [{ topic: 'Geometriya', accuracy_pct: 28, priority: 'high' }, { topic: 'Trigonometriya', accuracy_pct: 40, priority: 'high' }],
    by_subject: { math: { correct: 16, total: 30 } } },
  { id: 's3', name: 'Malika Toshmatova', score_pct: 88, streak: 14, mock_count: 7, avg_time_per_q: 44,
    weak_topics: [{ topic: 'Integral', accuracy_pct: 60, priority: 'medium' }],
    by_subject: { math: { correct: 26, total: 30 } } },
  { id: 's4', name: 'Jasur Mirzayev', score_pct: 61, streak: 7, mock_count: 5, avg_time_per_q: 63,
    weak_topics: [{ topic: 'Logarifm', accuracy_pct: 35, priority: 'high' }, { topic: 'Funksiyalar', accuracy_pct: 50, priority: 'medium' }],
    by_subject: { math: { correct: 18, total: 30 } } },
  { id: 's5', name: 'Zulfiya Nazarova', score_pct: 79, streak: 3, mock_count: 3, avg_time_per_q: 51,
    weak_topics: [{ topic: 'Trigonometriya', accuracy_pct: 55, priority: 'medium' }],
    by_subject: { math: { correct: 23, total: 30 } } },
];

interface Student {
  id: string;
  name: string;
  score_pct: number;
  streak: number;
  mock_count: number;
  avg_time_per_q: number;
  weak_topics: { topic: string; accuracy_pct: number; priority: string }[];
  by_subject: Record<string, { correct: number; total: number }>;
}

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Student | null>(null);

  useEffect(() => {
    fetch(`${API}/api/teacher/class/${DEMO_CODE}`)
      .then(r => r.json())
      .then(d => setStudents(d.students?.length ? d.students : FALLBACK_STUDENTS))
      .catch(() => setStudents(FALLBACK_STUDENTS))
      .finally(() => setLoading(false));
  }, []);

  const scoreColor = (pct: number) => pct >= 70 ? C.green : pct >= 50 ? C.orange : C.red;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>O'quvchilar</Text>
        <Text style={styles.count}>{students.length} ta</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={C.green} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {students.map(s => (
            <TouchableOpacity key={s.id} style={styles.card} onPress={() => setSelected(s)}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{s.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.studentName}>{s.name}</Text>
                  <Text style={styles.studentMeta}>
                    {s.mock_count} mock · {s.streak} kunlik streak
                  </Text>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: scoreColor(s.score_pct) + '20' }]}>
                  <Text style={[styles.scoreText, { color: scoreColor(s.score_pct) }]}>
                    {s.score_pct}%
                  </Text>
                </View>
              </View>

              {/* Score bar */}
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${s.score_pct}%`, backgroundColor: scoreColor(s.score_pct) }]} />
              </View>

              {/* Top weak topic */}
              {s.weak_topics[0] && (
                <View style={styles.weakRow}>
                  <Text style={styles.weakLabel}>⚠ Zaif: </Text>
                  <Text style={styles.weakValue}>{s.weak_topics[0].topic} ({s.weak_topics[0].accuracy_pct}%)</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Student detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalAvatar}>
                <Text style={styles.modalAvatarText}>{selected.name[0]}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalName}>{selected.name}</Text>
                <Text style={styles.modalMeta}>{selected.mock_count} ta mock · {selected.streak} kunlik streak</Text>
              </View>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              {/* Score */}
              <View style={[styles.scoreCard, { borderColor: scoreColor(selected.score_pct) + '40' }]}>
                <Text style={[styles.bigScore, { color: scoreColor(selected.score_pct) }]}>
                  {selected.score_pct}%
                </Text>
                <Text style={styles.bigScoreLabel}>O'rtacha natija</Text>
              </View>

              {/* Stats */}
              <View style={styles.metaRow}>
                <MetaStat label="Mock soni" value={`${selected.mock_count} ta`} />
                <MetaStat label="Streak" value={`🔥 ${selected.streak} kun`} />
                <MetaStat label="Avg vaqt" value={`${selected.avg_time_per_q}s/savol`}
                  color={selected.avg_time_per_q > 70 ? C.orange : C.green} />
              </View>

              {/* Weak topics */}
              <Text style={styles.sectionTitle}>ZAIF MAVZULAR</Text>
              {selected.weak_topics.length === 0 ? (
                <Text style={styles.emptyText}>Zaif mavzu aniqlanmadi ✓</Text>
              ) : selected.weak_topics.map((w, i) => (
                <View key={i} style={styles.weakCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.weakTopic}>{w.topic}</Text>
                    <View style={styles.weakBarBg}>
                      <View style={[styles.weakBarFill, {
                        width: `${w.accuracy_pct}%`,
                        backgroundColor: w.priority === 'high' ? C.red : C.orange,
                      }]} />
                    </View>
                  </View>
                  <Text style={[styles.weakPct, { color: w.priority === 'high' ? C.red : C.orange }]}>
                    {w.accuracy_pct}%
                  </Text>
                </View>
              ))}

              {/* Timing warning */}
              {selected.avg_time_per_q > 70 && (
                <View style={styles.warningCard}>
                  <Text style={styles.warningText}>
                    ⚠ Har savolga o'rtacha {selected.avg_time_per_q}s sarflayapti — me'yordan sekin (60s). Tushunish yoki yodlash muammosi bo'lishi mumkin.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

function MetaStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View style={styles.metaStat}>
      <Text style={[styles.metaValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  title: { fontSize: 24, fontWeight: '700', color: C.text },
  count: { fontSize: 14, color: C.textSecondary },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: C.bgSecondary, borderRadius: 16, padding: 16,
    borderWidth: 0.5, borderColor: C.border, gap: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: C.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: C.greenDark },
  studentName: { fontSize: 15, fontWeight: '600', color: C.text },
  studentMeta: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  scoreText: { fontSize: 14, fontWeight: '700' },
  barBg: { height: 6, borderRadius: 3, backgroundColor: C.borderLight, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  weakRow: { flexDirection: 'row' },
  weakLabel: { fontSize: 12, color: C.textSecondary },
  weakValue: { fontSize: 12, color: C.text, fontWeight: '500', flex: 1 },

  // Modal
  modal: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 20, paddingTop: 24, borderBottomWidth: 0.5, borderBottomColor: C.border,
  },
  modalAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: C.greenLight,
    alignItems: 'center', justifyContent: 'center',
  },
  modalAvatarText: { fontSize: 22, fontWeight: '700', color: C.greenDark },
  modalName: { fontSize: 18, fontWeight: '700', color: C.text },
  modalMeta: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  closeBtn: { fontSize: 18, color: C.textSecondary, padding: 4 },
  modalBody: { padding: 20, gap: 16 },
  scoreCard: {
    alignItems: 'center', padding: 24, borderRadius: 20,
    borderWidth: 1, backgroundColor: C.bgSecondary,
  },
  bigScore: { fontSize: 52, fontWeight: '800' },
  bigScoreLabel: { fontSize: 14, color: C.textSecondary, marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 10 },
  metaStat: {
    flex: 1, backgroundColor: C.bgSecondary, borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 0.5, borderColor: C.border, gap: 4,
  },
  metaValue: { fontSize: 16, fontWeight: '700', color: C.text },
  metaLabel: { fontSize: 11, color: C.textSecondary, textAlign: 'center' },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: C.textTertiary, letterSpacing: 0.5 },
  weakCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.bgSecondary, borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: C.border,
  },
  weakTopic: { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 8 },
  weakBarBg: { height: 6, borderRadius: 3, backgroundColor: C.borderLight, overflow: 'hidden' },
  weakBarFill: { height: '100%', borderRadius: 3 },
  weakPct: { fontSize: 16, fontWeight: '700', minWidth: 44, textAlign: 'right' },
  warningCard: { backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: '#FFE082' },
  warningText: { fontSize: 13, color: '#7C5500', lineHeight: 20 },
  emptyText: { fontSize: 14, color: C.green, textAlign: 'center', padding: 16 },
});
