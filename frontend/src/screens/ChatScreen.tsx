/**
 * POT — ChatScreen.tsx
 * "Velvet Noir" design — group chat for rooms
 * Typographic back arrow, gold send button, dark bubble design
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { api } from '../api/client';
import { useSocket } from '../hooks/useSocket';
import { useAuthStore } from '../store/auth.store';

interface Message {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  sender: { id: string; name: string; photoUrl?: string };
}

/** Spring pop-in wrapper — every new bubble bounces in */
function AnimatedBubble({ children, isMine }: { children: React.ReactNode; isMine: boolean }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[
      { opacity, transform: [{ scale }] },
    ]}>
      {children}
    </Animated.View>
  );
}

export function ChatScreen({ route, navigation }: any) {
  const { groupId, groupTitle } = route.params;
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState<{ name: string } | null>(null);
  const [planBanner, setPlanBanner] = useState<string | null>(null);
  const flatRef = useRef<FlatList>(null);
  const typingTimeout = useRef<any>(null);
  const { emit, on } = useSocket(groupId);

  useEffect(() => {
    fetchHistory();
    fetchGroupStatus();
  }, [groupId]);

  useEffect(() => {
    const offMessage = on('new-message', ({ message }: { message: Message }) => {
      setMessages(prev => [...prev, message]);
      flatRef.current?.scrollToEnd({ animated: true });
    });
    const offTyping = on('user-typing', ({ name, isTyping: typing }: any) => {
      if (typing && name !== user?.name) setIsTyping({ name });
      else setIsTyping(null);
    });
    const offConfirm = on('member-confirmed', ({ name }: { name: string }) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: `${name} confirmed participation`,
        type: 'system',
        createdAt: new Date().toISOString(),
        sender: { id: 'system', name: 'System' },
      }]);
    });
    return () => { offMessage(); offTyping(); offConfirm(); };
  }, [on, user]);

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/chat/${groupId}/messages?limit=50`);
      setMessages(res.data);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    } catch { }
  };

  const fetchGroupStatus = async () => {
    try {
      const res = await api.get(`/groups/${groupId}`);
      if (res.data.eventDate && res.data.status === 'FINALIZATION') {
        const d = new Date(res.data.eventDate);
        setPlanBanner(
          `Plan confirmed · ${d.toLocaleDateString()} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${res.data.location}`
        );
      }
    } catch { }
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || !user) return;
    const content = input.trim();
    setInput('');
    const tempMsg: Message = {
      id: Date.now().toString(),
      content,
      type: 'text',
      createdAt: new Date().toISOString(),
      sender: { id: user.id, name: user.name },
    };
    setMessages(prev => [...prev, tempMsg]);
    flatRef.current?.scrollToEnd({ animated: true });
    emit('send-message', { groupId, content, userId: user.id });
    emit('typing-stop', { groupId, userId: user.id });
  }, [input, user, groupId, emit]);

  const handleTyping = (text: string) => {
    setInput(text);
    emit('typing-start', { groupId, userId: user?.id, name: user?.name });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emit('typing-stop', { groupId, userId: user?.id });
    }, 1500);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.type === 'system') {
      return (
        <View style={s.systemMsg}>
          <Text style={s.systemText}>{item.content}</Text>
        </View>
      );
    }
    const isMine = item.sender.id === user?.id;
    return (
      <AnimatedBubble isMine={isMine}>
        <View style={[s.msgRow, isMine ? s.msgRowRight : s.msgRowLeft]}>
          {!isMine && (
            <View style={s.msgAvatar}>
              <Text style={s.msgAvatarText}>{item.sender.name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
          )}
          <View style={s.msgGroup}>
            {!isMine && <Text style={s.msgSenderName}>{item.sender.name}</Text>}
            <View style={[s.bubble, isMine ? s.bubbleSelf : s.bubbleOther]}>
              <Text style={[s.bubbleText, isMine ? s.bubbleTextSelf : s.bubbleTextOther]}>
                {item.content}
              </Text>
            </View>
            <Text style={[s.timestamp, isMine && { textAlign: 'right' }]}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </AnimatedBubble>
    );
  };

  return (
    <View style={s.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={s.headerInfo}>
            <Text style={s.headerTitle} numberOfLines={1}>
              {groupTitle || route.params?.groupName || 'Room'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('GroupDetail', { groupId })}
            style={s.membersBtn}
          >
            <Text style={s.membersBtnText}>MEMBERS</Text>
          </TouchableOpacity>
        </View>

        {/* Gold rule */}
        <View style={s.goldRule} />

        {/* Plan Banner */}
        {planBanner && (
          <View style={s.banner}>
            <Text style={s.bannerText}>{planBanner}</Text>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={s.messageList}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* Typing indicator */}
        {isTyping && (
          <View style={s.typingRow}>
            <Text style={s.typingText}>{isTyping.name} is typing</Text>
            <View style={s.dots}>
              {[0, 1, 2].map(i => <View key={i} style={s.dot} />)}
            </View>
          </View>
        )}

        {/* Input row */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              value={input}
              onChangeText={handleTyping}
              placeholder="say something..."
              placeholderTextColor={Colors.textTertiary}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!input.trim()}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={input.trim() ? ['#F5BE3C', '#C29101'] : ['#2A2A2A', '#1C1B1B']}
                style={s.sendBtn}
              >
                <Text style={[s.sendIcon, !input.trim() && { color: Colors.textTertiary }]}>↑</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.backgroundDeepest,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    paddingRight: 8,
  },
  backArrow: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 26,
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'NotoSerif_700Bold',
    fontSize: 16,
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  membersBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: Colors.ghostBorder,
  },
  membersBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 9,
    letterSpacing: 1.8,
    color: Colors.textTertiary,
  },
  goldRule: {
    height: 1,
    backgroundColor: Colors.secondary,
    opacity: 0.2,
    marginHorizontal: 24,
    marginBottom: 4,
  },
  banner: {
    backgroundColor: Colors.goldGlowSoft,
    borderLeftWidth: 2,
    borderLeftColor: Colors.secondary,
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  bannerText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: Colors.secondary,
    letterSpacing: 0.3,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  systemMsg: {
    alignSelf: 'center',
    marginVertical: 8,
    backgroundColor: Colors.goldGlowSoft,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  systemText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    letterSpacing: 0.5,
    color: Colors.secondary,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 8,
  },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgRowRight: { justifyContent: 'flex-end' },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.ghostBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLow,
  },
  msgAvatarText: {
    fontFamily: 'Newsreader_400Regular',
    fontSize: 12,
    color: Colors.secondary,
  },
  msgGroup: { maxWidth: '72%', gap: 2 },
  msgSenderName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    letterSpacing: 0.3,
    color: Colors.textTertiary,
    marginLeft: 4,
    marginBottom: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleSelf: {
    backgroundColor: Colors.primaryContainer,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.surfaceHigh,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.ghost,
  },
  bubbleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextSelf: { color: '#FFDAD4' },
  bubbleTextOther: { color: Colors.textPrimary },
  timestamp: {
    fontFamily: 'Inter_400Regular',
    fontSize: 9,
    letterSpacing: 0.2,
    color: Colors.textTertiary,
    marginHorizontal: 4,
    marginTop: 2,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 4,
    gap: 8,
  },
  typingText: {
    fontFamily: 'Newsreader_300Light_Italic',
    fontSize: 12,
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  dots: { flexDirection: 'row', gap: 3 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textTertiary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.ghost,
    backgroundColor: Colors.backgroundDeepest,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.surfaceLow,
    borderRadius: 26,
    paddingHorizontal: 18,
    paddingVertical: 11,
    maxHeight: 100,
    minHeight: 44,
    borderWidth: 1,
    borderColor: Colors.ghost,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontFamily: 'Newsreader_700Bold',
    fontSize: 20,
    color: '#1A1000',
    lineHeight: 22,
  },
});
