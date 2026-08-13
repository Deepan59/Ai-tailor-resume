import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Download, FileText, Clock, AlertCircle, Eye } from 'lucide-react';
import { resume, usage as usageApi } from '../services/api';
import Button from '../components/Button';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();
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

    const handleOpenTailoredResume = (item) => {
        navigate(`/result?id=${item.id}`, {
            state: {
                originalText: item.originalText,
                tailoredText: item.tailoredText,
                resumeId: item.id
            }
        });
    };

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
                            <div
                                key={item.id}
                                className="resume-item"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleOpenTailoredResume(item)}
                            >
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenTailoredResume(item);
                                        }}
                                    >
                                        <Download className="icon-sm" /> Download Tailored PDF
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
