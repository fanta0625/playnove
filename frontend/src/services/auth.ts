import api from './api';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

export const authService = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        return api.post('/auth/login', data);
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        return api.post('/auth/register', data);
    },

    logout: async (): Promise<void> => {
        return api.post('/auth/logout');
    },

    refresh: async (refreshToken: string): Promise<{ accessToken: string }> => {
        return api.post('/auth/refresh', { refreshToken });
    },

    me: async () => {
        return api.get('/auth/me');
    },
};
