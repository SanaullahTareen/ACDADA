import axios from 'axios';

// Base URL — use proxy in dev, direct in prod
const BASE_URL = import.meta.env.DEV ? '/api' : 'http://localhost:8000';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.detail || error.message || 'Unknown error';
        console.error('[API Error]', message);
        return Promise.reject(new Error(message));
    }
);

export default apiClient;
