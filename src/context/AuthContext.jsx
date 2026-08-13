import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyToken = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/auth/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else {
                    // Token is invalid/expired
                    localStorage.removeItem('token');
                    setUser(null);
                }
            } catch (err) {
                console.error('Failed to verify token:', err);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, []);

    const login = async (email, password) => {
        console.log("AuthContext: Attempting login for", email);
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Login failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
        console.log("AuthContext: Login successful", data.user);
        return data;
    };

    const signup = async (formData) => {
        const { name, email, password } = formData;
        console.log("AuthContext: Attempting signup for", email);
        const response = await fetch(`${API_URL}/api/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Signup failed');
        }

        const data = await response.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
        console.log("AuthContext: Signup successful", data.user);
        return data;
    };

    const resendConfirmationEmail = async (email) => {
        // Simplified POC for MongoDB; always succeeds
        console.log("Resend confirmation stubbed for email:", email);
        return { success: true };
    };

    const logout = async () => {
        localStorage.removeItem('token');
        setUser(null);
        console.log("AuthContext: User logged out");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, logout, resendConfirmationEmail, isAuthenticated: !!user }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
