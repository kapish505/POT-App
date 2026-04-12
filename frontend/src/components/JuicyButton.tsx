/**
 * JuicyButton — animated, spring-bouncing, glow-pulsing button for POT
 *
 * Features:
 * - Spring bounce on press
 * - Color-changing glow shadow
 * - Optional confetti burst easter egg on N-th tap
 */

import React, { useRef, useCallback } from 'react';
import {
    Animated, TouchableOpacity, Text, StyleSheet, View, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Radius } from '../constants/theme';

interface JuicyButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'accent' | 'glass' | 'outline' | 'danger' | 'mint';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
    easterEggAt?: number;      // tap count that triggers easter egg burst
    onEasterEgg?: () => void;
}

const tapCounters: Record<string, number> = {};

export function JuicyButton({
    label, onPress, variant = 'primary', size = 'md',
    disabled, loading, icon, style, textStyle, fullWidth,
    easterEggAt, onEasterEgg,
}: JuicyButtonProps) {
    const scale = useRef(new Animated.Value(1)).current;
    const glow = useRef(new Animated.Value(0)).current;
    const tapCount = useRef(0);

    const handlePressIn = useCallback(() => {
        Animated.spring(scale, {
            toValue: 0.93,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    }, [scale]);

    const handlePressOut = useCallback(() => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 30,
            bounciness: 12,
        }).start();
    }, [scale]);

    const handlePress = useCallback(() => {
        if (disabled || loading) return;

        // Glow pulse animation
        Animated.sequence([
            Animated.timing(glow, { toValue: 1, duration: 80, useNativeDriver: false }),
            Animated.timing(glow, { toValue: 0, duration: 400, useNativeDriver: false }),
        ]).start();

        // Easter egg counter
        tapCount.current += 1;
        if (easterEggAt && tapCount.current >= easterEggAt) {
            tapCount.current = 0;
            onEasterEgg?.();
        }

        onPress();
    }, [disabled, loading, glow, easterEggAt, onEasterEgg, onPress]);

    const variantStyles = getVariantStyles(variant);
    const sizeStyles = getSizeStyles(size);

    const glowColor = glow.interpolate({
        inputRange: [0, 1],
        outputRange: ['transparent', variantStyles.glowColor],
    });

    const opacity = disabled ? 0.4 : 1;

    return (
        <Animated.View
            style={[
                s.glowWrap,
                fullWidth && { width: '100%' },
                { transform: [{ scale }], opacity },
                style,
            ]}
        >
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={1}
                style={[s.btn, sizeStyles.btn, { backgroundColor: variantStyles.bg }, variantStyles.border, fullWidth && { width: '100%' }]}
            >
                {loading ? (
                    <LoadingDots color={variantStyles.textColor} />
                ) : (
                    <View style={s.inner}>
                        {icon && <View style={s.iconWrap}>{icon}</View>}
                        <Text style={[s.label, sizeStyles.label, { color: variantStyles.textColor }, textStyle]}>{label}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

// Bouncy three-dot loading indicator
function LoadingDots({ color }: { color: string }) {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        const anim = (val: Animated.Value, delay: number) =>
            Animated.loop(Animated.sequence([
                Animated.delay(delay),
                Animated.spring(val, { toValue: -6, useNativeDriver: true, speed: 30, bounciness: 10 }),
                Animated.spring(val, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
                Animated.delay(300),
            ]));
        Animated.parallel([anim(dot1, 0), anim(dot2, 120), anim(dot3, 240)]).start();
    }, []);

    return (
        <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', height: 20 }}>
            {[dot1, dot2, dot3].map((d, i) => (
                <Animated.View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color, transform: [{ translateY: d }] }} />
            ))}
        </View>
    );
}

function getVariantStyles(v: string) {
    switch (v) {
        case 'accent': return { bg: Colors.accent, textColor: '#fff', glowColor: Colors.accentGlow, border: {} };
        case 'glass': return { bg: Colors.glass, textColor: '#fff', glowColor: Colors.primaryGlow, border: { borderWidth: 1, borderColor: Colors.glassBorder } };
        case 'outline': return { bg: 'transparent', textColor: Colors.primary, glowColor: Colors.primaryGlow, border: { borderWidth: 2, borderColor: Colors.primary } };
        case 'danger': return { bg: Colors.error, textColor: '#fff', glowColor: 'rgba(255,77,140,0.4)', border: {} };
        case 'mint': return { bg: Colors.neonMint, textColor: '#0F0620', glowColor: 'rgba(0,212,170,0.4)', border: {} };
        default: return { bg: Colors.primary, textColor: '#fff', glowColor: Colors.primaryGlow, border: {} };
    }
}

function getSizeStyles(size: string) {
    switch (size) {
        case 'sm': return { btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full }, label: { fontSize: 13, fontWeight: '700' as const } };
        case 'lg': return { btn: { paddingHorizontal: 32, paddingVertical: 20, borderRadius: Radius.full }, label: { fontSize: 17, fontWeight: '800' as const } };
        default: return { btn: { paddingHorizontal: 24, paddingVertical: 15, borderRadius: Radius.full }, label: { fontSize: 15, fontWeight: '700' as const } };
    }
}

const s = StyleSheet.create({
    glowWrap: { alignSelf: 'center' },
    btn: { alignItems: 'center', justifyContent: 'center' },
    inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconWrap: {},
    label: { fontFamily: 'Manrope_700Bold', letterSpacing: -0.3 },
});
