import axios from 'axios';

// Vite环境变量类型声明
interface ImportMetaEnv {
    readonly VITE_API_BASE_URL?: string;
    readonly [key: string]: string | undefined;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare global {
    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}

const API_BASE_URL = (import.meta as ImportMeta).env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    withCredentials: true, // 启用Cookie
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器
apiClient.interceptors.request.use(
    (config) => {
        // 从localStorage获取access token
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
apiClient.interceptors.response.use(
    (response) => {
        return response.data;
    },
    async (error) => {
        const originalRequest = error.config;

        // Token过期，尝试刷新
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // 使用axios直接请求（withCredentials自动发送Cookie）
                const response = await axios.post(
                    `${API_BASE_URL}/auth/refresh`,
                    {},
                    {
                        withCredentials: true,
                    }
                );
                const { accessToken } = response.data;

                // 只存储access token到localStorage
                localStorage.setItem('access_token', accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                return apiClient(originalRequest);
            } catch (refreshError) {
                // 刷新失败，跳转登录
                localStorage.removeItem('access_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
