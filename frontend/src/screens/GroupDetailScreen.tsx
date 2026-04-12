import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, ActivityIndicator, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../constants/theme';
import { api } from '../api/client';
import { useAuthStore } from '../store/auth.store';

function CountdownTimer({ eventDate }: { eventDate: string }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const update = () => {
            const diff = new Date(eventDate).getTime() - Date.now();
            if (diff <= 0) { setTimeLeft('Started!'); return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            setTimeLeft(`${d}d ${h}h ${m}m`);
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [eventDate]);

    return (
        <View style={cStyles.countdownBox}>
            <Text style={cStyles.countdownLabel}>⏰ Event starts in</Text>
            <Text style={cStyles.countdownValue}>{timeLeft}</Text>
        </View>
    );
}

const cStyles = StyleSheet.create({
    countdownBox: {
        backgroundColor: '#FFF5F3',
        borderWidth: 1, borderColor: '#FFD5CC',
        borderRadius: Radius.md,
        padding: Spacing.md,
        alignItems: 'center',
    },
    countdownLabel: { fontSize: Typography.sm, color: Colors.textSecondary },
    countdownValue: { fontSize: Typography.xl, fontWeight: '800', color: Colors.primary, fontVariant: ['tabular-nums'] },
});

export function GroupDetailScreen({ route, navigation }: any) {
    const { groupId } = route.params;
    const { user } = useAuthStore();
    const [group, setGroup] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => {
        fetchGroup();
    }, [groupId]);

    const fetchGroup = async () => {
        try {
            const res = await api.get(`/groups/${groupId}`);
            setGroup(res.data);
        } catch { } finally { setLoading(false); }
    };

    const handleConfirm = async () => {
        setConfirming(true);
        try {
            await api.post(`/groups/${groupId}/confirm`);
            await fetchGroup();
        } catch (e: any) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to confirm');
        } finally { setConfirming(false); }
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: `Join my plan "${group.title}" on POT! Check it out: https://pot.app/join/${group.id}`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleDelete = () => {
        Alert.alert('Delete Plan', 'Are you sure you want to delete this plan? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete(`/groups/${groupId}`);
                        navigation.navigate('Main');
                    } catch (e: any) {
                        Alert.alert('Error', e.response?.data?.message || 'Could not delete plan');
                    }
                }
            }
        ]);
    };

    if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
    if (!group) return <View style={styles.center}><Text>Group not found</Text></View>;

    const myMembership = group.members.find((m: any) => m.user.id === user?.id);
    const confirmedCount = group.members.filter((m: any) => m.status === 'CONFIRMED').length;
    const spotsLeft = group.maxMembers - group._count.members;
    const spotsPercent = (group._count.members / group.maxMembers) * 100;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Hero Image */}
                <View style={styles.heroContainer}>
                    {group.imageUrl ? (
                        <Image source={{ uri: group.imageUrl }} style={styles.heroImage} />
                    ) : (
                        <View style={[styles.heroImage, styles.heroPlaceholder]}>
                            <Text style={{ fontSize: 80 }}>🎯</Text>
                        </View>
                    )}
                    <View style={styles.heroGradient} />
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    {group.creatorId === user?.id && (
                        <TouchableOpacity style={[styles.shareBtn, { right: Spacing.base + 44 }]} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={22} color="#fff" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                        <Ionicons name="share-outline" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    {/* Title + Category */}
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.title}>{group.title}</Text>
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>#{group.category}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Organizer */}
                    <View style={styles.section}>
                        <View style={styles.organizerRow}>
                            <View style={styles.orgAvatar}>
                                <Text>👤</Text>
                            </View>
                            <View>
                                <Text style={styles.orgLabel}>Organized by</Text>
                                <Text style={styles.orgName}>{group.creator.name}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Plan Details Card */}
                    {group.eventDate && (
                        <View style={[styles.card, styles.planCard]}>
                            <Text style={styles.sectionTitle}>📋 Plan Details</Text>
                            <View style={styles.planRow}>
                                <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                                <Text style={styles.planText}>
                                    {new Date(group.eventDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </Text>
                            </View>
                            <View style={styles.planRow}>
                                <Ionicons name="time-outline" size={16} color={Colors.primary} />
                                <Text style={styles.planText}>
                                    {new Date(group.eventDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                            <View style={styles.planRow}>
                                <Ionicons name="location-outline" size={16} color={Colors.primary} />
                                <Text style={styles.planText}>{group.location}</Text>
                            </View>
                        </View>
                    )}

                    {/* Countdown */}
                    {group.eventDate && <CountdownTimer eventDate={group.eventDate} />}

                    {/* FOMO bar */}
                    <View style={[styles.card, styles.fomoCard]}>
                        <Text style={styles.fomoText}>
                            🔥 {group._count.members}/{group.maxMembers} spots filled
                            {spotsLeft > 0 && spotsLeft <= 3 ? ` — only ${spotsLeft} left!` : ''}
                        </Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${spotsPercent}%` as any }]} />
                        </View>
                    </View>

                    {/* Members */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Members ({group.members.length})</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {group.members.map((m: any) => (
                                <TouchableOpacity
                                    key={m.id}
                                    style={styles.memberItem}
                                    onPress={() => navigation.navigate('UserProfile', { userId: m.user.id })}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.memberAvatarContainer}>
                                        {m.user.photoUrl ? (
                                            <Image source={{ uri: m.user.photoUrl }} style={[styles.memberAvatar, { borderRadius: 22 }]} />
                                        ) : (
                                            <View style={[styles.memberAvatar, { backgroundColor: '#FFF5F3', alignItems: 'center', justifyContent: 'center' }]}>
                                                <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.primary }}>{m.user.name[0]}</Text>
                                            </View>
                                        )}
                                        {m.status === 'CONFIRMED' && (
                                            <View style={styles.confirmedDot}><Ionicons name="checkmark" size={8} color="#fff" /></View>
                                        )}
                                    </View>
                                    <Text style={styles.memberName} numberOfLines={1}>{m.user.name.split(' ')[0]}</Text>
                                    <View style={[styles.statusPill, m.status === 'CONFIRMED' ? styles.confirmedPill : styles.pendingPill]}>
                                        <Text style={[styles.statusText, { color: m.status === 'CONFIRMED' ? Colors.success : Colors.warning }]}>
                                            {m.status === 'CONFIRMED' ? 'Confirmed' : 'Pending'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </ScrollView>

            {/* CTAs */}
            {myMembership && (
                <View style={styles.ctaContainer}>
                    {myMembership.status !== 'CONFIRMED' && (
                        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={confirming}>
                            <Text style={styles.confirmBtnText}>
                                {confirming ? 'Confirming...' : '✓ Confirm Participation'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={styles.chatBtn}
                        onPress={() => navigation.navigate('Chat', { groupId: group.id, groupName: group.title })}
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color={Colors.primary} />
                        <Text style={styles.chatBtnText}>Join Group Chat</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.surface },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    heroContainer: { height: 300, position: 'relative' },
    heroImage: { width: '100%', height: '100%' },
    heroPlaceholder: { backgroundColor: '#F0EDE8', alignItems: 'center', justifyContent: 'center' },
    heroGradient: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
        backgroundColor: 'transparent',
        shadowColor: '#fff', shadowOffset: { width: 0, height: -60 }, shadowOpacity: 1, shadowRadius: 60,
    },
    backBtn: {
        position: 'absolute', top: Spacing.base, left: Spacing.base,
        backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: Radius.full,
        padding: Spacing.sm,
    },
    shareBtn: {
        position: 'absolute', top: Spacing.base, right: Spacing.base,
        backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: Radius.full,
        padding: Spacing.sm,
    },
    content: { padding: Spacing.base, gap: Spacing.base },
    titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
    title: { fontSize: Typography.xxl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.xs },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0EDFF', borderRadius: Radius.full,
        paddingHorizontal: Spacing.md, paddingVertical: 4,
    },
    categoryText: { color: Colors.accent, fontWeight: '600', fontSize: Typography.sm },
    section: { gap: Spacing.sm },
    sectionTitle: { fontSize: Typography.md, fontWeight: '700', color: Colors.textPrimary },
    organizerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
    orgAvatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.surfaceAlt,
        alignItems: 'center', justifyContent: 'center',
    },
    orgLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
    orgName: { fontSize: Typography.base, fontWeight: '600', color: Colors.textPrimary },
    card: { borderRadius: Radius.lg, padding: Spacing.base, backgroundColor: Colors.surface, ...Shadow.sm, gap: Spacing.sm },
    planCard: { borderLeftWidth: 3, borderLeftColor: Colors.primary },
    planRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    planText: { fontSize: Typography.base, color: Colors.textPrimary },
    fomoCard: { backgroundColor: '#FFF5F3' },
    fomoText: { fontSize: Typography.base, fontWeight: '600', color: Colors.textPrimary },
    progressBar: { height: 8, backgroundColor: '#FFD5CC', borderRadius: Radius.full, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },
    memberItem: { alignItems: 'center', marginRight: Spacing.base, width: 70 },
    memberAvatarContainer: { position: 'relative', marginBottom: Spacing.xs },
    memberAvatar: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: Colors.surfaceAlt,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: Colors.separator,
    },
    confirmedDot: {
        position: 'absolute', bottom: 0, right: 0,
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: Colors.success,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#fff',
    },
    memberName: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
    statusPill: {
        paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: Radius.full, marginTop: 2,
    },
    confirmedPill: { backgroundColor: Colors.successBg },
    pendingPill: { backgroundColor: Colors.warningBg },
    statusText: { fontSize: 9, fontWeight: '600' },
    ctaContainer: {
        padding: Spacing.base, gap: Spacing.sm,
        borderTopWidth: 1, borderTopColor: Colors.separator,
        backgroundColor: Colors.surface,
    },
    confirmBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.lg,
        padding: Spacing.base, alignItems: 'center',
    },
    confirmBtnText: { color: '#fff', fontSize: Typography.md, fontWeight: '700' },
    chatBtn: {
        backgroundColor: Colors.surface, borderRadius: Radius.lg,
        padding: Spacing.md, alignItems: 'center', flexDirection: 'row',
        justifyContent: 'center', gap: Spacing.sm,
        borderWidth: 1.5, borderColor: Colors.primary,
    },
    chatBtnText: { color: Colors.primary, fontSize: Typography.base, fontWeight: '600' },
});
