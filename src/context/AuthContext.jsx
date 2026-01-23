import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // 2. Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        console.log("AuthContext: Attempting login for", email);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            console.error("AuthContext: Login error:", error);
            throw error;
        }
        console.log("AuthContext: Login successful", data);
        return data;
    };

    const signup = async (formData) => {
        const { name, email, password } = formData;
        console.log("AuthContext: Attempting signup for", email);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name,
                },
            },
        });
        if (error) {
            console.error("AuthContext: Signup error:", error);
            throw error;
        }
        console.log("AuthContext: Signup successful", data);
        return data;
    };

    const resendConfirmationEmail = async (email) => {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
        if (error) throw error;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
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
