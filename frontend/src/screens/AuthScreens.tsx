/**
 * POT — AuthScreens.tsx
 * "Velvet Noir" design — extracted from Stitch
 * Luxury nightclub × high-fashion editorial aesthetic
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth.store';
import { Colors, Typography, Spacing } from '../constants/theme';

const { width, height } = Dimensions.get('window');

// ─── Velvet Noir Underline Input ──────────────────────────────────────────
interface VelvetInputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
}

function VelvetInput({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: VelvetInputProps) {
  const [focused, setFocused] = useState(false);
  const lineAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(lineAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const onBlur = () => {
    setFocused(false);
    Animated.timing(lineAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const lineColor = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.outlineVariant, Colors.secondary],
  });

  const labelColor = lineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.textMuted, Colors.secondary],
  });

  return (
    <View style={inputStyles.container}>
      <Animated.Text style={[inputStyles.label, { color: labelColor }]}>
        {label}
      </Animated.Text>
      <TextInput
        style={inputStyles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor="transparent"
      />
      <Animated.View style={[inputStyles.line, { backgroundColor: lineColor }]} />
    </View>
  );
}

const inputStyles = StyleSheet.create({
  container: {
    marginBottom: 36,
  },
  label: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    letterSpacing: 2.0,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Newsreader_400Regular',
    fontSize: 18,
    color: Colors.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  line: {
    height: 1,
    borderRadius: 1,
  },
});

// ─── Matte Gold CTA Button ─────────────────────────────────────────────────
interface GoldButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

function GoldButton({ label, onPress, loading = false }: GoldButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        disabled={loading}
      >
        <LinearGradient
          colors={['#F5BE3C', '#C29101']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={btnStyles.pill}
        >
          <Text style={btnStyles.label}>
            {loading ? '···' : label}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const btnStyles = StyleSheet.create({
  pill: {
    borderRadius: 9999,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: '#1A1000',
  },
});

// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
export function LoginScreen({ navigation }: any) {
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Entrance animations
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkY = useRef(new Animated.Value(-24)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formY = useRef(new Animated.Value(28)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const run = (val: Animated.Value, y: Animated.Value, delay: number) =>
      Animated.parallel([
        Animated.timing(val, { toValue: 1, duration: 560, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 560, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]);
    Animated.sequence([
      run(wordmarkOpacity, wordmarkY, 0),
      run(formOpacity, formY, 80),
      run(ctaOpacity, ctaY, 60),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;
    setSubmitting(true);
    setAuthError('');
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setAuthError(e?.response?.data?.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={authStyles.root}>
      {/* Atmospheric ink blot / smoke background */}
      <LinearGradient
        colors={['rgba(139,0,0,0.55)', 'rgba(74,0,64,0.35)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.65 }}
        style={authStyles.smokeBg}
      />
      <LinearGradient
        colors={['transparent', 'rgba(13,13,13,0.80)', Colors.backgroundDeepest]}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0, y: 1 }}
        style={authStyles.smokeFade}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={authStyles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Wordmark ── */}
            <Animated.View style={[authStyles.hero, { opacity: wordmarkOpacity, transform: [{ translateY: wordmarkY }] }]}>
              <Text style={authStyles.wordmark}>POT</Text>
              <View style={authStyles.goldRule} />
              <Text style={authStyles.tagline}>Drop a plan. Someone shows up.</Text>
            </Animated.View>

            {/* ── Form ── */}
            <Animated.View style={[authStyles.form, { opacity: formOpacity, transform: [{ translateY: formY }] }]}>
              <VelvetInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <VelvetInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {authError ? (
                <Text style={authStyles.errorText}>{authError}</Text>
              ) : null}
            </Animated.View>

            <Animated.View style={{ opacity: ctaOpacity, transform: [{ translateY: ctaY }], paddingHorizontal: 32, marginTop: 24 }}>
              <GoldButton
                label="Enter the Room"
                onPress={handleLogin}
                loading={submitting}
              />

              <TouchableOpacity
                style={authStyles.ghostLink}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={authStyles.ghostText}>New to POT? Join now</Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── REGISTER SCREEN ─────────────────────────────────────────────────────────
export function RegisterScreen({ navigation }: any) {
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setSubmitting(true);
    setAuthError('');
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
    } catch (e: any) {
      setAuthError(e?.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={authStyles.root}>
      <LinearGradient
        colors={['rgba(74,0,64,0.55)', 'rgba(139,0,0,0.30)', 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.65 }}
        style={authStyles.smokeBg}
      />
      <LinearGradient
        colors={['transparent', 'rgba(13,13,13,0.80)', Colors.backgroundDeepest]}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 0, y: 1 }}
        style={authStyles.smokeFade}
      />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={authStyles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Wordmark ── */}
            <View style={authStyles.hero}>
              <Text style={authStyles.wordmark}>POT</Text>
              <View style={authStyles.goldRule} />
              <Text style={authStyles.tagline}>Join the room.</Text>
            </View>

            {/* ── Form ── */}
            <View style={authStyles.form}>
              <VelvetInput
                label="Your Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <VelvetInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              <VelvetInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {authError ? (
                <Text style={authStyles.errorText}>{authError}</Text>
              ) : null}

              <GoldButton
                label="Create Account"
                onPress={handleRegister}
                loading={submitting}
              />

              <TouchableOpacity
                style={authStyles.ghostLink}
                onPress={() => navigation.goBack()}
              >
                <Text style={authStyles.ghostText}>Already in the room? Sign in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ─── Shared Styles ─────────────────────────────────────────────────────────
const authStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.backgroundDeepest,
  },
  smokeBg: {
    ...StyleSheet.absoluteFillObject,
    height: height * 0.62,
  },
  smokeFade: {
    ...StyleSheet.absoluteFillObject,
    top: height * 0.15,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
    paddingBottom: 40,
    minHeight: height - 60,
  },
  hero: {
    paddingTop: height * 0.12,
    marginBottom: 56,
  },
  wordmark: {
    fontFamily: 'Newsreader_300Light',
    fontSize: 88,
    letterSpacing: 22,
    color: Colors.textPrimary,
    lineHeight: 88,
  },
  goldRule: {
    height: 1,
    backgroundColor: Colors.secondary,
    marginTop: 12,
    marginBottom: 16,
    width: 80,
    opacity: 0.8,
  },
  tagline: {
    fontFamily: 'Newsreader_300Light_Italic',
    fontSize: 15,
    letterSpacing: 0.3,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  form: {
    // form sits above keyboard
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: Colors.error,
    letterSpacing: 0.3,
    marginBottom: 20,
    marginTop: -20,
  },
  ghostLink: {
    marginTop: 28,
    alignSelf: 'center',
  },
  ghostText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    letterSpacing: 0.3,
    color: Colors.textTertiary,
  },
});
