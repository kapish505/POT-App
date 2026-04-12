import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput,
    TouchableOpacity, KeyboardAvoidingView, Platform,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Spacing, Radius } from '../constants/theme';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

const CATEGORIES = [
    { label: 'Cafe', icon: 'cafe-outline' },
    { label: 'Fitness', icon: 'barbell-outline' },
    { label: 'Movies', icon: 'film-outline' },
    { label: 'Dining', icon: 'restaurant-outline' },
    { label: 'Outdoors', icon: 'leaf-outline' },
    { label: 'Music', icon: 'musical-notes-outline' },
    { label: 'Gaming', icon: 'game-controller-outline' },
    { label: 'Art', icon: 'brush-outline' },
];

export function CreateGroupScreen({ navigation }: any) {
    const toast = useToast();
    const insets = useSafeAreaInsets();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        category: '',
        location: '',
        maxMembers: 6,
    });
    const [eventDate, setEventDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const set = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

    const formatDate = (d: Date | null) =>
        d ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : 'Pick date';
    const formatTime = (d: Date | null) =>
        d ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Pick time';

    const canSubmit = form.title.trim() && form.category && form.location.trim();

    const submit = async () => {
        if (!canSubmit) { toast.error('Please fill in the required fields'); return; }
        setSaving(true);
        try {
            const res = await api.post('/groups', {
                ...form,
                eventDate: eventDate?.toISOString(),
            });
            toast.success('Plan launched!', 'Your group is now live');
            navigation.replace('GroupDetail', { groupId: res.data.id });
        } catch (e: any) {
            toast.error('Could not create group', e.response?.data?.message || 'Try again');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={s.container}>
            {/* Header */}
            <View style={s.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <View>
                    <Text style={s.headerTitle}>Create a Plan</Text>
                    <Text style={s.headerSub}>Gather your people</Text>
                </View>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

                    {/* Cover image placeholder */}
                    <TouchableOpacity style={s.coverUpload} activeOpacity={0.85}>
                        <Ionicons name="camera-outline" size={28} color={Colors.primary} />
                        <Text style={s.coverLabel}>Add a vibe photo</Text>
                        <Text style={s.coverSub}>Optional — makes your plan stand out</Text>
                    </TouchableOpacity>

                    {/* Section: The Plan */}
                    <SectionCard title="The Plan" icon="sparkles-outline">
                        <FieldBlock label="What's the plan?" required>
                            <Input
                                placeholder="Coffee & catch-up, Weekend hike..."
                                value={form.title}
                                onChangeText={(v: string) => set('title', v)}
                            />
                        </FieldBlock>

                        <FieldBlock label="Category">
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                <View style={s.catRow}>
                                    {CATEGORIES.map(cat => {
                                        const active = form.category === cat.label;
                                        return (
                                            <TouchableOpacity
                                                key={cat.label}
                                                style={[s.catChip, active && s.catChipActive]}
                                                onPress={() => set('category', cat.label)}
                                            >
                                                <Ionicons
                                                    name={cat.icon as any}
                                                    size={16}
                                                    color={active ? '#fff' : Colors.textSecondary}
                                                />
                                                <Text style={[s.catLabel, active && s.catLabelActive]}>
                                                    {cat.label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </ScrollView>
                        </FieldBlock>

                        <FieldBlock label="Describe the vibe">
                            <Input
                                placeholder="What's the mood? Any requirements?"
                                value={form.description}
                                onChangeText={(v: string) => set('description', v)}
                                multiline
                            />
                        </FieldBlock>
                    </SectionCard>

                    {/* Section: Location & Time */}
                    <SectionCard title="Location & Time" icon="location-outline">
                        <FieldBlock label="Where?" required>
                            <Input
                                icon="location-outline"
                                placeholder="Address or place name"
                                value={form.location}
                                onChangeText={(v: string) => set('location', v)}
                            />
                        </FieldBlock>

                        <FieldBlock label="When?">
                            <View style={s.dateRow}>
                                <TouchableOpacity
                                    style={s.datePill}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                                    <Text style={s.datePillText}>{formatDate(eventDate)}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={s.datePill}
                                    onPress={() => setShowTimePicker(true)}
                                >
                                    <Ionicons name="time-outline" size={16} color={Colors.primary} />
                                    <Text style={s.datePillText}>{formatTime(eventDate)}</Text>
                                </TouchableOpacity>
                            </View>
                        </FieldBlock>
                    </SectionCard>

                    {/* Section: Squad */}
                    <SectionCard title="Squad Size" icon="people-outline">
                        <View style={s.memberRow}>
                            <TouchableOpacity
                                style={s.adjBtn}
                                onPress={() => set('maxMembers', Math.max(2, form.maxMembers - 1))}
                            >
                                <Ionicons name="remove" size={20} color={Colors.textPrimary} />
                            </TouchableOpacity>
                            <View style={s.memberCount}>
                                <Text style={s.memberNum}>{form.maxMembers}</Text>
                                <Text style={s.memberLabel}>max people</Text>
                            </View>
                            <TouchableOpacity
                                style={s.adjBtn}
                                onPress={() => set('maxMembers', Math.min(30, form.maxMembers + 1))}
                            >
                                <Ionicons name="add" size={20} color={Colors.textPrimary} />
                            </TouchableOpacity>
                        </View>
                    </SectionCard>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* CTA */}
            <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 16 }]}>
                <TouchableOpacity
                    style={[s.ctaBtn, !canSubmit && s.ctaDisabled]}
                    onPress={submit}
                    disabled={!canSubmit || saving}
                    activeOpacity={0.85}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={s.ctaText}>Launch Plan</Text>
                            <Ionicons name="rocket-outline" size={18} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    value={eventDate || new Date()}
                    mode="date"
                    minimumDate={new Date()}
                    onChange={(_, date) => { setShowDatePicker(false); if (date) setEventDate(date); }}
                />
            )}
            {showTimePicker && (
                <DateTimePicker
                    value={eventDate || new Date()}
                    mode="time"
                    onChange={(_, date) => { setShowTimePicker(false); if (date) setEventDate(date); }}
                />
            )}
        </SafeAreaView>
    );
}

function SectionCard({ title, icon, children }: any) {
    return (
        <View style={s.card}>
            <View style={s.cardHeader}>
                <Ionicons name={icon} size={18} color={Colors.primary} />
                <Text style={s.cardTitle}>{title}</Text>
            </View>
            {children}
        </View>
    );
}

function FieldBlock({ label, required, children }: any) {
    return (
        <View style={s.fieldBlock}>
            <Text style={s.fieldLabel}>{label}{required && <Text style={{ color: Colors.primary }}> *</Text>}</Text>
            {children}
        </View>
    );
}

function Input({ icon, placeholder, value, onChangeText, multiline }: any) {
    return (
        <View style={[s.inputWrap, multiline && { alignItems: 'flex-start' }]}>
            {icon && <Ionicons name={icon} size={16} color={Colors.textSecondary} />}
            <TextInput
                style={[s.input, multiline && { height: 80, textAlignVertical: 'top' }]}
                placeholder={placeholder}
                placeholderTextColor={Colors.textTertiary}
                value={value}
                onChangeText={onChangeText}
                multiline={multiline}
            />
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
    header: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 12,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
    headerSub: { fontSize: 13, color: Colors.textSecondary },
    content: { padding: Spacing.base, gap: Spacing.base, paddingBottom: 24 },
    coverUpload: {
        height: 140, borderRadius: Radius.lg, borderWidth: 2,
        borderColor: Colors.primary, borderStyle: 'dashed',
        alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: '#FFF5F3',
    },
    coverLabel: { fontSize: 15, fontWeight: '700', color: Colors.primary },
    coverSub: { fontSize: 12, color: Colors.textSecondary },
    card: {
        backgroundColor: '#fff', borderRadius: Radius.lg,
        padding: Spacing.base, gap: Spacing.md,
        borderWidth: 1, borderColor: '#F0F0F0',
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
    fieldBlock: { gap: 8 },
    fieldLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
    inputWrap: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#0F0620', borderRadius: Radius.md,
        borderWidth: 1.5, borderColor: '#E5E7EB',
        paddingHorizontal: 14, paddingVertical: 12,
    },
    input: { flex: 1, color: Colors.textPrimary, fontSize: 15 },
    catRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
    catChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.full,
        borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#0F0620',
    },
    catChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
    catLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    catLabelActive: { color: '#fff' },
    dateRow: { flexDirection: 'row', gap: 10 },
    datePill: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#FFF5F3', borderRadius: Radius.md,
        paddingHorizontal: 14, paddingVertical: 12,
        borderWidth: 1.5, borderColor: '#FFD5CC',
    },
    datePillText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
    memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 32 },
    adjBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
    },
    memberCount: { alignItems: 'center' },
    memberNum: { fontSize: 44, fontWeight: '800', color: Colors.primary },
    memberLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
    ctaWrap: { padding: Spacing.base, paddingTop: 8 },
    ctaBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.full, paddingVertical: 18,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    ctaDisabled: { opacity: 0.45 },
    ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
