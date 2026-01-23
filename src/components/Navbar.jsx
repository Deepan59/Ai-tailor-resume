import { Link, useNavigate } from 'react-router-dom';
import { User, FileText, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Error logging out:", error);
        }
    };

    return (
        <nav className="navbar">
            <div className="container navbar-content">
                <Link to="/" className="logo">
                    <FileText className="logo-icon" />
                    <span>ResumeAI</span>
                </Link>

                {/* Desktop Nav */}
                <div className="nav-links desktop-only">
                    {user ? (
                        <>
                            <span className="user-greeting">Hi, {user.user_metadata?.name || user.email?.split('@')[0]}</span>
                            <Link to="/dashboard" className="btn btn-ghost">Dashboard</Link>
                            <button onClick={handleLogout} className="btn btn-outline" title="Logout">
                                <LogOut className="icon-sm" />
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost">Login</Link>
                            <Link to="/signup" className="btn btn-primary">Get Started</Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="mobile-toggle mobile-only"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X /> : <Menu />}
                </button>

                {/* Mobile Nav */}
                {isMenuOpen && (
                    <div className="mobile-menu mobile-only">
                        {user ? (
                            <>
                                <div className="mobile-user-info">
                                    Hi, {user.user_metadata?.name || user.email}
                                </div>
                                <Link to="/dashboard" className="btn btn-ghost" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                                <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="btn btn-ghost">
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn btn-ghost" onClick={() => setIsMenuOpen(false)}>Login</Link>
                                <Link to="/signup" className="btn btn-primary" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
