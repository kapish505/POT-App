/**
 * POT — FriendsScreen.tsx
 * "Velvet Noir" design extracted from Stitch
 * Exclusive "inner circle" — luxury club directory aesthetic
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/theme';
import { api } from '../api/client';

const { width: SCREEN_W } = Dimensions.get('window');

interface Friend {
  id: string;
  name: string;
  photoUrl?: string;
  plansCount?: number;
}

export function FriendsScreen({ navigation }: any) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // ── Animation values
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(-30)).current;
  const searchX = useRef(new Animated.Value(SCREEN_W * 0.3)).current;
  const searchOpacity = useRef(new Animated.Value(0)).current;
  const rowAnims = useRef(Array.from({ length: 20 }, () => ({
    opacity: new Animated.Value(0),
    y: new Animated.Value(18),
  }))).current;

  useEffect(() => {
    fetchFriends();

    // Header slide-down
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    // Search bar slide-in from right
    Animated.parallel([
      Animated.timing(searchOpacity, { toValue: 1, duration: 360, delay: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(searchX, { toValue: 0, duration: 360, delay: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await api.get('/friends');
      setFriends(res.data?.data || res.data || []);
    } catch (_) {
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  // Cascade rows in when friends data arrives
  useEffect(() => {
    if (friends.length === 0) return;
    const anims = friends.slice(0, 20).map((_, i) =>
      Animated.parallel([
        Animated.timing(rowAnims[i].opacity, { toValue: 1, duration: 300, delay: i * 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(rowAnims[i].y, { toValue: 0, duration: 300, delay: i * 80, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ])
    );
    Animated.parallel(anims).start();
  }, [friends]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const results = res.data?.data || res.data || [];
      if (results.length === 0) {
        Alert.alert('', 'No one found with that name.', [{ text: 'OK' }]);
      } else {
        navigation.navigate('UserProfile', { userId: results[0].id });
      }
    } catch (_) {
      Alert.alert('', 'Could not search right now.', [{ text: 'OK' }]);
    }
  };

  return (
    <View style={s.root}>
      {/* Subtle plum atmosphere top-left */}
      <LinearGradient
        colors={['rgba(74,0,64,0.15)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <Animated.View style={[s.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
            <Text style={s.title}>CIRCLE</Text>
            <Text style={s.sub}>{friends.length} connection{friends.length !== 1 ? 's' : ''}</Text>
          </Animated.View>
          <View style={s.goldRule} />

          {/* ── Friends List ── */}
          {friends.length > 0 && (
            <>
              <Text style={s.sectionLabel}>YOUR CIRCLE</Text>
              <View>
                {friends.map((f, i) => (
                  <Animated.View
                    key={f.id}
                    style={[s.friendRow, i > 0 && s.divider,
                      { opacity: rowAnims[Math.min(i, 19)].opacity,
                        transform: [{ translateY: rowAnims[Math.min(i, 19)].y }] }
                    ]}
                  >
                    {/* Avatar */}
                    <View style={s.avatar}>
                      <Text style={s.avatarInitial}>{f.name?.[0]?.toUpperCase() || '?'}</Text>
                    </View>
                    {/* Info */}
                    <View style={s.friendInfo}>
                      <Text style={s.friendName}>{f.name}</Text>
                      <Text style={s.friendMeta}>
                        {f.plansCount ?? 0} plan{(f.plansCount ?? 0) !== 1 ? 's' : ''} together
                      </Text>
                    </View>
                    {/* View */}
                    <TouchableOpacity
                      onPress={() => navigation.navigate('UserProfile', { userId: f.id })}
                    >
                      <Text style={s.viewLink}>VIEW</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </>
          )}

          {friends.length === 0 && !loading && (
            <View style={s.emptyState}>
              <Text style={s.emptyTitle}>No circle yet.</Text>
              <Text style={s.emptySub}>Find people you meet at plans.</Text>
            </View>
          )}

          {/* ── Find People ── */}
          <View style={s.findSection}>
            <Text style={s.sectionLabel}>FIND PEOPLE</Text>
            <View style={s.searchContainer}>
              <TextInput
                style={s.searchInput}
                placeholder="search by name..."
                placeholderTextColor={Colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <View style={[s.searchLine, searchFocused && s.searchLineFocused]} />
            </View>
            <TouchableOpacity onPress={handleSearch} style={s.searchBtn}>
              <View style={s.searchBtnInner}>
                <Text style={s.searchBtnText}>Search</Text>
              </View>
            </TouchableOpacity>
          </View>

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
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    letterSpacing: 0.3,
    color: Colors.textMuted,
    marginTop: 4,
  },
  goldRule: {
    height: 1,
    backgroundColor: Colors.secondary,
    opacity: 0.35,
    width: 48,
    marginBottom: 28,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 3.0,
    color: Colors.secondary,
    marginBottom: 16,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Colors.ghost,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
  },
  avatarInitial: {
    fontFamily: 'Newsreader_400Regular',
    fontSize: 16,
    color: Colors.secondary,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontFamily: 'NotoSerif_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  friendMeta: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  viewLink: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 2.0,
    color: Colors.textTertiary,
  },
  emptyState: {
    paddingTop: 32,
    marginBottom: 40,
  },
  emptyTitle: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  emptySub: {
    fontFamily: 'Newsreader_300Light_Italic',
    fontSize: 14,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  findSection: {
    marginTop: 36,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    fontFamily: 'Newsreader_400Regular',
    fontSize: 17,
    color: Colors.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  searchLine: {
    height: 1,
    backgroundColor: Colors.outlineVariant,
  },
  searchLineFocused: {
    backgroundColor: Colors.secondary,
  },
  searchBtn: {
    alignSelf: 'flex-start',
  },
  searchBtnInner: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceHigh,
    borderWidth: 1,
    borderColor: Colors.ghostBorder,
  },
  searchBtnText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 1.5,
    color: Colors.textSecondary,
  },
});
