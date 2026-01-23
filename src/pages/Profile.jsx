import { useState, useEffect } from 'react';
import { User, Mail, CreditCard, BarChart2 } from 'lucide-react';
import { auth, usage as usageApi } from '../services/api';
import Button from '../components/Button';
import './Profile.css';

export default function Profile() {
    const [user, setUser] = useState(null);
    const [usage, setUsage] = useState({ used: 0, limit: 5 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userData, usageData] = await Promise.all([
                    auth.getUser(),
                    usageApi.check()
                ]);
                setUser(userData);
                setUsage({ used: usageData.used, limit: usageData.limit });
            } catch (err) {
                console.error('Failed to load profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="container profile-container">Loading...</div>;
    if (!user) return <div className="container profile-container">Failed to load profile</div>;

    const usagePercent = Math.min((usage.used / usage.limit) * 100, 100);

    return (
        <div className="container profile-container">
            <h1 className="page-title">My Profile</h1>

            <div className="profile-grid">
                {/* User Details */}
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="avatar-placeholder">
                            {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                        <div>
                            <h2>{user.name}</h2>
                            <p className="text-muted">{user.email}</p>
                        </div>
                    </div>

                    <div className="profile-actions">
                        <Button variant="outline" size="sm">Edit Profile</Button>
                    </div>
                </div>

                {/* Plan & Usage */}
                <div className="profile-card">
                    <h3>Current Plan</h3>
                    <div className="plan-info">
                        <div className="plan-detail">
                            <CreditCard className="icon-muted" />
                            <span>{user.plan || 'Free Plan'}</span>
                        </div>
                        <Button size="sm" onClick={() => window.location.href = '/payment'}>Upgrade</Button>
                    </div>

                    <div className="usage-section">
                        <div className="usage-header">
                            <span className="usage-label"><BarChart2 size={16} /> Resume Usage</span>
                            <span className="usage-value">{usage.used} / {usage.limit}</span>
                        </div>
                        <div className="usage-bar-bg">
                            <div
                                className="usage-bar-fill"
                                style={{ width: `${usagePercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
