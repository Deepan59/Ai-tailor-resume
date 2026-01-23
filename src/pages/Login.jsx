import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';
import './Auth.css';

export default function Login() {
    const navigate = useNavigate();
    const { login, resendConfirmationEmail, user } = useAuth(); // Get user from context
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setInfo(null);

        try {
            console.log("Attempting login with:", { email: formData.email, password: formData.password });
            await login(formData.email, formData.password);
            navigate('/dashboard');
        } catch (err) {
            console.error("Login attempt failed:", err);
            if (err.message && (err.message.includes("Email not confirmed") || err.message.includes("Invalid login credentials") && false)) { // Adjust condition based on actual Supabase error
                setError(
                    <span>
                        Email not confirmed. <button type="button" onClick={handleResend} className="text-button">Resend Verification Email</button>
                    </span>
                );
            } else if (err.message && err.message.includes("Invalid login credentials")) {
                setError("Invalid email or password. If you deleted your account, please Sign Up again.");
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!formData.email) {
            setError("Please enter your email address first.");
            return;
        }
        setIsLoading(true);
        try {
            await resendConfirmationEmail(formData.email);
            setInfo("Verification email sent! Please check your inbox and spam folder.");
            setError('');
        } catch (err) {
            setError(err.message || "Failed to resend email.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value
        });
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Login to your account</p>

                {error && <div className="auth-error">{error}</div>}
                {info && <div className="auth-info" style={{ color: 'green', padding: '1rem', background: '#e6ffe6', borderRadius: '4px', marginBottom: '1rem' }}>{info}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <Input
                        id="email"
                        label="Email Address"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        id="password"
                        label="Password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <div className="forgot-password">
                        <Link to="#" className="auth-link">Forgot password?</Link>
                    </div>

                    <Button type="submit" isLoading={isLoading} className="width-full">
                        Login
                    </Button>
                </form>

                <div className="auth-footer">
                    Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
                </div>
            </div>
        </div>
    );
}
