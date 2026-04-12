import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, Animated, Alert, Image, ActivityIndicator,
    KeyboardAvoidingView, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { api } from '../api/client';
import { useAuthStore } from '../store/auth.store';
import { useToast } from '../components/Toast';

const { width } = Dimensions.get('window');
const TOTAL_STEPS = 5;

const ZODIAC = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'Arabic', 'Portuguese', 'Bengali', 'Mandarin', 'Japanese', 'Korean'];
const INTERESTS = ['Music', 'Foodie', 'Fitness', 'Photography', 'Nature', 'Travel', 'Gaming', 'Reading', 'Art', 'Social drinks', 'Dancing', 'Wellness', 'Sports', 'Cooking', 'Cinema'];
const LIFESTYLE = ['Early bird', 'Night owl', 'Gym rat', 'Homebody', 'Social butterfly', 'Workaholic', 'Minimalist', 'Adventurer'];

// ── Progress bar ──────────────────────────────────────────
function ProgressBar({ step }: { step: number }) {
    return (
        <View style={prog.container}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View key={i} style={[prog.segment, i < step && prog.active]} />
            ))}
        </View>
    );
}
const prog = StyleSheet.create({
    container: { flexDirection: 'row', gap: 6, padding: Spacing.base },
    segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
    active: { backgroundColor: Colors.primary },
});

// ── Chip selector ─────────────────────────────────────────
function ChipRow({ options, selected, onToggle, single }: {
    options: string[]; selected: string[]; onToggle: (v: string) => void; single?: boolean;
}) {
    return (
        <View style={chip.row}>
            {options.map(opt => {
                const active = selected.includes(opt);
                return (
                    <TouchableOpacity
                        key={opt}
                        style={[chip.chip, active && chip.chipActive]}
                        onPress={() => onToggle(opt)}
                    >
                        <Text style={[chip.label, active && chip.labelActive]}>{opt}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}
const chip = StyleSheet.create({
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full,
        borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FAFAFA',
    },
    chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
    label: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
    labelActive: { color: '#fff', fontWeight: '600' },
});

// ── Steps ─────────────────────────────────────────────────
type StepProps = { data: any; onChange: (field: string, value: any) => void };

function Step1({ data, onChange }: StepProps) {
    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.stepContent} keyboardShouldPersistTaps="handled">
            <Text style={s.stepTitle}>Let's get to{'\n'}know you</Text>
            <Text style={s.stepSubtitle}>The more you share, the better your matches</Text>

            {/* Avatar */}
            <TouchableOpacity style={s.avatarUpload} activeOpacity={0.8}>
                <View style={s.avatarCircle}>
                    <Ionicons name="camera-outline" size={32} color={Colors.primary} />
                </View>
                <Text style={s.avatarLabel}>Add a photo</Text>
            </TouchableOpacity>

            <Field label="Your name" icon="person-outline" value={data.name} onChangeText={(v: string) => onChange('name', v)} />
            <Field label="Age" icon="calendar-outline" value={data.age?.toString() || ''} onChangeText={(v: string) => onChange('age', parseInt(v) || '')} keyboardType="numeric" />
            <Field label="City" icon="location-outline" value={data.city || ''} onChangeText={(v: string) => onChange('city', v)} />
            <Field label="Bio" icon="pencil-outline" value={data.bio || ''} onChangeText={(v: string) => onChange('bio', v)} multiline maxLength={150} placeholder="What makes you, you?" />
        </ScrollView>
    );
}

function Step2({ data, onChange }: StepProps) {
    const toggle = (field: string, val: string, arr: string[]) => {
        if (arr.includes(val)) onChange(field, arr.filter(v => v !== val));
        else onChange(field, [...arr, val]);
    };
    const single = (field: string, val: string, current: string) =>
        onChange(field, current === val ? '' : val);

    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.stepContent}>
            <Text style={s.stepTitle}>Your Lifestyle</Text>
            <Text style={s.stepSubtitle}>Help others understand who you are</Text>

            <SectionLabel>Relationship status</SectionLabel>
            <ChipRow
                options={['Single', 'In a relationship', 'Open relationship', 'Prefer not to say']}
                selected={data.relationshipStatus ? [data.relationshipStatus] : []}
                onToggle={v => single('relationshipStatus', v, data.relationshipStatus || '')}
                single
            />

            <SectionLabel>Kids</SectionLabel>
            <ChipRow
                options={['No kids', 'Have kids', 'Want kids', "Don't want kids"]}
                selected={[
                    data.hasKids === false && !data.wantsKids ? 'No kids' : '',
                    data.hasKids ? 'Have kids' : '',
                    data.wantsKids === true ? 'Want kids' : '',
                    data.wantsKids === false && !data.hasKids ? "Don't want kids" : '',
                ].filter(Boolean)}
                onToggle={v => {
                    if (v === 'Have kids') onChange('hasKids', !data.hasKids);
                    if (v === 'Want kids') onChange('wantsKids', !data.wantsKids);
                }}
            />

            <SectionLabel>Star sign</SectionLabel>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row', gap: 8, paddingBottom: 4 }}>
                    {ZODIAC.map(z => {
                        const active = data.zodiacSign === z;
                        return (
                            <TouchableOpacity
                                key={z}
                                onPress={() => single('zodiacSign', z, data.zodiacSign || '')}
                                style={[chip.chip, active && chip.chipActive]}
                            >
                                <Text style={[chip.label, active && chip.labelActive]}>{z}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            <SectionLabel>Languages</SectionLabel>
            <ChipRow
                options={LANGUAGES}
                selected={data.languages || []}
                onToggle={v => toggle('languages', v, data.languages || [])}
            />
        </ScrollView>
    );
}

function Step3({ data, onChange }: StepProps) {
    const toggle = (field: string, val: string, arr: string[]) => {
        if (arr.includes(val)) onChange(field, arr.filter(v => v !== val));
        else onChange(field, [...arr, val]);
    };
    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.stepContent}>
            <Text style={s.stepTitle}>What are{'\n'}you into?</Text>
            <Text style={s.stepSubtitle}>Pick at least 3 — this powers your recommendations</Text>

            <View style={s.interestGrid}>
                {INTERESTS.map(interest => {
                    const active = (data.interests || []).includes(interest);
                    return (
                        <TouchableOpacity
                            key={interest}
                            style={[s.interestTile, active && s.interestTileActive]}
                            onPress={() => toggle('interests', interest, data.interests || [])}
                        >
                            <Text style={[s.interestLabel, active && s.interestLabelActive]}>{interest}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
}

function Step4({ data, onChange }: StepProps) {
    const toggle = (field: string, val: string, arr: string[]) => {
        if (arr.includes(val)) onChange(field, arr.filter(v => v !== val));
        else onChange(field, [...arr, val]);
    };
    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={s.stepContent}>
            <Text style={s.stepTitle}>Work & Vibe</Text>
            <Text style={s.stepSubtitle}>Let people know what you're about</Text>

            <Field label="Occupation" icon="briefcase-outline" value={data.occupation || ''} onChangeText={(v: string) => onChange('occupation', v)} placeholder="Designer, Engineer, Student..." />
            <Field label="Height (cm)" icon="resize-outline" value={data.height?.toString() || ''} onChangeText={(v: string) => onChange('height', parseInt(v) || '')} keyboardType="numeric" placeholder="e.g. 175" />

            <SectionLabel>Your lifestyle</SectionLabel>
            <ChipRow
                options={LIFESTYLE}
                selected={data.lifestyle || []}
                onToggle={v => toggle('lifestyle', v, data.lifestyle || [])}
            />
        </ScrollView>
    );
}

function Step5({ data }: StepProps) {
    return (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={[s.stepContent, { alignItems: 'center' }]}>
            <View style={s.previewAvatar}>
                <Ionicons name="person" size={48} color={Colors.primary} />
            </View>
            <Text style={s.stepTitle}>{data.name}</Text>
            {data.city && <Text style={s.stepSubtitle}>{data.city}</Text>}
            {data.bio && <Text style={[s.stepSubtitle, { textAlign: 'center', marginTop: 8 }]}>{data.bio}</Text>}

            <View style={s.previewPills}>
                {data.age && <Pill text={`${data.age} yrs`} />}
                {data.zodiacSign && <Pill text={data.zodiacSign} />}
                {data.relationshipStatus && <Pill text={data.relationshipStatus} />}
                {data.occupation && <Pill text={data.occupation} />}
            </View>

            <Text style={[s.stepSubtitle, { marginTop: 24, fontWeight: '600', color: Colors.textPrimary }]}>Your interests</Text>
            <View style={chip.row}>
                {(data.interests || []).map((i: string) => (
                    <View key={i} style={[chip.chip, chip.chipActive]}><Text style={chip.labelActive}>{i}</Text></View>
                ))}
            </View>
        </ScrollView>
    );
}

// ── Helpers ───────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
    return <Text style={s.sectionLabel}>{children}</Text>;
}

function Pill({ text }: { text: string }) {
    return (
        <View style={chip.chip}>
            <Text style={chip.label}>{text}</Text>
        </View>
    );
}

function Field({ label, icon, value, onChangeText, multiline, maxLength, keyboardType, placeholder }: any) {
    return (
        <View style={s.fieldWrap}>
            <Text style={s.fieldLabel}>{label}</Text>
            <View style={s.field}>
                <Ionicons name={icon} size={18} color={Colors.textSecondary} />
                <TextInput
                    style={[s.input, multiline && { height: 90, textAlignVertical: 'top' }]}
                    value={value}
                    onChangeText={onChangeText}
                    multiline={multiline}
                    maxLength={maxLength}
                    keyboardType={keyboardType}
                    placeholder={placeholder || label}
                    placeholderTextColor={Colors.textTertiary}
                    autoCapitalize="none"
                />
            </View>
            {maxLength && (
                <Text style={s.charCount}>{value?.length || 0}/{maxLength}</Text>
            )}
        </View>
    );
}

// ── Main screen ───────────────────────────────────────────
export function ProfileCompletionScreen({ navigation }: any) {
    const { user, loadUser } = useAuthStore();
    const toast = useToast();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const scrollX = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();

    const [data, setData] = useState({
        name: user?.name || '',
        age: user?.age,
        city: '',
        bio: '',
        relationshipStatus: '',
        hasKids: undefined as boolean | undefined,
        wantsKids: undefined as boolean | undefined,
        zodiacSign: '',
        languages: [] as string[],
        interests: [] as string[],
        occupation: '',
        height: undefined as number | undefined,
        lifestyle: [] as string[],
    });

    const onChange = (field: string, value: any) => setData(prev => ({ ...prev, [field]: value }));

    const canProceed = () => {
        if (step === 1) return data.name.trim().length > 0;
        if (step === 3) return (data.interests || []).length >= 3;
        return true;
    };

    const next = async () => {
        if (step < TOTAL_STEPS) {
            setStep(step + 1);
        } else {
            setSaving(true);
            try {
                await api.patch('/users/me', { ...data, profileComplete: true });
                await loadUser();
                toast.success('Profile saved!', 'Welcome to POT');

                // If opened as a modal from Profile tab, go back.
                // Otherwise, App.tsx should auto-switch the stack.
                if (navigation.canGoBack()) {
                    navigation.goBack();
                } else {
                    // Fallback force
                    navigation.navigate('Main');
                }
            } catch {
                toast.error('Could not save profile', 'Please try again');
            } finally {
                setSaving(false);
            }
        }
    };

    const STEPS = [Step1, Step2, Step3, Step4, Step5];
    const CurrentStep = STEPS[step - 1];

    return (
        <SafeAreaView style={s.container}>
            {/* Header */}
            <View style={s.header}>
                {step > 1 && (
                    <TouchableOpacity onPress={() => setStep(step - 1)} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                )}
                <View style={{ flex: 1 }}>
                    <ProgressBar step={step} />
                </View>
                {step < TOTAL_STEPS && (
                    <TouchableOpacity onPress={() => setStep(step + 1)} style={s.skipBtn}>
                        <Text style={s.skipText}>Skip</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <CurrentStep data={data} onChange={onChange} />
            </KeyboardAvoidingView>

            {/* CTA */}
            <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[s.ctaBtn, !canProceed() && s.ctaBtnDisabled]}
                    onPress={next}
                    disabled={!canProceed() || saving}
                    activeOpacity={0.85}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={s.ctaText}>{step === TOTAL_STEPS ? 'Launch my profile' : 'Continue'}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: { flexDirection: 'row', alignItems: 'center', paddingRight: 16 },
    backBtn: { padding: 16 },
    skipBtn: { padding: 16 },
    skipText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '500' },
    stepContent: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 40 },
    stepTitle: { fontSize: 32, fontWeight: '800', fontFamily: 'Manrope_700Bold', color: Colors.textPrimary, lineHeight: 38 },
    stepSubtitle: { fontSize: 15, fontFamily: undefined, color: Colors.textSecondary, lineHeight: 22 },
    avatarUpload: { alignItems: 'center', gap: 12, marginVertical: Spacing.md },
    avatarCircle: {
        width: 110, height: 110, borderRadius: 55,
        borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FFF5F3',
    },
    avatarLabel: { fontSize: 14, fontWeight: '600', color: Colors.primary },
    fieldWrap: { gap: 6 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
    field: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        backgroundColor: '#fff', borderRadius: Radius.md,
        paddingHorizontal: Spacing.md, paddingVertical: 14,
        borderWidth: 1.5, borderColor: '#E5E7EB',
    },
    input: { flex: 1, fontSize: 16, color: Colors.textPrimary },
    charCount: { alignSelf: 'flex-end', fontSize: 12, color: Colors.textTertiary },
    sectionLabel: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.sm },
    interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    interestTile: {
        paddingHorizontal: 16, paddingVertical: 12,
        borderRadius: Radius.md, borderWidth: 1.5,
        borderColor: '#E5E7EB', backgroundColor: '#fff',
    },
    interestTileActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F3' },
    interestLabel: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
    interestLabelActive: { color: Colors.primary, fontWeight: '700' },
    previewAvatar: {
        width: 100, height: 100, borderRadius: 50,
        backgroundColor: '#FFF5F3', alignItems: 'center', justifyContent: 'center',
        borderWidth: 3, borderColor: Colors.primary, marginBottom: 12,
    },
    previewPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 16 },
    ctaWrap: { padding: Spacing.base, paddingTop: 8 },
    ctaBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.full,
        paddingVertical: 18, alignItems: 'center',
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    ctaBtnDisabled: { opacity: 0.5 },
    ctaText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
});
