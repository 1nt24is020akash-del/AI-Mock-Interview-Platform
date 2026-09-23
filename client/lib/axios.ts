import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// ── Request interceptor — attach token automatically ──────
axiosInstance.interceptors.request.use(
    (config) => {
        // runs in browser only
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ────────────
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            const requestUrl = error.config?.url || '';
            const isAuthRoute =
                requestUrl.includes('/api/auth/login') ||
                requestUrl.includes('/api/auth/register');

            // Only redirect if this was NOT a login/register attempt,
            // and the browser is not already on an authentication page
            if (
                !isAuthRoute &&
                typeof window !== 'undefined' &&
                window.location.pathname !== '/login' &&
                window.location.pathname !== '/register'
            ) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;