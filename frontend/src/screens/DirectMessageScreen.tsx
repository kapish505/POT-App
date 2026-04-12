import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { api } from '../api/client';
import { useAuthStore } from '../store/auth.store';

interface DM {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    read: boolean;
    createdAt: string;
    sender: { id: string; name: string; photoUrl?: string };
}

export function DirectMessageScreen({ route, navigation }: any) {
    const { friendId, friendName, friendPhoto } = route.params;
    const { user } = useAuthStore();
    const [messages, setMessages] = useState<DM[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const flatRef = useRef<FlatList>(null);

    useEffect(() => { fetchMessages(); }, [friendId]);

    const fetchMessages = async () => {
        try {
            const res = await api.get(`/friends/dm/${friendId}`);
            setMessages(res.data);
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
        } catch { }
    };

    const handleSend = useCallback(async () => {
        if (!input.trim() || !user) return;
        const content = input.trim();
        setInput('');
        setSending(true);

        // Optimistic update
        const temp: DM = {
            id: Date.now().toString(),
            content,
            senderId: user.id,
            receiverId: friendId,
            read: false,
            createdAt: new Date().toISOString(),
            sender: { id: user.id, name: user.name },
        };
        setMessages(prev => [...prev, temp]);
        flatRef.current?.scrollToEnd({ animated: true });

        try {
            const res = await api.post('/friends/dm', { receiverId: friendId, content });
            setMessages(prev => prev.map(m => m.id === temp.id ? res.data : m));
        } catch {
            setMessages(prev => prev.filter(m => m.id !== temp.id));
        } finally { setSending(false); }
    }, [input, user, friendId]);

    const renderMsg = ({ item, index }: { item: DM; index: number }) => {
        const isMine = item.senderId === user?.id;
        const prev = messages[index - 1];
        const showDate = !prev || new Date(item.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();

        return (
            <>
                {showDate && (
                    <View style={s.dateRow}>
                        <Text style={s.dateText}>
                            {new Date(item.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </Text>
                    </View>
                )}
                <View style={[s.msgRow, isMine ? s.rowRight : s.rowLeft]}>
                    {!isMine && (
                        <View style={s.avatar}>
                            {friendPhoto ? (
                                <Image source={{ uri: friendPhoto }} style={s.avatarImg} />
                            ) : (
                                <Text style={s.avatarInitial}>{friendName[0]}</Text>
                            )}
                        </View>
                    )}
                    <View style={[s.bubble, isMine ? s.bubbleSelf : s.bubbleOther]}>
                        <Text style={[s.bubbleTxt, isMine ? s.selfTxt : s.otherTxt]}>{item.content}</Text>
                    </View>
                </View>
                <Text style={[s.time, isMine ? s.timeRight : s.timeLeft]}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </>
        );
    };

    return (
        <SafeAreaView style={s.container} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
                    <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                    style={s.headerInfo}
                    onPress={() => navigation.navigate('UserProfile', { userId: friendId })}
                    activeOpacity={0.8}
                >
                    <View style={s.headerAvatar}>
                        {friendPhoto ? (
                            <Image source={{ uri: friendPhoto }} style={s.headerAvatarImg} />
                        ) : (
                            <Text style={s.headerAvatarInitial}>{friendName[0]}</Text>
                        )}
                    </View>
                    <View>
                        <Text style={s.headerName}>{friendName}</Text>
                        <Text style={s.headerSub}>Tap to view profile</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={s.infoBtn}>
                    <Ionicons name="information-circle-outline" size={24} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatRef}
                data={messages}
                renderItem={renderMsg}
                keyExtractor={item => item.id}
                contentContainerStyle={s.msgList}
                onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
                ListEmptyComponent={
                    <View style={s.emptyWrap}>
                        <View style={s.emptyAvatar}>
                            {friendPhoto ? (
                                <Image source={{ uri: friendPhoto }} style={s.emptyAvatarImg} />
                            ) : (
                                <Text style={s.emptyAvatarInitial}>{friendName[0]}</Text>
                            )}
                        </View>
                        <Text style={s.emptyName}>{friendName}</Text>
                        <Text style={s.emptyHint}>You're now connected. Say hello!</Text>
                    </View>
                }
            />

            {/* Input */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={s.inputRow}>
                    <TextInput
                        style={s.input}
                        value={input}
                        onChangeText={setInput}
                        placeholder="Message..."
                        placeholderTextColor={Colors.textTertiary}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[s.sendBtn, !input.trim() && s.sendDisabled]}
                        onPress={handleSend}
                        disabled={!input.trim() || sending}
                    >
                        <Ionicons name="arrow-up" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
    },
    back: { padding: 4 },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#FFF5F3', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    },
    headerAvatarImg: { width: 40, height: 40 },
    headerAvatarInitial: { fontSize: 16, fontWeight: '800', color: Colors.primary },
    headerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
    headerSub: { fontSize: 11, color: Colors.textTertiary },
    infoBtn: { padding: 4 },
    msgList: { padding: 16, paddingBottom: 20 },
    dateRow: { alignItems: 'center', marginVertical: 16 },
    dateText: { fontSize: 11, color: Colors.textTertiary, fontWeight: '600', backgroundColor: '#F0F0F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '80%', marginBottom: 2 },
    rowLeft: { alignSelf: 'flex-start' },
    rowRight: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF5F3', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    avatarImg: { width: 28, height: 28 },
    avatarInitial: { fontSize: 12, fontWeight: '800', color: Colors.primary },
    bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: 260 },
    bubbleSelf: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 1 },
    bubbleTxt: { fontSize: 15, lineHeight: 20 },
    selfTxt: { color: '#fff' },
    otherTxt: { color: Colors.textPrimary },
    time: { fontSize: 10, color: Colors.textTertiary, marginBottom: 8 },
    timeLeft: { marginLeft: 44 },
    timeRight: { textAlign: 'right', marginRight: 4 },
    inputRow: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 8,
        paddingHorizontal: 12, paddingVertical: 10,
        backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0F0F0',
    },
    input: {
        flex: 1, backgroundColor: '#F4F4F4', borderRadius: 22,
        paddingHorizontal: 16, paddingVertical: 10,
        fontSize: 15, color: Colors.textPrimary, maxHeight: 100, minHeight: 42,
    },
    sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    sendDisabled: { backgroundColor: '#D0D0D0' },
    emptyWrap: { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF5F3', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    emptyAvatarImg: { width: 80, height: 80 },
    emptyAvatarInitial: { fontSize: 32, fontWeight: '900', color: Colors.primary },
    emptyName: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
    emptyHint: { fontSize: 14, color: Colors.textSecondary },
});
