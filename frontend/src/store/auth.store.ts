import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../api/client';

interface User {
    id: string;
    name: string;
    email: string;
    photoUrl?: string;
    age?: number;
    city?: string;
    bio?: string;
    occupation?: string;
    zodiacSign?: string;
    relationshipStatus?: string;
    interests: string[];
    languages: string[];
    lifestyle: string[];
    height?: number;
    hasKids?: boolean;
    wantsKids?: boolean;
    reputationScore: number;
    attendanceScore: number;
    behaviorScore: number;
    completionRate: number;
    groupsJoined: number;
    groupsCompleted: number;
    profileComplete: boolean;
}


interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    isAuthenticated: false,
    isLoading: true,

    loadUser: async () => {
        try {
            const token = await SecureStore.getItemAsync('accessToken');
            if (!token) {
                set({ isLoading: false, isAuthenticated: false });
                return;
            }
            const res = await api.get('/users/me');
            set({ user: res.data, isAuthenticated: true, isLoading: false });
        } catch {
            set({ isLoading: false, isAuthenticated: false });
        }
    },

    login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        const { accessToken, refreshToken } = res.data;
        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', refreshToken);
        await get().loadUser();
    },

    register: async (name, email, password) => {
        const res = await api.post('/auth/register', { name, email, password });
        const { accessToken, refreshToken } = res.data;
        await SecureStore.setItemAsync('accessToken', accessToken);
        await SecureStore.setItemAsync('refreshToken', refreshToken);
        await get().loadUser();
    },

    logout: async () => {
        try { await api.post('/auth/logout'); } catch { }
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        set({ user: null, isAuthenticated: false });
    },
}));
