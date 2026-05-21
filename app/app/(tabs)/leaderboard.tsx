import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { C } from '../../constants/colors';
import { api } from '../../lib/api';
import { getProfile } from '../../lib/store';
import { LeaderboardEntry, EXAM_TYPE_LABELS, ExamType } from '../../lib/types';

const RANK_MEDALS = ['🥇', '🥈', '🥉'];
const EXAM_TYPES: ExamType[] = ['dtm', 'attestat_9', 'teacher'];

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeType, setActiveType] = useState<ExamType>('dtm');
  const [userId, setUserId] = useState('');

  const load = async (type: ExamType = activeType) => {
    try {
      const profile = await getProfile();
      setUserId(profile.user_id);
      const res = await api.getLeaderboard(type, profile.user_id);
      setEntries(res.entries);
      setUserRank(res.user_rank ?? null);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const switchType = (t: ExamType) => {
    setActiveType(t);
    setLoading(true);
    load(t);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Liderlar jadvali 🏆</Text>
        <Text style={styles.subtitle}>Haftalik reyting · Har dushanba yangilanadi</Text>
      </View>

      <View style={styles.tabs}>
        {EXAM_TYPES.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeType === t && styles.tabActive]}
            onPress={() => switchType(t)}
          >
            <Text style={[styles.tabText, activeType === t && styles.tabTextActive]}>
              {EXAM_TYPE_LABELS[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.green} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
        >
          {/* Top 3 podium */}
          {entries.length >= 3 && (
            <View style={styles.podium}>
              {[entries[1], entries[0], entries[2]].map((e, i) => {
                const heights = [100, 130, 90];
                const isFirst = e.rank === 1;
                return (
                  <View key={e.user_id} style={[styles.podiumBlock, { height: heights[i] }]}>
                    <Text style={styles.podiumName} numberOfLines={1}>{e.display_name.split(' ')[0]}</Text>
                    <View style={[styles.podiumBar, { height: heights[i] - 30, backgroundColor: isFirst ? C.green : C.bgSecondary, borderColor: isFirst ? C.greenBorder : C.border }]}>
                      <Text style={styles.podiumMedal}>{RANK_MEDALS[e.rank - 1]}</Text>
                      <Text style={[styles.podiumScore, isFirst && { color: C.white }]}>{e.score}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Full list */}
          {entries.map((e) => {
            const isMe = e.user_id === userId;
            return (
              <View key={e.user_id} style={[styles.entryRow, isMe && styles.entryRowMe]}>
                <Text style={[styles.entryRank, isMe && { color: C.green }]}>
                  {e.rank <= 3 ? RANK_MEDALS[e.rank - 1] : `#${e.rank}`}
                </Text>
                <View style={styles.entryInfo}>
                  <Text style={[styles.entryName, isMe && { color: C.green }]}>
                    {e.display_name}{isMe ? ' (Men)' : ''}
                  </Text>
                  <View style={styles.entryMeta}>
                    <Text style={styles.entryMetaText}>🔥 {e.streak} kun streak</Text>
                  </View>
                </View>
                <Text style={[styles.entryScore, isMe && { color: C.green }]}>{e.score}</Text>
              </View>
            );
          })}

          {userRank && userRank > 10 && (
            <View style={styles.userRankNote}>
              <Text style={styles.userRankNoteText}>Sizning o'rningiz: #{userRank}</Text>
            </View>
          )}

          <View style={styles.weekNote}>
            <Text style={styles.weekNoteText}>
              💡 Reyting = to'g'ri javoblar + streak + yaxshilanish dinamikasi
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: C.text },
  subtitle: { fontSize: 13, color: C.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 100, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary },
  tabActive: { backgroundColor: C.green, borderColor: C.green },
  tabText: { fontSize: 12, color: C.textSecondary },
  tabTextActive: { color: C.white, fontWeight: '600' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 8 },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, marginBottom: 24, height: 160 },
  podiumBlock: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  podiumName: { fontSize: 11, color: C.textSecondary, marginBottom: 4, textAlign: 'center' },
  podiumBar: { width: '100%', borderRadius: 8, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center', gap: 4 },
  podiumMedal: { fontSize: 20 },
  podiumScore: { fontSize: 13, fontWeight: '700', color: C.text },
  entryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: C.border, backgroundColor: C.bgSecondary },
  entryRowMe: { backgroundColor: C.greenLight, borderColor: C.greenBorder },
  entryRank: { fontSize: 16, fontWeight: '700', color: C.textSecondary, width: 36, textAlign: 'center' },
  entryInfo: { flex: 1, gap: 2 },
  entryName: { fontSize: 14, fontWeight: '500', color: C.text },
  entryMeta: { flexDirection: 'row', gap: 8 },
  entryMetaText: { fontSize: 11, color: C.textSecondary },
  entryScore: { fontSize: 16, fontWeight: '700', color: C.text },
  userRankNote: { backgroundColor: C.greenLight, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 0.5, borderColor: C.greenBorder },
  userRankNoteText: { fontSize: 14, color: C.greenDark, fontWeight: '500' },
  weekNote: { padding: 12, borderRadius: 12, backgroundColor: C.bgSecondary },
  weekNoteText: { fontSize: 12, color: C.textSecondary, textAlign: 'center', lineHeight: 18 },
});
