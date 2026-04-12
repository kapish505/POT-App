/**
 * SwipeScreen — "TONIGHT"
 * Velvet Noir × POT animations:
 *
 *  • Header fades + slides down from above (editorial materialise)
 *  • Hero card fades + scales up from 0.92 with gentle spring
 *  • "LIVE NOW" badge pulses crimson (urgent, alive)
 *  • "SHOW UP" CTA breathes with gold pulse (it wants you)
 *  • Plan counter ticks up from 0 (spontaneous energy)
 *  • Grid cards stagger-enter from below (cascade)
 *  • All cards have spring-scale press feedback
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius } from '../constants/theme';
import {
  useFadeSlideUp,
  useStaggeredList,
  useSpringPress,
  useGoldPulse,
  useLiveShimmer,
} from '../hooks/animations';
import { api } from '../api/client';

const { width: W, height: H } = Dimensions.get('window');

// ─── TYPES ─────────────────────────────────────────────────────────────────
interface Plan {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_time?: string;
  group?: { name: string };
  member_count?: number;
  is_active?: boolean;
}

// ─── HERO CARD ─────────────────────────────────────────────────────────────
function HeroCard({ plan, onJoin }: { plan: Plan; onJoin: () => void }) {
  // Card entrance: scale from 0.94 + fade
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.94)).current;

  // Live badge shimmer
  const liveOpacity = useLiveShimmer();

  // CTA gold pulse
  const { scale: pulseScale, opacity: pulseOpacity } = useGoldPulse();

  // Press spring
  const { scale: pressScale, onPressIn, onPressOut } = useSpringPress(0.97);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        delay: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        delay: 300,
        useNativeDriver: true,
        tension: 80,
        friction: 9,
      }),
    ]).start();
  }, []);

  const timeStr = plan.start_time
    ? new Date(plan.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <Animated.View
      style={[
        styles.heroCard,
        { opacity: cardOpacity, transform: [{ scale: cardScale }] },
      ]}
    >
      <LinearGradient
        colors={['#1a0610', '#0d0208', '#060004']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Vignette overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={[StyleSheet.absoluteFill, { top: '40%' }]}
      />

      {/* Gold horizontal rule — top accent */}
      <View style={styles.heroGoldRule} />

      {/* LIVE badge */}
      {plan.is_active && (
        <Animated.View style={[styles.liveBadge, { opacity: liveOpacity }]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE NOW</Text>
        </Animated.View>
      )}

      {/* Content */}
      <View style={styles.heroContent}>
        {plan.group?.name && (
          <Text style={styles.heroRoomLabel}>{plan.group.name.toUpperCase()}</Text>
        )}
        <Text style={styles.heroTitle}>{plan.title}</Text>
        {plan.location && (
          <Text style={styles.heroMeta}>
            {timeStr ? `${timeStr}  ·  ` : ''}{plan.location}
          </Text>
        )}

        {/* SHOW UP button with gold pulse aura */}
        <Animated.View
          style={[
            styles.pulseAura,
            {
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
        <TouchableOpacity
          onPress={onJoin}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
        >
          <Animated.View style={{ transform: [{ scale: pressScale }] }}>
            <LinearGradient
              colors={['#C9A84C', '#A0732E', '#8A6020']}
              style={styles.heroCTA}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.heroCTAText}>SHOW UP</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── MINI CARD ──────────────────────────────────────────────────────────────
function MiniCard({
  plan,
  idx,
  onJoin,
}: {
  plan: Plan;
  idx: number;
  onJoin: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const { scale, onPressIn, onPressOut } = useSpringPress(0.94);

  useEffect(() => {
    const delay = 500 + idx * 90;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [idx]);

  return (
    <Animated.View
      style={[
        styles.miniCardWrap,
        { opacity, transform: [{ translateY }, { scale }] },
      ]}
    >
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onJoin}
        activeOpacity={1}
        style={styles.miniCard}
      >
        <LinearGradient
          colors={['#1c0a18', '#100612']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.miniGoldDot} />
        <Text style={styles.miniTitle} numberOfLines={2}>{plan.title}</Text>
        {plan.location && (
          <Text style={styles.miniMeta} numberOfLines={1}>{plan.location}</Text>
        )}
        <TouchableOpacity onPress={onJoin} style={styles.miniJoinBtn}>
          <Text style={styles.miniJoinText}>JOIN →</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── COUNT UP ────────────────────────────────────────────────────────────────
function CountUpText({
  value,
  style,
  delay = 0,
}: {
  value: number;
  style: any;
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(anim, {
        toValue: value,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    }, delay);
    return () => clearTimeout(timeout);
  }, [value]);

  return <Text style={style}>{display}</Text>;
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────
export function SwipeScreen({ navigation }: { navigation: any }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Header entrance
  const { opacity: hdrOpacity, translateY: hdrY } = useFadeSlideUp({ delay: 0, from: -18 });
  const { opacity: subOpacity, translateY: subY } = useFadeSlideUp({ delay: 120 });
  // Stats row
  const { opacity: statOpacity, translateY: statY } = useFadeSlideUp({ delay: 200 });

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get('/plans');
      setPlans(res.data?.data || res.data || []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPlans(); }, []);

  const handleJoin = useCallback(async (plan: Plan) => {
    try {
      await api.post(`/plans/${plan.id}/join`);
      navigation.navigate('Chat', { groupId: plan.group?.name ?? plan.id, planId: plan.id });
    } catch {}
  }, [navigation]);

  const heroPlans = plans.slice(0, 1);
  const gridPlans = plans.slice(1, 7);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchPlans(); }}
            tintColor={Colors.secondary}
          />
        }
      >
        {/* ── HEADER ── */}
        <Animated.View style={[styles.header, { opacity: hdrOpacity, transform: [{ translateY: hdrY }] }]}>
          <Text style={styles.headerSuper}>WHAT'S HAPPENING</Text>
          <Text style={styles.headerTitle}>TONIGHT</Text>
        </Animated.View>

        <Animated.View style={[styles.headerSub, { opacity: subOpacity, transform: [{ translateY: subY }] }]}>
          <Text style={styles.headerDesc}>Drop a plan. Someone shows up.</Text>
        </Animated.View>

        {/* ── STATS ROW ── */}
        <Animated.View style={[styles.statsRow, { opacity: statOpacity, transform: [{ translateY: statY }] }]}>
          <View style={styles.statItem}>
            <CountUpText value={plans.length} style={styles.statNumber} delay={400} />
            <Text style={styles.statLabel}>PLANS OUT</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <CountUpText
              value={plans.reduce((s, p) => s + (p.member_count ?? 0), 0)}
              style={styles.statNumber}
              delay={550}
            />
            <Text style={styles.statLabel}>PEOPLE IN</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <CountUpText
              value={plans.filter(p => p.is_active).length}
              style={[styles.statNumber, { color: Colors.primary }]}
              delay={700}
            />
            <Text style={styles.statLabel}>LIVE NOW</Text>
          </View>
        </Animated.View>

        {/* ── GOLD DIVIDER ── */}
        <View style={styles.goldRule} />

        {loading ? (
          <ActivityIndicator color={Colors.secondary} style={{ marginTop: 60 }} />
        ) : plans.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ── HERO CARD ── */}
            {heroPlans.map(p => (
              <HeroCard key={p.id} plan={p} onJoin={() => handleJoin(p)} />
            ))}

            {/* ── GRID LABEL ── */}
            {gridPlans.length > 0 && (
              <Text style={styles.gridLabel}>MORE ROOMS TONIGHT</Text>
            )}

            {/* ── MINI GRID ── */}
            <View style={styles.grid}>
              {gridPlans.map((p, i) => (
                <MiniCard key={p.id} plan={p} idx={i} onJoin={() => handleJoin(p)} />
              ))}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────────────────────
function EmptyState() {
  const { opacity, translateY } = useFadeSlideUp({ delay: 200 });
  const { scale, opacity: pulseOp } = useGoldPulse();

  return (
    <Animated.View style={[styles.emptyWrap, { opacity, transform: [{ translateY }] }]}>
      <Animated.Text style={[styles.emptyFlame, { transform: [{ scale }], opacity: pulseOp }]}>
        🕯️
      </Animated.Text>
      <Text style={styles.emptyHeading}>The night is quiet.</Text>
      <Text style={styles.emptyBody}>Be the one who lights it up.</Text>
      <Text style={styles.emptyHint}>Drop a plan in any Room — someone will show up.</Text>
    </Animated.View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: 4,
  },
  headerSuper: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    letterSpacing: 4,
    color: Colors.secondary + 'AA',
    marginBottom: 4,
  },
  headerTitle: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 52,
    color: Colors.textPrimary,
    letterSpacing: 8,
    lineHeight: 56,
  },
  headerSub: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerDesc: {
    fontFamily: 'NotoSerif_400Regular_Italic',
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 0,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 28,
    color: Colors.secondary,
    letterSpacing: 1,
  },
  statLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 2.5,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.ghost,
  },
  goldRule: {
    height: 1,
    backgroundColor: Colors.secondary + '55',
    marginBottom: 28,
    marginHorizontal: -Spacing.lg,
  },
  heroCard: {
    width: '100%',
    height: H * 0.5,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
  },
  heroGoldRule: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.secondary,
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '22',
    borderWidth: 1,
    borderColor: Colors.primary + '66',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  liveText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: Colors.primary,
    letterSpacing: 2,
  },
  pulseAura: {
    position: 'absolute',
    bottom: 20,
    left: 24,
    right: 24,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary + '25',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
  },
  heroRoomLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: Colors.secondary + 'BB',
    letterSpacing: 3,
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 34,
    marginBottom: 8,
  },
  heroMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 20,
  },
  heroCTA: {
    alignSelf: 'flex-start',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: Radius.sm,
  },
  heroCTAText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#000',
    letterSpacing: 3,
    fontWeight: '600',
  },
  gridLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    color: Colors.secondary + 'AA',
    letterSpacing: 3,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  miniCardWrap: {
    width: (W - Spacing.lg * 2 - 12) / 2,
  },
  miniCard: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.ghost,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  miniGoldDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
    marginBottom: 10,
  },
  miniTitle: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 19,
    flex: 1,
    marginBottom: 8,
  },
  miniMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    marginBottom: 12,
  },
  miniJoinBtn: {
    alignSelf: 'flex-start',
    borderBottomWidth: 1,
    borderColor: Colors.secondary + '77',
    paddingBottom: 1,
  },
  miniJoinText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.secondary,
    letterSpacing: 2,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyFlame: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyHeading: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  emptyBody: {
    fontFamily: 'NotoSerif_400Regular_Italic',
    fontSize: 15,
    color: Colors.textSecondary,
  },
  emptyHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
    marginTop: 8,
  },
});
