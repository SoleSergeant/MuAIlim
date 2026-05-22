import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Linking, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { C } from '../../constants/colors';
import { getProfile, daysUntilExam } from '../../lib/store';
import { UserProfile, SUBJECT_LABELS, EXAM_TYPE_LABELS } from '../../lib/types';
import { api } from '../../lib/api';
import {
  OLYMPIADS, filterOlympiads, DEFAULT_FILTERS, OlympiadFilters,
  OLYMPIAD_SUBJECT_LABELS, FORMAT_LABELS, LEVEL_LABELS, Olympiad,
} from '../../lib/olympiads';
import {
  mockRemainingThisWeek, explainsRemainingToday,
  FREE_MOCK_PER_WEEK, FREE_EXPLAIN_PER_DAY,
  canChat, incrementChatCount, chatRemainingToday, FREE_CHAT_PER_DAY,
} from '../../lib/subscription';

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [prediction, setPrediction] = useState<any>(null);
  const [subjectScores, setSubjectScores] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);

  // Olympiad state
  const [olympiadFilters, setOlympiadFilters] = useState<OlympiadFilters>(DEFAULT_FILTERS);
  const [expandedOlympiad, setExpandedOlympiad] = useState<string | null>(null);

  // Subscription usage
  const [mocksLeft, setMocksLeft] = useState<number | null>(null);
  const [explainsLeft, setExplainsLeft] = useState<number | null>(null);

  // Chatbot
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  const load = async () => {
    const p = await getProfile();
    setProfile(p);
    setDaysLeft(daysUntilExam(p.exam_date));

    // Load usage counters
    const [ml, el] = await Promise.all([
      mockRemainingThisWeek(p.is_premium),
      explainsRemainingToday(p.is_premium),
    ]);
    setMocksLeft(ml);
    setExplainsLeft(el);
    try {
      const pred = await api.predictScore(p.user_id, p.goal_score);
      setPrediction(pred);
    } catch { }
    // Load per-subject average scores from weakness map
    try {
      const data = await api.getWeaknessMap(p.user_id);
      const weaknesses = data.weaknesses ?? [];
      // Group by subject and compute average accuracy
      const bySubject: Record<string, { total: number; sum: number }> = {};
      for (const w of weaknesses) {
        if (!bySubject[w.subject]) bySubject[w.subject] = { total: 0, sum: 0 };
        bySubject[w.subject].total += 1;
        bySubject[w.subject].sum += w.accuracy_pct;
      }
      const scores: Record<string, number> = {};
      for (const [subj, { total, sum }] of Object.entries(bySubject)) {
        scores[subj] = Math.round(sum / total);
      }
      setSubjectScores(scores);
    } catch { }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading || !profile) return;

    const allowed = await canChat(profile.is_premium);
    if (!allowed) {
      Alert.alert(
        'Kunlik limit tugadi',
        `Bepul rejimda kuniga ${FREE_CHAT_PER_DAY} ta xabar. Premium ga o'ting.`,
        [{ text: 'Premium →', onPress: () => router.push('/premium') }, { text: 'OK', style: 'cancel' }]
      );
      return;
    }

    const userMsg = { role: 'user' as const, content: msg };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setChatInput('');
    setChatLoading(true);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await api.chat(msg, chatMessages);
      await incrementChatCount();
      setChatMessages([...newHistory, { role: 'assistant', content: res.reply }]);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setChatMessages([...newHistory, { role: 'assistant', content: 'Xatolik yuz berdi. Qayta urinib ko\'ring.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (!profile) return <View style={styles.center}><Text>Yuklanmoqda...</Text></View>;

  const readiness = prediction?.readiness_pct ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Salom, {profile.display_name} 👋</Text>
          <Text style={styles.subGreeting}>Bugun ham maqsadga bir qadam yaqinlashamiz</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNum}>{profile.streak}</Text>
        </View>
      </View>

      {/* ── AI Chatbot ── */}
      <View style={styles.chatCard}>
        <TouchableOpacity style={styles.chatHeader} onPress={() => setChatOpen(!chatOpen)} activeOpacity={0.8}>
          <View style={styles.chatHeaderLeft}>
            <View style={styles.chatAvatar}>
              <Text style={{ fontSize: 16 }}>🤖</Text>
            </View>
            <View>
              <Text style={styles.chatHeaderTitle}>AI Muallim</Text>
              <Text style={styles.chatHeaderSub}>DTM, fanlar, maslahat — so'rang</Text>
            </View>
          </View>
          <Text style={styles.chatChevron}>{chatOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {chatOpen && (
          <>
            <ScrollView
              ref={chatScrollRef}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
              keyboardShouldPersistTaps="handled"
            >
              {chatMessages.length === 0 && (
                <View style={styles.chatEmpty}>
                  <Text style={styles.chatEmptyText}>
                    Matematika, tarix, fizika yoki boshqa fanlar bo'yicha savol bering 👆
                  </Text>
                </View>
              )}
              {chatMessages.map((msg, i) => (
                <View
                  key={i}
                  style={[
                    styles.chatBubble,
                    msg.role === 'user' ? styles.chatBubbleUser : styles.chatBubbleAI,
                  ]}
                >
                  <Text
                    style={[
                      styles.chatBubbleText,
                      msg.role === 'user' ? styles.chatBubbleTextUser : styles.chatBubbleTextAI,
                    ]}
                  >
                    {msg.content}
                  </Text>
                </View>
              ))}
              {chatLoading && (
                <View style={[styles.chatBubble, styles.chatBubbleAI]}>
                  <Text style={styles.chatBubbleTextAI}>⏳ Javob yozilmoqda...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Savol bering..."
                placeholderTextColor={C.textTertiary}
                multiline
                maxLength={300}
                returnKeyType="send"
                blurOnSubmit
                onSubmitEditing={sendChat}
              />
              <TouchableOpacity
                style={[
                  styles.chatSendBtn,
                  (!chatInput.trim() || chatLoading) && styles.chatSendBtnDisabled,
                ]}
                onPress={sendChat}
                disabled={!chatInput.trim() || chatLoading}
              >
                <Text style={styles.chatSendBtnText}>→</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Countdown */}
      <View style={styles.countdownCard}>
        <View style={styles.countdownLeft}>
          <Text style={styles.countdownDays}>{daysLeft}</Text>
          <Text style={styles.countdownLabel}>kun qoldi</Text>
        </View>
        <View style={styles.countdownRight}>
          <Text style={styles.countdownExam}>{EXAM_TYPE_LABELS[profile.exam_type]} ga</Text>
          <Text style={styles.countdownGoal}>Maqsad: {profile.goal_score} ball</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${readiness}%` }]} />
          </View>
          <Text style={styles.readinessText}>
            {prediction?.available ? `${readiness}% tayyorlik` : '3 ta mock yechib tayyorlikni biling'}
          </Text>
        </View>
      </View>

      {/* Premium banner — only for free users */}
      {profile && !profile.is_premium && (
        <TouchableOpacity style={styles.premiumBanner} onPress={() => router.push('/premium')} activeOpacity={0.85}>
          <View style={styles.premiumBannerLeft}>
            <Text style={styles.premiumBannerTitle}>⭐ Premium imkoniyatlar</Text>
            <Text style={styles.premiumBannerSub}>
              Mock: {mocksLeft ?? 0}/{FREE_MOCK_PER_WEEK} qoldi · AI: {explainsLeft ?? 0}/{FREE_EXPLAIN_PER_DAY} qoldi
            </Text>
          </View>
          <View style={styles.premiumBannerBtn}>
            <Text style={styles.premiumBannerBtnText}>25 000 UZS →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Today's task */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BUGUNGI TAVSIYA</Text>
        <View style={styles.taskCard}>
          <View style={styles.taskIcon}><Text style={{ fontSize: 20 }}>📚</Text></View>
          <View style={styles.taskBody}>
            <Text style={styles.taskTitle}>
              {SUBJECT_LABELS[profile.subjects[0]]}: Zaif mavzularni mustahkamlash
            </Text>
            <Text style={styles.taskSub}>15 ta savol · taxminan 20 daqiqa</Text>
          </View>
          <TouchableOpacity
            style={styles.taskBtn}
            onPress={() => router.push('/personalized')}
          >
            <Text style={styles.taskBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TEZKOR HARAKATLAR</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionCard, styles.actionGreen]} onPress={() => router.push('/mock')}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionTitle}>Mock imtihon</Text>
            <Text style={styles.actionSub}>Barcha fanlar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, styles.actionBlue]} onPress={() => router.push('/personalized')}>
            <Text style={styles.actionIcon}>🎯</Text>
            <Text style={styles.actionTitle}>Maqsadli test</Text>
            <Text style={styles.actionSub}>Zaif mavzular</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, styles.actionAmber]} onPress={() => router.push('/(tabs)/notebook')}>
            <Text style={styles.actionIcon}>📒</Text>
            <Text style={styles.actionTitle}>Xatolar daftari</Text>
            <Text style={styles.actionSub}>Takrorlash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, styles.actionPurple]} onPress={() => router.push('/(tabs)/leaderboard')}>
            <Text style={styles.actionIcon}>🏆</Text>
            <Text style={styles.actionTitle}>Liderlar</Text>
            <Text style={styles.actionSub}>Reyting</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Score prediction */}
      {prediction?.available && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BASHORAT</Text>
          <View style={styles.predictionCard}>
            <Text style={styles.predLabel}>Taxminiy ball</Text>
            <Text style={styles.predScore}>{prediction.predicted_range} / 200</Text>
            <Text style={styles.predSub}>
              Maqsadga {prediction.gap_to_goal > 0 ? `${prediction.gap_to_goal} ball qoldi` : 'yetdingiz! 🎉'}
            </Text>
          </View>
        </View>
      )}

      {/* Fan holati */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FAN HOLATI</Text>
        {profile.subjects.map((s) => {
          const pct = subjectScores[s];
          const hasSore = pct !== undefined;
          const barColor = !hasSore ? C.borderLight : pct >= 70 ? C.green : pct >= 50 ? C.orange : C.red;
          return (
            <View key={s} style={styles.subjectRow}>
              <Text style={styles.subjectName}>{SUBJECT_LABELS[s]}</Text>
              <View style={styles.subjectBar}>
                <View style={[styles.subjectFill, {
                  width: hasSore ? `${pct}%` : '0%',
                  backgroundColor: barColor,
                }]} />
              </View>
              <Text style={[styles.subjectPct, hasSore && { color: barColor, fontWeight: '600' }]}>
                {hasSore ? `${pct}%` : '—'}
              </Text>
            </View>
          );
        })}
        {Object.keys(subjectScores).length === 0 && (
          <Text style={styles.fanHolatiHint}>Mock imtihon yechasiz — fan bo'yicha ko'rsatkichlar paydo bo'ladi</Text>
        )}
      </View>

      {/* ── Olympiads ── */}
      <OlympiadsSection
        filters={olympiadFilters}
        setFilters={setOlympiadFilters}
        expandedId={expandedOlympiad}
        setExpandedId={setExpandedOlympiad}
      />
    </ScrollView>
  );
}

// ─── Olympiads Section ───────────────────────────────────────────────────────
function OlympiadsSection({
  filters, setFilters, expandedId, setExpandedId,
}: {
  filters: OlympiadFilters;
  setFilters: (f: OlympiadFilters) => void;
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
}) {
  const filtered = filterOlympiads(OLYMPIADS, filters);

  const setFilter = <K extends keyof OlympiadFilters>(key: K, val: OlympiadFilters[K]) => {
    setFilters({ ...filters, [key]: val });
    setExpandedId(null);
  };

  return (
    <View style={ol.wrapper}>
      {/* Header */}
      <View style={ol.header}>
        <Text style={ol.headerTitle}>🏅 Olimpiadalar</Text>
        <Text style={ol.headerCount}>{filtered.length} ta</Text>
      </View>

      {/* Filter chips row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ol.filtersRow}>
        {/* Upcoming toggle */}
        <TouchableOpacity
          style={[ol.chip, filters.upcomingOnly && ol.chipActive]}
          onPress={() => setFilter('upcomingOnly', !filters.upcomingOnly)}
        >
          <Text style={[ol.chipText, filters.upcomingOnly && ol.chipTextActive]}>📅 Yaqinlashayotgan</Text>
        </TouchableOpacity>

        {/* Level */}
        {(['all', 'international', 'national'] as const).map((lvl) => (
          <TouchableOpacity
            key={lvl}
            style={[ol.chip, filters.level === lvl && ol.chipActive]}
            onPress={() => setFilter('level', lvl)}
          >
            <Text style={[ol.chipText, filters.level === lvl && ol.chipTextActive]}>
              {lvl === 'all' ? 'Barchasi' : LEVEL_LABELS[lvl]}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Format */}
        {(['online', 'in-person'] as const).map((fmt) => (
          <TouchableOpacity
            key={fmt}
            style={[ol.chip, filters.format === fmt && ol.chipActive]}
            onPress={() => setFilter('format', filters.format === fmt ? 'all' : fmt)}
          >
            <Text style={[ol.chipText, filters.format === fmt && ol.chipTextActive]}>
              {FORMAT_LABELS[fmt]}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Grade group */}
        {(['all', 'junior', 'senior'] as const).map((g) => (
          <TouchableOpacity
            key={g}
            style={[ol.chip, filters.gradeGroup === g && ol.chipActive]}
            onPress={() => setFilter('gradeGroup', g)}
          >
            <Text style={[ol.chipText, filters.gradeGroup === g && ol.chipTextActive]}>
              {g === 'all' ? 'Barcha sinf' : g === 'junior' ? '5–8 sinf' : '9–11 sinf'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Subject filter row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ol.filtersRow}>
        <TouchableOpacity
          style={[ol.chip, filters.subject === 'all' && ol.chipActive]}
          onPress={() => setFilter('subject', 'all')}
        >
          <Text style={[ol.chipText, filters.subject === 'all' && ol.chipTextActive]}>Barcha fan</Text>
        </TouchableOpacity>
        {(['math', 'physics', 'chemistry', 'biology', 'informatics', 'english', 'astronomy', 'science'] as const).map((sub) => (
          <TouchableOpacity
            key={sub}
            style={[ol.chip, filters.subject === sub && ol.chipActive]}
            onPress={() => setFilter('subject', filters.subject === sub ? 'all' : sub)}
          >
            <Text style={[ol.chipText, filters.subject === sub && ol.chipTextActive]}>
              {OLYMPIAD_SUBJECT_LABELS[sub]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Cards */}
      {filtered.length === 0 ? (
        <View style={ol.empty}>
          <Text style={ol.emptyText}>Bu filtrlarga mos olimpiada topilmadi</Text>
        </View>
      ) : (
        filtered.map((o) => (
          <OlympiadCard
            key={o.id}
            olympiad={o}
            expanded={expandedId === o.id}
            onToggle={() => setExpandedId(expandedId === o.id ? null : o.id)}
          />
        ))
      )}
    </View>
  );
}

function OlympiadCard({
  olympiad: o, expanded, onToggle,
}: { olympiad: Olympiad; expanded: boolean; onToggle: () => void }) {
  const levelColor = o.level === 'international' ? '#7C3AED' : o.level === 'national' ? C.green : C.blue;
  const levelBg = o.level === 'international' ? '#F5F3FF' : o.level === 'national' ? C.greenLight : C.blueLight;

  return (
    <View style={ol.card}>
      {/* Card header — always visible, tappable */}
      <TouchableOpacity style={ol.cardHeader} onPress={onToggle} activeOpacity={0.75}>
        {/* Icon + title row */}
        <View style={ol.cardIconWrap}>
          <Text style={ol.cardIcon}>{o.icon}</Text>
        </View>
        <View style={ol.cardMeta}>
          <View style={ol.cardTitleRow}>
            <Text style={ol.cardName}>{o.name}</Text>
            <View style={[ol.levelBadge, { backgroundColor: levelBg }]}>
              <Text style={[ol.levelBadgeText, { color: levelColor }]}>{LEVEL_LABELS[o.level]}</Text>
            </View>
          </View>
          <Text style={ol.cardFullName} numberOfLines={1}>{o.fullName}</Text>
          {/* Chips row */}
          <View style={ol.cardChips}>
            <View style={ol.cardChip}>
              <Text style={ol.cardChipText}>{o.icon} {OLYMPIAD_SUBJECT_LABELS[o.subject]}</Text>
            </View>
            <View style={ol.cardChip}>
              <Text style={ol.cardChipText}>
                {o.gradeMin === o.gradeMax ? `${o.gradeMin}-sinf` : `${o.gradeMin}–${o.gradeMax}-sinf`}
              </Text>
            </View>
            <View style={ol.cardChip}>
              <Text style={ol.cardChipText}>{FORMAT_LABELS[o.format]}</Text>
            </View>
          </View>
          {/* Date row */}
          <View style={ol.dateRow}>
            {o.registrationDeadline && (
              <Text style={ol.dateText}>📋 Ro'yxat: {o.registrationDeadline}</Text>
            )}
            {o.examDate && (
              <Text style={ol.dateText}>📅 Imtihon: {o.examDate}</Text>
            )}
          </View>
        </View>
        <Text style={ol.chevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View style={ol.cardBody}>
          {/* Divider */}
          <View style={ol.divider} />

          {/* Description */}
          <Text style={ol.detailLabel}>Haqida</Text>
          <Text style={ol.detailText}>{o.description}</Text>

          {/* Prizes */}
          <Text style={[ol.detailLabel, { marginTop: 12 }]}>🏆 Mukofotlar</Text>
          <Text style={ol.detailText}>{o.prizes}</Text>

          {/* Organizer + website */}
          <View style={ol.orgRow}>
            <View style={{ flex: 1 }}>
              <Text style={ol.detailLabel}>Tashkilotchi</Text>
              <Text style={ol.detailText}>{o.organizer} · {o.country}</Text>
            </View>
            <TouchableOpacity
              style={ol.websiteBtn}
              onPress={() => Linking.openURL(o.website)}
            >
              <Text style={ol.websiteBtnText}>🌐 Sayt →</Text>
            </TouchableOpacity>
          </View>

          {/* Preparation tips */}
          <Text style={[ol.detailLabel, { marginTop: 12 }]}>📖 Tayyorlanish bo'yicha maslahatlar</Text>
          {o.preparationTips.map((tip, i) => (
            <View key={i} style={ol.tipRow}>
              <Text style={ol.tipBullet}>{i + 1}.</Text>
              <Text style={ol.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const ol = StyleSheet.create({
  wrapper: { paddingHorizontal: 20, marginBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  headerCount: { fontSize: 12, color: C.textSecondary, backgroundColor: C.bgSecondary, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100, borderWidth: 0.5, borderColor: C.border },

  filtersRow: { gap: 7, paddingBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary },
  chipActive: { backgroundColor: C.green, borderColor: C.green },
  chipText: { fontSize: 12, color: C.textSecondary, fontWeight: '500' },
  chipTextActive: { color: C.white },

  empty: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontSize: 13, color: C.textTertiary },

  card: {
    backgroundColor: C.bgSecondary, borderRadius: 16,
    borderWidth: 0.5, borderColor: C.border, marginBottom: 10, overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  cardIconWrap: {
    width: 42, height: 42, borderRadius: 12, backgroundColor: C.bg,
    alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: C.border,
  },
  cardIcon: { fontSize: 22 },
  cardMeta: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { fontSize: 16, fontWeight: '700', color: C.text },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  levelBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  cardFullName: { fontSize: 12, color: C.textSecondary },
  cardChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 2 },
  cardChip: { backgroundColor: C.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, borderWidth: 0.5, borderColor: C.border },
  cardChipText: { fontSize: 11, color: C.textSecondary },
  dateRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  dateText: { fontSize: 11, color: C.textTertiary },
  chevron: { fontSize: 11, color: C.textTertiary, paddingTop: 4 },

  cardBody: { paddingHorizontal: 14, paddingBottom: 16 },
  divider: { height: 0.5, backgroundColor: C.border, marginBottom: 12 },
  detailLabel: { fontSize: 11, fontWeight: '700', color: C.textTertiary, letterSpacing: 0.5, marginBottom: 4 },
  detailText: { fontSize: 13, color: C.text, lineHeight: 20 },
  orgRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  websiteBtn: { backgroundColor: C.blueLight, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 0.5, borderColor: C.blueBorder },
  websiteBtnText: { fontSize: 12, color: C.blue, fontWeight: '600' },
  tipRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  tipBullet: { fontSize: 12, fontWeight: '700', color: C.green, width: 18 },
  tipText: { flex: 1, fontSize: 13, color: C.text, lineHeight: 20 },
});

// ─── Main styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  greeting: { fontSize: 22, fontWeight: '700', color: C.text },
  subGreeting: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF3E0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  streakEmoji: { fontSize: 16 },
  streakNum: { fontSize: 16, fontWeight: '700', color: C.orange },
  countdownCard: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 24,
    backgroundColor: C.green, borderRadius: 20, padding: 20, gap: 16,
  },
  countdownLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 64 },
  countdownDays: { fontSize: 44, fontWeight: '800', color: C.white, lineHeight: 48 },
  countdownLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  countdownRight: { flex: 1, justifyContent: 'center' },
  countdownExam: { fontSize: 16, fontWeight: '700', color: C.white, marginBottom: 4 },
  countdownGoal: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: C.white, borderRadius: 3 },
  readinessText: { fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: C.textTertiary, letterSpacing: 0.08, marginBottom: 12 },
  taskCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.bgSecondary, borderRadius: 14, padding: 14,
    borderWidth: 0.5, borderColor: C.border,
  },
  taskIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.amberLight, alignItems: 'center', justifyContent: 'center' },
  taskBody: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '500', color: C.text, marginBottom: 3 },
  taskSub: { fontSize: 12, color: C.textSecondary },
  taskBtn: { width: 36, height: 36, backgroundColor: C.green, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  taskBtnText: { color: C.white, fontSize: 16, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { flex: 1, minWidth: '45%', borderRadius: 14, padding: 14, gap: 4 },
  actionGreen: { backgroundColor: C.greenLight, borderWidth: 0.5, borderColor: C.greenBorder },
  actionBlue: { backgroundColor: C.blueLight, borderWidth: 0.5, borderColor: C.blueBorder },
  actionAmber: { backgroundColor: C.amberLight, borderWidth: 0.5, borderColor: C.amberBorder },
  actionPurple: { backgroundColor: C.purpleLight, borderWidth: 0.5, borderColor: '#CECBF6' },
  actionIcon: { fontSize: 22 },
  actionTitle: { fontSize: 13, fontWeight: '600', color: C.text },
  actionSub: { fontSize: 11, color: C.textSecondary },
  predictionCard: { backgroundColor: C.greenLight, borderRadius: 14, padding: 18, borderWidth: 0.5, borderColor: C.greenBorder },
  predLabel: { fontSize: 12, color: C.textSecondary, marginBottom: 4 },
  predScore: { fontSize: 28, fontWeight: '800', color: C.greenDark, marginBottom: 4 },
  predSub: { fontSize: 13, color: C.textSecondary },
  subjectRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  subjectName: { fontSize: 13, color: C.text, width: 90 },
  subjectBar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.borderLight, overflow: 'hidden' },
  subjectFill: { height: '100%', backgroundColor: C.green, borderRadius: 4 },
  subjectPct: { fontSize: 12, color: C.textSecondary, width: 36, textAlign: 'right' },
  fanHolatiHint: { fontSize: 12, color: C.textTertiary, fontStyle: 'italic', marginTop: 4 },

  // ── Chat widget ──────────────────────────────────────────────────────────
  chatCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: C.bgSecondary,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: C.border,
    overflow: 'hidden',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  chatHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatAvatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#DDD6FE',
  },
  chatHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.text,
  },
  chatHeaderSub: {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 1,
  },
  chatChevron: {
    fontSize: 11,
    color: C.textTertiary,
  },
  chatMessages: {
    maxHeight: 260,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  chatMessagesContent: {
    padding: 12,
    gap: 6,
  },
  chatEmpty: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  chatEmptyText: {
    fontSize: 12,
    color: C.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  chatBubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    marginBottom: 2,
  },
  chatBubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
  },
  chatBubbleAI: {
    alignSelf: 'flex-start',
    backgroundColor: C.bg,
    borderWidth: 0.5,
    borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  chatBubbleText: {
    fontSize: 13,
    lineHeight: 20,
  },
  chatBubbleTextUser: {
    color: '#FFFFFF',
  },
  chatBubbleTextAI: {
    color: C.text,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  chatInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: C.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: C.text,
    borderWidth: 0.5,
    borderColor: C.border,
  },
  chatSendBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatSendBtnDisabled: {
    backgroundColor: C.borderLight,
  },
  chatSendBtnText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Premium banner
  premiumBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 20, marginBottom: 20, padding: 14, borderRadius: 14,
    backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#DDD6FE',
  },
  premiumBannerLeft: { flex: 1, gap: 3 },
  premiumBannerTitle: { fontSize: 14, fontWeight: '700', color: '#5B21B6' },
  premiumBannerSub: { fontSize: 12, color: '#7C3AED' },
  premiumBannerBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  premiumBannerBtnText: { fontSize: 12, fontWeight: '700', color: C.white },
});
