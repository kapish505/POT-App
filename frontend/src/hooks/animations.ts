/**
 * POT — animations.ts
 * Shared animation primitives for the "Velvet Noir" design system.
 * Themed around POT's USP: spontaneous social energy — plans that fizz into existence.
 *
 * Animation vocabulary:
 *   • FadeSlideUp  — editorial content materialises from below (slow, deliberate)
 *   • SpringScale  — press feedback snaps back (lively, tactile)
 *   • GoldPulse    — looping glow-scale for CTAs (heartbeat of the room)
 *   • FlameFlicker — tiny random vertical float for the brand flame element
 *   • StaggerList  — array entries appear one-by-one with delay
 *   • CountUp      — numbers tick up from 0 (stats feel earned)
 */
import { useRef, useEffect, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

// ─── FADE + SLIDE UP ───────────────────────────────────────────────────────
/**
 * Returns opacity + translateY Animated.Values.
 * Drives the editorial "materialise" entrance used on every header + card.
 */
export function useFadeSlideUp(opts?: {
  delay?: number;
  duration?: number;
  from?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(opts?.from ?? 28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: opts?.duration ?? 520,
        delay: opts?.delay ?? 0,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: opts?.duration ?? 520,
        delay: opts?.delay ?? 0,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { opacity, translateY };
}

// ─── STAGGERED LIST ────────────────────────────────────────────────────────
/**
 * Returns an array of { opacity, translateY } Animated.Values,
 * each item delayed by `stagger` ms to create a cascade entrance.
 */
export function useStaggeredList(count: number, stagger = 70, baseDelay = 200) {
  const anims = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(24),
    }))
  ).current;

  useEffect(() => {
    const animations = anims.map((a, i) =>
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 460,
          delay: baseDelay + i * stagger,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(a.translateY, {
          toValue: 0,
          duration: 460,
          delay: baseDelay + i * stagger,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    Animated.parallel(animations).start();
  }, [count]);

  return anims;
}

// ─── SPRING PRESS ──────────────────────────────────────────────────────────
/**
 * Gives an element a spring-back press feel.
 * Returns { scale, onPressIn, onPressOut } — spread into TouchableOpacity.
 */
export function useSpringPress(scaleDown = 0.95) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: scaleDown,
      useNativeDriver: true,
      velocity: 10,
      tension: 300,
      friction: 12,
    }).start();
  }, []);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      velocity: 10,
      tension: 200,
      friction: 7,
    }).start();
  }, []);

  return { scale, onPressIn, onPressOut };
}

// ─── GOLD PULSE (looping CTA heartbeat) ────────────────────────────────────
/**
 * Looping scale + opacity animation that makes CTAs "breathe".
 * Represents the heartbeat of a plan — it's alive, it wants you to tap it.
 */
export function useGoldPulse() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.06,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.55,
            duration: 900,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return { scale, opacity };
}

// ─── FLAME FLICKER (brand element float) ───────────────────────────────────
/**
 * Gentle vertical float — used on the logo / mascot.
 * POT's flame is alive. It flickers.
 */
export function useFlameFlicker() {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -6,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return translateY;
}

// ─── TYPING DOTS BOUNCE ────────────────────────────────────────────────────
/**
 * Three bouncing dots with staggered timing for chat typing indicators.
 */
export function useTypingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const loops = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: -5,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(320),
        ])
      )
    );
    loops.forEach(l => l.start());
    return () => loops.forEach(l => l.stop());
  }, []);

  return dots;
}

// ─── BUBBLE POP-IN ─────────────────────────────────────────────────────────
/**
 * New chat messages pop in with a spring scale.
 * Returns a spring-animated scale value starting at 0.
 */
export function useBubblePopIn() {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 9,
    }).start();
  }, []);

  return scale;
}

// ─── LIVE NOW SHIMMER ─────────────────────────────────────────────────────
/**
 * Crimson opacity shimmer for the "LIVE NOW" badge.
 * It feels urgent — like the room is right now.
 */
export function useLiveShimmer() {
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return opacity;
}
