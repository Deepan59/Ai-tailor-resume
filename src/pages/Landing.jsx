import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, CheckCircle, Sparkles, Upload, Download, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import './Landing.css';

export default function Landing() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Redirect to dashboard if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="container">
                    <div className="hero-content">
                        <h1 className="hero-title">Tailor Your Resume for Every Job Using AI</h1>
                        <p className="hero-subtitle">
                            Upload your resume, paste a job description, and get an ATS-optimized resume in 60 seconds.
                        </p>
                        <div className="hero-actions">
                            <Link to="/signup" className="btn btn-primary btn-lg">Try Free</Link>
                            <Link to="/login" className="btn btn-ghost btn-lg">Get Started</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="section bg-surface">
                <div className="container">
                    <h2 className="section-title">How It Works</h2>
                    <div className="steps-grid">
                        <div className="step-card">
                            <div className="step-icon"><Upload /></div>
                            <h3>1. Upload Resume</h3>
                            <p>Upload your existing resume in PDF or DOCX format.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-icon"><FileText /></div>
                            <h3>2. Paste Job Description</h3>
                            <p>Copy and paste the job description you are applying for.</p>
                        </div>
                        <div className="step-card">
                            <div className="step-icon"><Zap /></div>
                            <h3>3. Download Tailored Resume</h3>
                            <p>Get an AI-optimized resume ready for application.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="section">
                <div className="container">
                    <h2 className="section-title">Why Use Our Tool?</h2>
                    <div className="benefits-grid">
                        <div className="benefit-item">
                            <CheckCircle className="benefit-icon" />
                            <div>
                                <h3>ATS-Friendly</h3>
                                <p>Optimized keywords to pass Applicant Tracking Systems.</p>
                            </div>
                        </div>
                        <div className="benefit-item">
                            <CheckCircle className="benefit-icon" />
                            <div>
                                <h3>Faster Applications</h3>
                                <p>Stop wasting hours manual editing multiple resumes.</p>
                            </div>
                        </div>
                        <div className="benefit-item">
                            <CheckCircle className="benefit-icon" />
                            <div>
                                <h3>No Fake Skills</h3>
                                <p>We only highlight your real skills relevant to the job.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section Removed */}
        </div>
    );
}
