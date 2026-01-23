import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Download, FileText, Clock, AlertCircle } from 'lucide-react';
import { resume, usage as usageApi } from '../services/api';
import Button from '../components/Button';
import './Dashboard.css';

export default function Dashboard() {
    const [resumes, setResumes] = useState([]);
    const [usage, setUsage] = useState({ used: 0, limit: 5 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [historyRes, usageRes] = await Promise.all([
                    resume.getHistory(),
                    usageApi.check()
                ]);
                setResumes(historyRes);
                setUsage({ used: usageRes.used, limit: usageRes.limit });
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const percentage = Math.min((usage.used / usage.limit) * 100, 100);

    if (loading) {
        return <div className="container dashboard-container">Loading...</div>;
    }

    if (error) {
        return (
            <div className="container dashboard-container">
                <div className="error-state">
                    <AlertCircle className="error-icon" />
                    <p>{error}</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    const handleDownload = async (id, title) => {
        try {
            const blob = await resume.download(id);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title || 'resume'}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download resume. Please try again.");
        }
    };

    return (
        <div className="container dashboard-container">
            {/* Header Section */}
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">My Resumes</h1>
                    <p className="dashboard-subtitle">Manage your tailored resumes and usage.</p>
                </div>
                <Link to="/create">
                    <Button size="lg">
                        <Plus className="icon-sm" /> Create New Resume
                    </Button>
                </Link>
            </div>

            {/* Resumes List */}
            <div className="resumes-list">
                {resumes.length > 0 ? (
                    resumes.map((item, index) => {
                        // Patch for legacy "Pending..." titles
                        const displayTitle = item.jobTitle === 'Pending...'
                            ? `Resume ${resumes.length - index}`
                            : item.jobTitle;

                        return (
                            <div key={item.id} className="resume-item">
                                <div className="resume-icon">
                                    <FileText />
                                </div>
                                <div className="resume-details">
                                    <h3 className="resume-job">{displayTitle}</h3>
                                    <p className="resume-meta">
                                        {item.company && item.company !== 'Pending...' && <><span>{item.company}</span><span className="dot">•</span></>}
                                        <span><Clock className="inline-icon" /> {new Date(item.date).toLocaleDateString()}</span>
                                    </p>
                                </div>
                                <div className="resume-actions">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownload(item.id, displayTitle)}
                                    >
                                        <Download className="icon-sm" /> Download
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state">
                        <p>You haven't tailored any resumes yet.</p>
                        <Link to="/create">Start now</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
