/**
 * POT — UserProfileScreen.tsx
 * "Velvet Noir" design — member profile card with friend CTA
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius } from '../constants/theme';
import { api } from '../api/client';
import { useAuthStore } from '../store/auth.store';
import { useToast } from '../components/Toast';

type FriendStatus = 'NONE' | 'PENDING' | 'ACCEPTED' | 'SELF';

export function UserProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const { user: me } = useAuthStore();
  const toast = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<{
    status: FriendStatus;
    friendshipId?: string;
    isSentByMe?: boolean;
  }>({ status: 'NONE' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { fetchData(); }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, statusRes] = await Promise.all([
        api.get(`/users/${userId}`),
        api.get(`/friends/status/${userId}`),
      ]);
      setProfile(profileRes.data);
      setFriendStatus(statusRes.data);
    } catch { toast.error('Could not load profile'); }
    finally { setLoading(false); }
  };

  const handleAddFriend = async () => {
    setActionLoading(true);
    try {
      if (friendStatus.status === 'ACCEPTED') {
        navigation.navigate('DirectMessage', {
          friendId: userId,
          friendName: profile.name,
          friendPhoto: profile.photoUrl,
        });
        return;
      }
      if (friendStatus.status === 'PENDING' && !friendStatus.isSentByMe) {
        await api.patch(`/friends/${friendStatus.friendshipId}/accept`);
        toast.success('Added to your circle.');
        setFriendStatus({ status: 'ACCEPTED' });
        return;
      }
      await api.post('/friends/request', { addresseeId: userId });
      toast.success('Request sent.');
      setFriendStatus({ status: 'PENDING', isSentByMe: true });
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Could not send request');
    } finally { setActionLoading(false); }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="small" color={Colors.secondary} />
      </View>
    );
  }
  if (!profile) {
    return (
      <View style={s.center}>
        <Text style={s.notFound}>Profile not found.</Text>
      </View>
    );
  }

  const isSelf = userId === me?.id;
  const reputationScore = ((profile.reputationScore || 5) * 1).toFixed(1);
  const initials = profile.name
    ?.split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const btnLabel = isSelf ? null :
    friendStatus.status === 'ACCEPTED' ? 'MESSAGE' :
      friendStatus.status === 'PENDING' && friendStatus.isSentByMe ? 'REQUEST SENT' :
        friendStatus.status === 'PENDING' ? 'ACCEPT REQUEST' :
          'ADD TO CIRCLE';

  const btnDisabled = friendStatus.status === 'PENDING' && !!friendStatus.isSentByMe;

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* ── Back ── */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>

          {/* ── Avatar Hero ── */}
          <View style={s.heroSection}>
            <View style={s.avatarRing}>
              <View style={s.avatarInner}>
                <Text style={s.avatarInitials}>{initials}</Text>
              </View>
            </View>
            <Text style={s.heroName}>{profile.name}</Text>
            {profile.occupation && (
              <Text style={s.heroSub}>{profile.occupation}</Text>
            )}
          </View>

          <View style={s.goldRule} />

          {/* ── Stats row ── */}
          <View style={s.statsRow}>
            <StatCol value={reputationScore} label="REPUTATION" gold />
            <View style={s.statDivider} />
            <StatCol value={`${profile.groupsCompleted ?? 0}`} label="PLANS" />
            <View style={s.statDivider} />
            <StatCol
              value={
                profile.groupsJoined > 0
                  ? `${Math.round((profile.groupsCompleted / profile.groupsJoined) * 100)}%`
                  : '—'
              }
              label="SHOW RATE"
            />
          </View>

          <View style={s.goldRule} />

          {/* ── Bio ── */}
          {profile.bio ? (
            <View style={s.section}>
              <Text style={s.sectionLabel}>BIO</Text>
              <Text style={s.bioText}>{profile.bio}</Text>
            </View>
          ) : null}

          {/* ── Interests ── */}
          {profile.interests?.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>INTERESTS</Text>
              <View style={s.tags}>
                {profile.interests.map((i: string) => (
                  <View key={i} style={s.tag}>
                    <Text style={s.tagText}>{i}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── City ── */}
          {profile.city && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>CITY</Text>
              <Text style={s.cityText}>{profile.city}</Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── CTA ── */}
        {!isSelf && btnLabel && (
          <View style={s.ctaWrap}>
            <TouchableOpacity
              onPress={handleAddFriend}
              disabled={btnDisabled || actionLoading}
              activeOpacity={0.85}
              style={{ width: '100%' }}
            >
              {friendStatus.status === 'ACCEPTED' ? (
                <LinearGradient
                  colors={['#F5BE3C', '#C29101']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.ctaBtn}
                >
                  <Text style={s.ctaBtnText}>{btnLabel}</Text>
                </LinearGradient>
              ) : (
                <View style={[s.ctaBtn, s.ctaBtnGhost, btnDisabled && s.ctaBtnDisabled]}>
                  {actionLoading
                    ? <ActivityIndicator size="small" color={Colors.secondary} />
                    : <Text style={[s.ctaBtnTextGhost, btnDisabled && { color: Colors.textTertiary }]}>
                      {btnLabel}
                    </Text>
                  }
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

function StatCol({ value, label, gold }: { value: string; label: string; gold?: boolean }) {
  return (
    <View style={s.statCol}>
      <Text style={[s.statVal, gold && { color: Colors.secondary }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.backgroundDeepest,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundDeepest,
  },
  notFound: {
    fontFamily: 'Newsreader_300Light_Italic',
    fontSize: 18,
    color: Colors.textMuted,
  },
  backBtn: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backArrow: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 28,
    color: Colors.textPrimary,
    lineHeight: 32,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  avatarInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 36,
    color: Colors.secondary,
    letterSpacing: 2,
  },
  heroName: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 34,
    color: Colors.textPrimary,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSub: {
    fontFamily: 'Newsreader_300Light_Italic',
    fontSize: 15,
    color: Colors.textMuted,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  goldRule: {
    height: 1,
    backgroundColor: Colors.ghost,
    marginHorizontal: 28,
    marginVertical: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statVal: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  statLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 8,
    letterSpacing: 2.0,
    color: Colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.ghost,
  },
  section: {
    paddingHorizontal: 28,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.ghost,
  },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 2.5,
    color: Colors.secondary,
    marginBottom: 10,
  },
  bioText: {
    fontFamily: 'Newsreader_400Regular',
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.ghostBorder,
    backgroundColor: Colors.surfaceLow,
  },
  tagText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.5,
    color: Colors.textSecondary,
  },
  cityText: {
    fontFamily: 'Newsreader_400Regular_Italic',
    fontSize: 15,
    color: Colors.textMuted,
    letterSpacing: 0.3,
  },
  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: Colors.backgroundDeepest,
    borderTopWidth: 1,
    borderTopColor: Colors.ghost,
  },
  ctaBtn: {
    borderRadius: 9999,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 2.5,
    color: '#1A1000',
  },
  ctaBtnGhost: {
    borderWidth: 1,
    borderColor: Colors.ghostBorder,
    backgroundColor: Colors.surfaceLow,
  },
  ctaBtnDisabled: {
    opacity: 0.4,
  },
  ctaBtnTextGhost: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 2.5,
    color: Colors.secondary,
  },
});
