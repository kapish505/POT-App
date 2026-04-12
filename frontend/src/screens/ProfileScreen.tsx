/**
 * POT — ProfileScreen.tsx
 * "Velvet Noir" design extracted from Stitch
 * Editorial "Member Card" — exclusive, atmospheric, personal
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';
import { useAuthStore } from '../store/auth.store';
import { api } from '../api/client';

const { width: SCREEN_W } = Dimensions.get('window');

interface PlanHistory {
  id: string;
  title: string;
  location: string;
  createdAt: string;
}

export function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();
  const [plans, setPlans] = useState<PlanHistory[]>([]);
  const [stats, setStats] = useState({ plans: 0, shownUp: 0, friends: 0 });

  // ── Animation values
  const avatarOpacity = useRef(new Animated.Value(0)).current;
  const avatarScale = useRef(new Animated.Value(0.85)).current;
  const statsOpacity = useRef(new Animated.Value(0)).current;
  const statsY = useRef(new Animated.Value(20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    fetchProfile();

    // ── Entrance animations
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(avatarOpacity, { toValue: 1, duration: 500, delay: 100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(avatarScale, { toValue: 1, delay: 100, useNativeDriver: true, tension: 120, friction: 8 }),
      ]),
      Animated.parallel([
        Animated.timing(statsOpacity, { toValue: 1, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(statsY, { toValue: 0, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 0, duration: 480, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const fetchProfile = async () => {
    try {
      const [plansRes, friendsRes] = await Promise.all([
        api.get('/groups/mine'),
        api.get('/friends').catch(() => ({ data: [] })),
      ]);
      const myPlans = plansRes.data?.data || plansRes.data || [];
      setPlans(myPlans.slice(0, 8));
      setStats({
        plans: myPlans.length,
        shownUp: myPlans.filter((p: any) => p._count?.members > 1).length,
        friends: (friendsRes.data?.data || friendsRes.data || []).length,
      });
    } catch (_) {}
  };

  const handleSignOut = () => {
    Alert.alert('Leave the room?', '', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const initial = user?.name?.[0]?.toUpperCase() || 'P';

  return (
    <View style={s.root}>
      {/* Ambient plum glow top-right */}
      <LinearGradient
        colors={['rgba(111,37,96,0.20)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* ── Hero: Avatar + Name ── */}
          <Animated.View style={[s.hero, { opacity: avatarOpacity, transform: [{ scale: avatarScale }] }]}>
            {/* Gold ring avatar */}
            <View style={s.avatarRing}>
              <Text style={s.avatarInitial}>{initial}</Text>
            </View>

            <Text style={s.name}>{user?.name || 'Anonymous'}</Text>
            <Text style={s.sub}>Spontaneous · {user?.city || 'Nearby'}</Text>

            {/* Gold rule */}
            <View style={s.goldRule} />
          </Animated.View>

          {/* ── Stats Row ── */}
          <Animated.View style={[s.statsRow, { opacity: statsOpacity, transform: [{ translateY: statsY }] }]}>
            {[
              { val: stats.plans, label: 'PLANS' },
              { val: stats.shownUp, label: 'SHOWN UP' },
              { val: stats.friends, label: 'CIRCLE' },
            ].map((item, i) => (
              <View key={i} style={[s.statCol, i > 0 && s.statBorder]}>
                <Text style={s.statNum}>{item.val}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View style={{ opacity: contentOpacity, transform: [{ translateY: contentY }] }}>
          {/* ── Your Nights ── */}
          <View style={s.section}>
            <Text style={s.sectionHeader}>YOUR NIGHTS</Text>
            {plans.length === 0 ? (
              <Text style={s.emptySection}>No nights yet. Drop your first plan.</Text>
            ) : (
              plans.map((p, i) => (
                <View key={p.id} style={[s.planRow, i > 0 && s.planBorder]}>
                  <Text style={s.planTitle} numberOfLines={1}>{p.title}</Text>
                  <Text style={s.planLocation} numberOfLines={1}>{p.location}</Text>
                </View>
              ))
            )}
          </View>

          {/* ── Settings ── */}
          <View style={s.section}>
            <Text style={s.sectionHeader}>SETTINGS</Text>
            <TouchableOpacity
              style={s.settingRow}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={s.settingText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.settingRow, s.planBorder]} onPress={handleSignOut}>
              <Text style={[s.settingText, { color: Colors.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
          </Animated.View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.backgroundDeepest,
  },
  scroll: {
    paddingHorizontal: 28,
    paddingTop: 20,
  },
  hero: {
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  avatarInitial: {
    fontFamily: 'Newsreader_400Regular',
    fontSize: 28,
    color: Colors.secondary,
  },
  name: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 40,
    letterSpacing: 2,
    color: Colors.textPrimary,
    lineHeight: 44,
    marginBottom: 6,
  },
  sub: {
    fontFamily: 'Newsreader_300Light_Italic',
    fontSize: 14,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    marginBottom: 20,
  },
  goldRule: {
    height: 1,
    backgroundColor: Colors.secondary,
    opacity: 0.45,
    width: 56,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLow,
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 32,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statBorder: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.ghost,
  },
  statNum: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 32,
    color: Colors.secondary,
    letterSpacing: 1,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 9,
    letterSpacing: 2.0,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  section: {
    marginBottom: 36,
  },
  sectionHeader: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 3.0,
    color: Colors.secondary,
    marginBottom: 16,
  },
  emptySection: {
    fontFamily: 'Newsreader_300Light_Italic',
    fontSize: 15,
    color: Colors.textTertiary,
    letterSpacing: 0.3,
  },
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  planBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.ghost,
  },
  planTitle: {
    fontFamily: 'NotoSerif_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
  },
  planLocation: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  settingRow: {
    paddingVertical: 18,
  },
  settingText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
});
