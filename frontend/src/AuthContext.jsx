import { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from './api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) {
            const userData = JSON.parse(localStorage.getItem('user') || 'null');
            setUser(userData);
        }
    }, [token]);

    const signup = async (userData) => {
        setLoading(true);
        try {
            const response = await authAPI.signup(userData);
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Signup failed' };
        } finally {
            setLoading(false);
        }
    };

    const login = async (email) => {
        setLoading(true);
        try {
            const response = await authAPI.login({ email });
            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Login failed' };
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async (email, otp) => {
        setLoading(true);
        try {
            const response = await authAPI.verifyOTP({ email, otp });
            const { token: newToken, user: userData } = response.data;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));

            setToken(newToken);
            setUser(userData);

            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'OTP verification failed' };
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = async (googleToken) => {
        setLoading(true);
        try {
            const response = await authAPI.googleLogin({ token: googleToken });
            const { token: newToken, user: userData } = response.data;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData));

            setToken(newToken);
            setUser(userData);

            return { success: true, data: response.data };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Google login failed' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token,
        signup,
        login,
        verifyOTP,
        googleLogin,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
