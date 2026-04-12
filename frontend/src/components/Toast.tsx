import React, { createContext, useContext, useRef, useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, Animated, TouchableOpacity,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    subtitle?: string;
}

interface ToastContextValue {
    toast: (message: string, type?: ToastType, subtitle?: string) => void;
    success: (message: string, subtitle?: string) => void;
    error: (message: string, subtitle?: string) => void;
    info: (message: string, subtitle?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const CFG: Record<ToastType, { icon: any; iconColor: string; accent: string }> = {
    success: { icon: 'checkmark-circle-outline', iconColor: '#22C55E', accent: '#22C55E' },
    error: { icon: 'close-circle-outline', iconColor: '#FF4444', accent: '#FF4444' },
    info: { icon: 'information-circle-outline', iconColor: '#FF6D4D', accent: '#FF6D4D' },
    warning: { icon: 'warning-outline', iconColor: '#F59E0B', accent: '#F59E0B' },
};

const { width } = Dimensions.get('window');

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const translateY = useRef(new Animated.Value(-80)).current;
    const scale = useRef(new Animated.Value(0.92)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const cfg = CFG[toast.type];
    const insets = useSafeAreaInsets();

    React.useEffect(() => {
        // Entrance
        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 260, mass: 0.8 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 240 }),
            Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();

        const timer = setTimeout(() => dismiss(), 3400);
        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        Animated.parallel([
            Animated.spring(translateY, { toValue: -80, useNativeDriver: true, damping: 22, stiffness: 280 }),
            Animated.spring(scale, { toValue: 0.90, useNativeDriver: true, damping: 18 }),
            Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(() => onDismiss());
    };

    return (
        <Animated.View
            style={[
                styles.toast,
                {
                    top: insets.top + 12,
                    transform: [{ translateY }, { scale }],
                    opacity,
                },
            ]}
            pointerEvents="box-none"
        >
            {/* Left dot indicator */}
            <View style={[styles.dot, { backgroundColor: cfg.accent }]} />

            {/* Icon */}
            <Ionicons name={cfg.icon} size={20} color={cfg.iconColor} />

            {/* Text */}
            <View style={styles.textBlock}>
                <Text style={styles.msg}>{toast.message}</Text>
                {toast.subtitle ? <Text style={styles.sub}>{toast.subtitle}</Text> : null}
            </View>

            {/* Dismiss */}
            <TouchableOpacity onPress={dismiss} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close" size={14} color="rgba(30,30,30,0.35)" />
            </TouchableOpacity>
        </Animated.View>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const show = useCallback((message: string, type: ToastType = 'info', subtitle?: string) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(prev => [{ id, message, type, subtitle }, ...prev].slice(0, 2));
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const ctx: ToastContextValue = {
        toast: show,
        success: (m, s) => show(m, 'success', s),
        error: (m, s) => show(m, 'error', s),
        info: (m, s) => show(m, 'info', s),
    };

    return (
        <ToastContext.Provider value={ctx}>
            {children}
            <View style={styles.container} pointerEvents="box-none">
                {toasts.map(t => (
                    <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
                ))}
            </View>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        pointerEvents: 'box-none',
    },
    toast: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        width: width - 40,
        // White card with strong shadow — clean & premium
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 16,
        // Depth shadow
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 16,
        // Subtle border
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        flexShrink: 0,
    },
    textBlock: { flex: 1 },
    msg: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A1A1A',
        letterSpacing: 0.1,
    },
    sub: {
        fontSize: 12,
        color: '#888888',
        marginTop: 2,
        fontWeight: '400',
    },
});
