import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth APIs
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    login: (data) => api.post('/auth/login', data),
    verifyOTP: (data) => api.post('/auth/verify-otp', data),
    resendOTP: (data) => api.post('/auth/resend-otp', data),
};

// User APIs
export const userAPI = {
    getProfile: () => api.get('/user/profile'),
    updateProfile: (data) => api.put('/user/profile', data),
    getPrivateKey: () => api.get('/user/private-key'),
    searchByEmail: (email) => axios.get(`http://localhost:8080/api/user/search?email=${encodeURIComponent(email)}`),
};

// Wallet APIs
export const walletAPI = {
    getMyBalance: () => api.get('/wallet/my-balance'),
    getMyInfo: () => api.get('/wallet/my-info'),
    getMyUTXOs: () => api.get('/wallet/my-utxos'),
    getBeneficiaries: () => api.get('/wallet/beneficiaries'),
    addBeneficiary: (data) => api.post('/wallet/beneficiary', data),
    removeBeneficiary: (walletId) => api.delete(`/wallet/beneficiary/${walletId}`),
    validateWallet: (walletId) => api.get(`/wallet/validate/${walletId}`),
    getBalance: (walletId) => api.get(`/wallet/balance/${walletId}`),
};

// Transaction APIs
export const transactionAPI = {
    sendMoney: (data) => api.post('/transaction/send', data),
    getHistory: () => api.get('/transaction/history'),
    getMyPending: () => api.get('/transaction/my-pending'),
    getZakatHistory: () => api.get('/transaction/zakat-history'),
    getById: (txId) => api.get(`/transaction/${txId}`),
};

// Blockchain APIs
export const blockchainAPI = {
    getChain: () => api.get('/blockchain/chain'),
    getBlock: (index) => api.get(`/blockchain/block/${index}`),
    getLatest: () => api.get('/blockchain/latest'),
    getStats: () => api.get('/blockchain/stats'),
    validate: () => api.get('/blockchain/validate'),
    mine: () => api.post('/mining/mine'),
};

// Reports APIs
export const reportsAPI = {
    getMonthly: () => api.get('/reports/monthly'),
    getZakat: () => api.get('/reports/zakat'),
    getStats: () => api.get('/reports/stats'),
};

// System APIs
export const systemAPI = {
    getSystemStats: () => api.get('/admin/system-stats'),
    getSystemLogs: () => api.get('/admin/system-logs'),
    triggerZakat: () => api.post('/admin/trigger-zakat'),
};

export default api;
