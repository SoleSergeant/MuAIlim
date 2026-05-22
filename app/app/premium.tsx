import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { C } from '../constants/colors';
import { getProfile, saveProfile } from '../lib/store';
import MuAIlimLogo from '../components/MuAIlimLogo';
import { PRICE_MONTHLY, PRICE_ANNUAL, PRICE_SAVE_PCT } from '../lib/subscription';

const FEATURES = [
  { icon: '📝', label: 'Mock imtihon',              free: '2 ta/hafta',   premium: '✓ Cheksiz' },
  { icon: '🤖', label: 'AI tushuntirish',           free: '2 ta/kun',     premium: '✓ Cheksiz' },
  { icon: '📒', label: 'Xatolar daftari',            free: '2 kun/hafta',  premium: '✓ Cheksiz' },
  { icon: '🗺️', label: 'Shaxsiy o\'quv xaritasi',  free: '🔒',            premium: '✓ AI bilan' },
  { icon: '💬', label: 'AI muallim (chat)',          free: '5 ta/kun',     premium: '✓ Cheksiz' },
  { icon: '🏅', label: 'Olimpiada tayyorgarligi',   free: '🔒',            premium: '✓' },
  { icon: '🏆', label: 'Reyting & streak',          free: '✓',             premium: '✓' },
];

export default function PremiumScreen() {
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // TODO: wire to real payment gateway (Payme, Click, etc.)
      // For now, simulate activation
      Alert.alert(
        'To\'lov tizimi',
        'To\'lov tizimi tez orada ulangach ishga tushadi. Hozircha demo rejimida Premium yoqildi.',
        [
          {
            text: 'Premium yoqish (demo)',
            onPress: async () => {
              const p = await getProfile();
              await saveProfile({ ...p, is_premium: true });
              router.back();
            },
          },
          { text: 'Bekor qilish', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const price     = plan === 'monthly' ? PRICE_MONTHLY : PRICE_ANNUAL;
  const perMonth  = plan === 'annual'  ? '~16 667 UZS/oy' : null;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <Text style={s.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <MuAIlimLogo size="medium" />
          <View style={s.premiumBadge}>
            <Text style={s.premiumBadgeText}>⭐ PREMIUM</Text>
          </View>
          <Text style={s.heroTitle}>Test emas, rivojlanish!</Text>
          <Text style={s.heroSub}>
            Cheksiz mock, AI tushuntirish, shaxsiy yo'l xaritasi — barchasi bir joyda.
          </Text>
        </View>

        {/* Plan selector */}
        <View style={s.planRow}>
          <TouchableOpacity
            style={[s.planCard, plan === 'monthly' && s.planCardActive]}
            onPress={() => setPlan('monthly')}
          >
            <Text style={[s.planLabel, plan === 'monthly' && s.planLabelActive]}>Oylik</Text>
            <Text style={[s.planPrice, plan === 'monthly' && s.planPriceActive]}>{PRICE_MONTHLY}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.planCard, plan === 'annual' && s.planCardActive]}
            onPress={() => setPlan('annual')}
          >
            <View style={s.saveBadge}>
              <Text style={s.saveBadgeText}>{PRICE_SAVE_PCT} tejash</Text>
            </View>
            <Text style={[s.planLabel, plan === 'annual' && s.planLabelActive]}>Yillik</Text>
            <Text style={[s.planPrice, plan === 'annual' && s.planPriceActive]}>{PRICE_ANNUAL}</Text>
            <Text style={[s.planSub, plan === 'annual' && s.planSubActive]}>~16 667 UZS/oy</Text>
          </TouchableOpacity>
        </View>

        {/* Feature comparison table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableCol1, s.tableHeaderText]}>Imkoniyat</Text>
            <Text style={[s.tableCol2, s.tableHeaderText]}>Bepul</Text>
            <Text style={[s.tableCol3, s.tableHeaderText]}>Premium</Text>
          </View>
          {FEATURES.map((f, i) => (
            <View key={i} style={[s.tableRow, i % 2 === 1 && s.tableRowAlt]}>
              <View style={s.tableCol1}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <Text style={s.featureLabel}>{f.label}</Text>
              </View>
              <Text style={[s.tableCol2, s.freeText]}>{f.free}</Text>
              <Text style={[s.tableCol3, s.premiumText]}>{f.premium}</Text>
            </View>
          ))}
        </View>

        {/* Testimonial / trust */}
        <View style={s.trustRow}>
          {['🔒 Xavfsiz to\'lov', '❌ Istalgan vaqt bekor', '💳 Payme · Click'].map((t) => (
            <View key={t} style={s.trustChip}>
              <Text style={s.trustChipText}>{t}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[s.ctaBtn, loading && s.ctaBtnDisabled]}
          onPress={handleUpgrade}
          disabled={loading}
        >
          <Text style={s.ctaBtnText}>
            {plan === 'annual'
              ? `Yillik Premium — ${PRICE_ANNUAL} →`
              : `Oylik Premium — ${PRICE_MONTHLY} →`}
          </Text>
          {perMonth && <Text style={s.ctaSubText}>{perMonth}</Text>}
        </TouchableOpacity>

        <Text style={s.legalText}>
          Obuna avtomatik yangilanadi. Istalgan vaqtda bekor qilish mumkin.
        </Text>
      </ScrollView>
    </View>
  );
}

const PURPLE = '#7C3AED';
const PURPLE_LIGHT = '#F5F3FF';
const PURPLE_BORDER = '#DDD6FE';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8, alignItems: 'flex-end' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgSecondary, borderWidth: 0.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 14, color: C.textSecondary },

  content: { paddingHorizontal: 20, paddingBottom: 48, gap: 20 },

  hero: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  premiumBadge: { backgroundColor: PURPLE_LIGHT, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 100, borderWidth: 0.5, borderColor: PURPLE_BORDER },
  premiumBadgeText: { fontSize: 12, fontWeight: '700', color: PURPLE, letterSpacing: 0.5 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.3, textAlign: 'center' },
  heroSub: { fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 21 },

  planRow: { flexDirection: 'row', gap: 12 },
  planCard: {
    flex: 1, borderRadius: 16, padding: 16, borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.bgSecondary, alignItems: 'center', gap: 4, position: 'relative',
  },
  planCardActive: { borderColor: PURPLE, backgroundColor: PURPLE_LIGHT },
  saveBadge: { position: 'absolute', top: -11, backgroundColor: PURPLE, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 100 },
  saveBadgeText: { fontSize: 10, fontWeight: '700', color: C.white },
  planLabel: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  planLabelActive: { color: PURPLE },
  planPrice: { fontSize: 17, fontWeight: '800', color: C.text },
  planPriceActive: { color: PURPLE },
  planSub: { fontSize: 11, color: C.textTertiary },
  planSubActive: { color: PURPLE },

  table: { borderRadius: 14, overflow: 'hidden', borderWidth: 0.5, borderColor: C.border },
  tableHeader: { flexDirection: 'row', backgroundColor: C.bgSecondary, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: C.border },
  tableHeaderText: { fontSize: 11, fontWeight: '700', color: C.textTertiary, letterSpacing: 0.3 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, paddingHorizontal: 12 },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  tableCol1: { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 8 },
  tableCol2: { flex: 2, textAlign: 'center' },
  tableCol3: { flex: 2, textAlign: 'center' },
  featureIcon: { fontSize: 16 },
  featureLabel: { fontSize: 13, color: C.text, flex: 1 },
  freeText: { fontSize: 12, color: C.textSecondary },
  premiumText: { fontSize: 12, color: PURPLE, fontWeight: '600' },

  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  trustChip: { backgroundColor: C.bgSecondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 0.5, borderColor: C.border },
  trustChipText: { fontSize: 11, color: C.textSecondary },

  ctaBtn: { backgroundColor: PURPLE, paddingVertical: 18, borderRadius: 16, alignItems: 'center', gap: 3 },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaBtnText: { color: C.white, fontSize: 16, fontWeight: '700' },
  ctaSubText: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },

  legalText: { fontSize: 11, color: C.textTertiary, textAlign: 'center', lineHeight: 17 },
});
