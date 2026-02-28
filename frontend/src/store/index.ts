import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 用户状态
interface User {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    login: (data: { user: User; accessToken: string; refreshToken: string }) => void;
    logout: () => void;
    updateTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            login: (data) =>
                set({
                    user: data.user,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    isAuthenticated: true,
                }),
            logout: () =>
                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                }),
            updateTokens: (tokens) =>
                set({
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// 游戏状态
interface GameState {
    currentGame: any | null;
    currentLevel: any | null;
    score: number;
    startTime: number | null;
    setCurrentGame: (game: any) => void;
    setCurrentLevel: (level: any) => void;
    setScore: (score: number) => void;
    startGame: () => void;
    resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    currentGame: null,
    currentLevel: null,
    score: 0,
    startTime: null,
    setCurrentGame: (game) => set({ currentGame: game }),
    setCurrentLevel: (level) => set({ currentLevel: level }),
    setScore: (score) => set({ score }),
    startGame: () => set({ startTime: Date.now(), score: 0 }),
    resetGame: () =>
        set({
            currentGame: null,
            currentLevel: null,
            score: 0,
            startTime: null,
        }),
}));

// UI状态
interface UIState {
    sidebarOpen: boolean;
    loading: boolean;
    notification: {
        open: boolean;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
    } | null;
    toggleSidebar: () => void;
    setLoading: (loading: boolean) => void;
    showNotification: (
        message: string,
        type: 'success' | 'error' | 'warning' | 'info'
    ) => void;
    hideNotification: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    loading: false,
    notification: null,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setLoading: (loading) => set({ loading }),
    showNotification: (message, type) =>
        set({ notification: { open: true, message, type } }),
    hideNotification: () => set({ notification: null }),
}));
