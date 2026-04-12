/**
 * POT — MyGroupsScreen.tsx
 * "Velvet Noir" design extracted from Stitch
 * "ROOMS" — your private groups, like a luxury members club listing
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';
import { api } from '../api/client';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface Group {
  id: string;
  title: string;
  description: string;
  location: string;
  maxMembers: number;
  _count: { members: number };
  createdAt: string;
}

export function MyGroupsScreen({ navigation }: any) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await api.get('/groups/mine');
      setGroups(res.data?.data || res.data || []);
    } catch (_) {
      setGroups([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchGroups();
  }, [fetchGroups]));

  // ── Entrance animations
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-18)).current;
  const fabScale = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    // Reset
    headerOpacity.setValue(0);
    headerY.setValue(-18);
    fabScale.setValue(0);
    // Fire
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 480, delay: 80, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 480, delay: 80, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, delay: 400, useNativeDriver: true, tension: 150, friction: 8 }),
    ]).start();
  }, []));

  // Card spring press helper
  const useCardPress = () => {
    const sc = useRef(new Animated.Value(1)).current;
    return {
      scale: sc,
      onIn: () => Animated.spring(sc, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 12 }).start(),
      onOut: () => Animated.spring(sc, { toValue: 1, useNativeDriver: true, tension: 200, friction: 7 }).start(),
    };
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(`Leave "${title}"?`, '', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/groups/${id}`);
            setGroups(prev => prev.filter(g => g.id !== id));
          } catch (_) {
            Alert.alert('', 'Could not leave this room.', [{ text: 'OK' }]);
          }
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      {/* Subtle crimson glow bottom-left */}
      <LinearGradient
        colors={['transparent', 'rgba(139,0,0,0.08)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchGroups(); }}
              tintColor={Colors.secondary}
            />
          }
        >
          {/* ── Header ── */}
          <Animated.View style={[s.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
            <Text style={s.title}>ROOMS</Text>
            <Text style={s.sub}>Your private groups</Text>
          </Animated.View>
          <View style={s.goldRule} />

          {/* ── Group Cards ── */}
          {loading ? null : groups.length === 0 ? (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>no rooms yet</Text>
              <Text style={s.emptySub}>create one and fill it.</Text>
            </View>
          ) : (
            <View style={s.cards}>
              {groups.map((g, i) => {
                const opacity = useRef(new Animated.Value(0)).current;
                const ty = useRef(new Animated.Value(20)).current;
                useEffect(() => {
                  const delay = 200 + i * 80;
                  Animated.parallel([
                    Animated.timing(opacity, { toValue: 1, duration: 400, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                    Animated.timing(ty, { toValue: 0, duration: 400, delay, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                  ]).start();
                }, [i]);
                return (
                  <Animated.View key={g.id} style={{ opacity, transform: [{ translateY: ty }] }}>
                    <TouchableOpacity
                      style={[s.card, i > 0 && s.cardBorder]}
                      onPress={() => navigation.navigate('GroupDetail', { groupId: g.id })}
                      activeOpacity={0.75}
                    >
                      {/* Top row: name + member count */}
                      <View style={s.cardTop}>
                        <Text style={s.cardTitle} numberOfLines={1}>{g.title}</Text>
                        <View style={s.memberPill}>
                          <Text style={s.memberPillText}>
                            {g._count?.members ?? 0} members
                          </Text>
                        </View>
                      </View>

                      {/* Description */}
                      <Text style={s.cardDesc} numberOfLines={2}>{g.description || g.location}</Text>

                      {/* Bottom row */}
                      <View style={s.cardBottom}>
                        <TouchableOpacity
                          onPress={() => navigation.navigate('Chat', { groupId: g.id, groupTitle: g.title })}
                        >
                          <Text style={s.enterText}>ENTER</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(g.id, g.title)}>
                          <Text style={s.moreText}>··· Leave</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* ── Drop a Room FAB ── */}
        <Animated.View style={[s.fab, { transform: [{ scale: fabScale }] }]}>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateGroup')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#F5BE3C', '#C29101']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.fabGradient}
            >
              <Text style={s.fabText}>DROP A ROOM +</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 52,
    letterSpacing: 4,
    color: Colors.textPrimary,
    lineHeight: 54,
  },
  sub: {
    fontFamily: 'Newsreader_300Light_Italic',
    fontSize: 14,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    marginTop: 4,
  },
  goldRule: {
    height: 1,
    backgroundColor: Colors.secondary,
    opacity: 0.35,
    width: 52,
    marginBottom: 32,
  },
  emptyState: {
    paddingTop: 48,
  },
  emptyTitle: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 38,
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 10,
  },
  emptySub: {
    fontFamily: 'Newsreader_300Light_Italic',
    fontSize: 15,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  cards: {
    gap: 0,
  },
  card: {
    backgroundColor: Colors.surfaceLow,
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
  },
  cardBorder: {
    // tonal separation via bg color, no explicit border per design system
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTitle: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 17,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 12,
    letterSpacing: 0.1,
  },
  memberPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Colors.ghostBorder,
  },
  memberPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.textTertiary,
  },
  cardDesc: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 13,
    color: Colors.textMuted,
    letterSpacing: 0.2,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.ghost,
    paddingTop: 14,
  },
  enterText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 2.5,
    color: Colors.secondary,
  },
  moreText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    letterSpacing: 0.3,
    color: Colors.textTertiary,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 24,
  },
  fabGradient: {
    borderRadius: 9999,
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  fabText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 2.0,
    color: '#1A1000',
  },
});
