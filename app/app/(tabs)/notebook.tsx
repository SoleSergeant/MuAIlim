import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { api } from '../../lib/api';
import { getProfile } from '../../lib/store';
import { SUBJECT_LABELS, Subject } from '../../lib/types';
import {
  canAccessNotebook, recordNotebookOpen,
  FREE_NOTEBOOK_DAYS_WEEK, notebookDaysRemainingThisWeek,
} from '../../lib/subscription';

export default function NotebookScreen() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCard, setActiveCard] = useState<any | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [userId, setUserId] = useState('');
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [notebookAllowed, setNotebookAllowed] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  const load = async () => {
    try {
      const p = await getProfile();
      setUserId(p.user_id);
      setIsPremium(p.is_premium);

      const allowed = await canAccessNotebook(p.is_premium);
      setNotebookAllowed(allowed);

      if (!allowed) {
        setLoading(false);
        return;
      }

      // Record today as a notebook day (only adds if not already recorded)
      await recordNotebookOpen();

      // Show remaining days in the header for free users
      const remaining = await notebookDaysRemainingThisWeek(p.is_premium);
      setDaysLeft(remaining ?? FREE_NOTEBOOK_DAYS_WEEK);

      const dueRes = await api.getNotebookDue(p.user_id);
      setCards(dueRes.cards);
    } catch {
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openCard = (card: any) => {
    setActiveCard(card);
    setRevealed(false);
    setExplanation(null);
    setExplanationLoading(false);
  };

  const reviewCard = async (card: any, correct: boolean) => {
    try {
      await api.reviewCard(card.id, userId, correct);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
    } catch { }
    setActiveCard(null);
    setRevealed(false);
    setExplanation(null);
  };

  const fetchExplanation = async (card: any) => {
    if (explanation) return;
    setExplanationLoading(true);
    try {
      const opts: string[] = card.options ?? [];
      const ci: number = card.correct_index ?? 0;
      const si: number = card.selected_index ?? -1;

      // If we have full option data use it; otherwise build minimal payload
      const res = await api.explainAnswer({
        question_text: card.question_text,
        options: opts.length > 0 ? opts : [card.correct_answer, '—', '—', '—'],
        correct_index: opts.length > 0 ? ci : 0,
        selected_index: opts.length > 0 && si >= 0 ? si : 1,
        subject: card.subject,
        topic: card.topic,
      });
      setExplanation(res.explanation);
    } catch {
      setExplanation(`"${card.topic}" mavzusini qayta o'rganib chiqing.`);
    } finally {
      setExplanationLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Xatolar daftari 📒</Text>
          {!isPremium && notebookAllowed && (
            <View style={styles.daysBadge}>
              <Text style={styles.daysBadgeText}>{daysLeft} kun qoldi</Text>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>Xato savollar qaytadi — har gal oraliq uzayadi</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : !notebookAllowed ? (
        /* ── Weekly limit reached gate ── */
        <View style={styles.gate}>
          <Text style={styles.gateLock}>🔒</Text>
          <Text style={styles.gateTitle}>Haftalik limit tugadi</Text>
          <Text style={styles.gateSub}>
            Bepul rejimda xatolar daftaridan haftada {FREE_NOTEBOOK_DAYS_WEEK} kun foydalanish mumkin.{'\n'}
            Cheksiz kirish uchun Premium ga o'ting.
          </Text>
          <View style={styles.gateFeatures}>
            {['📒 Cheksiz foydalanish', '🔁 Spaced repetition algoritmi', '🤖 Har bir xatoga AI tushuntirish'].map((f) => (
              <View key={f} style={styles.gateFeatureRow}>
                <Text style={styles.gateFeatureText}>{f}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.gateBtn} onPress={() => router.push('/premium')}>
            <Text style={styles.gateBtnText}>⭐ Premium — 25 000 UZS/oy →</Text>
          </TouchableOpacity>
        </View>
      ) : activeCard ? (
        <ScrollView contentContainerStyle={styles.cardContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.flashcard}>
            {/* Badge */}
            <View style={styles.flashcardBadge}>
              <Text style={styles.flashcardBadgeText}>
                {SUBJECT_LABELS[activeCard.subject as Subject] ?? activeCard.subject} · {activeCard.topic}
              </Text>
            </View>

            {/* Question */}
            <Text style={styles.flashcardQuestion}>{activeCard.question_text}</Text>

            {!revealed ? (
              <TouchableOpacity style={styles.revealBtn} onPress={() => setRevealed(true)}>
                <Text style={styles.revealBtnText}>Javobni ko'rsatish</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.answerArea}>
                {/* Correct answer */}
                <View style={styles.answerBox}>
                  <Text style={styles.answerLabel}>To'g'ri javob:</Text>
                  <Text style={styles.answerText}>{activeCard.correct_answer}</Text>
                </View>

                {/* "Nega?" explanation */}
                {explanation ? (
                  <View style={styles.explanationBox}>
                    <Text style={styles.explanationLabel}>🤖 Nega xato qildim?</Text>
                    <Text style={styles.explanationText}>{explanation}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.negaBtn}
                    onPress={() => fetchExplanation(activeCard)}
                    disabled={explanationLoading}
                  >
                    {explanationLoading ? (
                      <ActivityIndicator size="small" color={C.green} />
                    ) : (
                      <Text style={styles.negaBtnText}>🤖 Nega xato qildim?</Text>
                    )}
                  </TouchableOpacity>
                )}

                {/* Rate buttons */}
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

          <TouchableOpacity onPress={() => { setActiveCard(null); setRevealed(false); setExplanation(null); }}>
            <Text style={styles.skipText}>O'tkazib yuborish →</Text>
          </TouchableOpacity>
        </ScrollView>
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
                  onPress={() => openCard(card)}
                >
                  <View style={styles.cardLeft}>
                    <Text style={styles.cardTopic}>{card.topic}</Text>
                    <Text style={styles.cardSubject}>{SUBJECT_LABELS[card.subject as Subject] ?? card.subject}</Text>
                    <Text style={styles.cardQuestion} numberOfLines={2}>{card.question_text}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.cardInterval}>{card.interval_days}k</Text>
                    <Text style={styles.cardIntervalLabel}>keyingi</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>📖 Spaced repetition usuli</Text>
            <Text style={styles.infoText}>
              Har to'g'ri javob keyingi takrorlash oralig'ini uzaytiradi: 1 → 3 → 7 → 14 → 30 kun.
              Xato qilsangiz savol ertaga qaytadi. Shu yo'l bilan esda uzoq qoladi.
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  title: { fontSize: 24, fontWeight: '700', color: C.text },
  daysBadge: { backgroundColor: '#F5F3FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 0.5, borderColor: '#DDD6FE' },
  daysBadgeText: { fontSize: 11, fontWeight: '600', color: '#7C3AED' },
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

  // Flashcard (now in ScrollView so long explanations don't get cut)
  cardContainer: { flexGrow: 1, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 20 },
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

  // "Nega?" button & explanation
  negaBtn: {
    borderWidth: 1, borderColor: C.green, borderRadius: 10,
    paddingVertical: 11, alignItems: 'center',
    backgroundColor: C.greenLight,
  },
  negaBtnText: { fontSize: 13, color: C.green, fontWeight: '600' },
  explanationBox: {
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: '#FCD34D',
  },
  explanationLabel: { fontSize: 11, fontWeight: '700', color: '#92400E', marginBottom: 6 },
  explanationText: { fontSize: 13, color: C.text, lineHeight: 21 },

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

  // Premium gate
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14 },
  gateLock: { fontSize: 52 },
  gateTitle: { fontSize: 22, fontWeight: '700', color: C.text },
  gateSub: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
  gateFeatures: { width: '100%', gap: 8, backgroundColor: '#F5F3FF', borderRadius: 12, padding: 14, borderWidth: 0.5, borderColor: '#DDD6FE' },
  gateFeatureRow: {},
  gateFeatureText: { fontSize: 13, color: '#5B21B6', lineHeight: 22 },
  gateBtn: { backgroundColor: '#7C3AED', paddingVertical: 16, paddingHorizontal: 28, borderRadius: 14, width: '100%', alignItems: 'center' },
  gateBtnText: { color: C.white, fontSize: 15, fontWeight: '700' },
});
