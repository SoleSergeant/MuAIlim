import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { C } from '../../constants/colors';
import { api } from '../../lib/api';
import { getProfile } from '../../lib/store';
import { SUBJECT_LABELS, Subject } from '../../lib/types';

export default function NotebookScreen() {
  const [cards, setCards] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCard, setActiveCard] = useState<any | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [userId, setUserId] = useState('');

  const load = async () => {
    try {
      const p = await getProfile();
      setUserId(p.user_id);
      const [dueRes] = await Promise.all([
        api.getNotebookDue(p.user_id),
      ]);
      setCards(dueRes.cards);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const reviewCard = async (card: any, correct: boolean) => {
    try {
      await api.reviewCard(card.id, userId, correct);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
    } catch { }
    setActiveCard(null);
    setRevealed(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Xatolar daftari 📒</Text>
        <Text style={styles.subtitle}>Spaced repetition — noto'g'ri javoblar qaytadi</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : activeCard ? (
        <View style={styles.cardContainer}>
          <View style={styles.flashcard}>
            <View style={styles.flashcardBadge}>
              <Text style={styles.flashcardBadgeText}>
                {SUBJECT_LABELS[activeCard.subject as Subject] ?? activeCard.subject} · {activeCard.topic}
              </Text>
            </View>
            <Text style={styles.flashcardQuestion}>{activeCard.question_text}</Text>
            {!revealed ? (
              <TouchableOpacity style={styles.revealBtn} onPress={() => setRevealed(true)}>
                <Text style={styles.revealBtnText}>Javobni ko'rsatish</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.answerArea}>
                <View style={styles.answerBox}>
                  <Text style={styles.answerLabel}>To'g'ri javob:</Text>
                  <Text style={styles.answerText}>{activeCard.correct_answer}</Text>
                </View>
                <Text style={styles.ratePrompt}>Bilding mi?</Text>
                <View style={styles.rateRow}>
                  <TouchableOpacity style={styles.rateNo} onPress={() => reviewCard(activeCard, false)}>
                    <Text style={styles.rateNoText}>✗ Bilmadim</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rateYes} onPress={() => reviewCard(activeCard, true)}>
                    <Text style={styles.rateYesText}>✓ Bildim</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={() => { setActiveCard(null); setRevealed(false); }}>
            <Text style={styles.skipText}>Keyinroq →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
        >
          {cards.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🎉</Text>
              <Text style={styles.emptyTitle}>Hamma karta takrorlandi!</Text>
              <Text style={styles.emptySub}>
                Mock imtihon yechganingizda xato qilgan savollar bu yerga avtomatik qo'shiladi.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.dueInfo}>
                <Text style={styles.dueCount}>{cards.length} ta karta bugun takrorlanadi</Text>
              </View>
              {cards.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.cardRow}
                  onPress={() => { setActiveCard(card); setRevealed(false); }}
                >
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardTopic}>{card.topic}</Text>
                    <Text style={styles.cardSubject}>{SUBJECT_LABELS[card.subject as Subject] ?? card.subject}</Text>
                    <Text style={styles.cardQuestion} numberOfLines={2}>{card.question_text}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.cardInterval}>{card.interval_days}k</Text>
                    <Text style={styles.cardIntervalLabel}>interval</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Spaced repetition qanday ishlaydi?</Text>
            <Text style={styles.infoText}>
              1-kuni → 3-kuni → 7-kuni → 14-kuni → 30-kuni. Har to'g'ri javob intervalini oshiradi.
              To'liq o'zlashtirilganda "o'zlashtirildi" belgisi qo'yiladi.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  dueInfo: { backgroundColor: C.amberLight, borderRadius: 12, padding: 12, borderWidth: 0.5, borderColor: C.amberBorder },
  dueCount: { fontSize: 14, fontWeight: '500', color: C.amber },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary },
  cardLeft: { flex: 1, gap: 3 },
  cardTopic: { fontSize: 13, fontWeight: '500', color: C.text },
  cardSubject: { fontSize: 11, color: C.textSecondary },
  cardQuestion: { fontSize: 12, color: C.textTertiary, marginTop: 4, lineHeight: 17 },
  cardRight: { alignItems: 'center', justifyContent: 'center', minWidth: 40 },
  cardInterval: { fontSize: 18, fontWeight: '700', color: C.green },
  cardIntervalLabel: { fontSize: 10, color: C.textTertiary },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: C.text },
  emptySub: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
  cardContainer: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 20 },
  flashcard: { width: '100%', backgroundColor: C.bgSecondary, borderRadius: 20, padding: 24, borderWidth: 0.5, borderColor: C.border, gap: 16 },
  flashcardBadge: { backgroundColor: C.blueLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, alignSelf: 'flex-start', borderWidth: 0.5, borderColor: C.blueBorder },
  flashcardBadgeText: { fontSize: 11, color: C.blue, fontWeight: '500' },
  flashcardQuestion: { fontSize: 18, fontWeight: '500', color: C.text, lineHeight: 28 },
  revealBtn: { backgroundColor: C.green, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  revealBtnText: { color: C.white, fontSize: 15, fontWeight: '600' },
  answerArea: { gap: 12 },
  answerBox: { backgroundColor: C.greenLight, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: C.greenBorder },
  answerLabel: { fontSize: 11, color: C.greenDark, marginBottom: 4, fontWeight: '500' },
  answerText: { fontSize: 16, color: C.greenDark, fontWeight: '600' },
  ratePrompt: { fontSize: 14, color: C.textSecondary, textAlign: 'center' },
  rateRow: { flexDirection: 'row', gap: 10 },
  rateNo: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 0.5, borderColor: '#FC8181', backgroundColor: '#FFF5F5', alignItems: 'center' },
  rateNoText: { color: C.red, fontWeight: '600' },
  rateYes: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: C.green, alignItems: 'center' },
  rateYesText: { color: C.white, fontWeight: '600' },
  skipText: { fontSize: 14, color: C.textSecondary },
  infoBox: { backgroundColor: C.bgSecondary, borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: C.border },
  infoTitle: { fontSize: 13, fontWeight: '600', color: C.text, marginBottom: 6 },
  infoText: { fontSize: 12, color: C.textSecondary, lineHeight: 20 },
});
