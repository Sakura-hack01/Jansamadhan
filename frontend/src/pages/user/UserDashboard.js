import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, compRes] = await Promise.all([
          api.get('/complaints/stats'),
          api.get('/complaints?limit=3&sortBy=createdAt&sortOrder=desc'),
        ]);
        setStats(statsRes.data.data);
        setRecent(compRes.data.data);
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const byStatus = stats?.byStatus || [];
  const getCount = (status) => byStatus.find(s => s._id === status)?.count || 0;

  const statusCards = [
    { label: 'Total Complaints', value: stats?.total || 0, icon: '📋', color: '#2563eb', link: '/user/complaints' },
    { label: 'Pending', value: getCount('pending') + getCount('assigned'), icon: '⏳', color: '#f59e0b', link: '/user/complaints?status=pending' },
    { label: 'In Progress', value: getCount('in_progress'), icon: '🔄', color: '#8b5cf6', link: '/user/complaints?status=in_progress' },
    { label: 'Resolved', value: getCount('resolved') + getCount('closed'), icon: '✅', color: '#10b981', link: '/user/complaints?status=resolved' },
  ];

  const getStatusStyle = (status) => {
    const map = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      assigned: { bg: '#e0e7ff', color: '#3730a3' },
      in_progress: { bg: '#dbeafe', color: '#1e40af' },
      resolved: { bg: '#dcfce7', color: '#166534' },
      closed: { bg: '#f1f5f9', color: '#475569' },
    };
    return map[status] || map.pending;
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, marginBottom: 28, position: 'relative', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.05), transparent)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', fontFamily: '"Baloo 2", sans-serif', marginBottom: 6 }}>
              Welcome, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p style={{ fontSize: 14, color: '#64748b' }}>
              Your gateway to government services and grievance redressal.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/user/file-complaint" style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 15px rgba(37,99,235,0.2)' }}>
              ✍️ File Complaint
            </Link>
            <Link to="/user/delivery" style={{ padding: '12px 24px', borderRadius: 12, background: '#fff', border: '1px solid #cbd5e1', color: '#334155', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              📦 Request Delivery
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statusCards.map((card, i) => (
          <Link key={i} to={card.link} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 22, transition: 'all 0.2s', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', fontFamily: '"Baloo 2", sans-serif' }}>
                {loading ? '—' : card.value}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{card.label}</div>
              <div style={{ height: 4, background: card.color, borderRadius: 2, marginTop: 14, opacity: 0.8 }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Complaints */}
      <div className="responsive-2col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', fontFamily: '"Baloo 2", sans-serif', margin: 0 }}>Recent Complaints</h3>
            <Link to="/user/complaints" style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
          </div>
          {loading ? (
            <div style={{ padding: 20 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, marginBottom: 8, borderRadius: 8, background: '#f1f5f9' }} />)}</div>
          ) : recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📭</div>
              <p style={{ fontSize: 14, margin: 0 }}>No complaints yet</p>
              <Link to="/user/file-complaint" style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'block', marginTop: 8 }}>File your first complaint →</Link>
            </div>
          ) : recent.map(c => {
            const st = getStatusStyle(c.status);
            return (
              <Link key={c._id} to={`/user/complaints/${c._id}`} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px', borderBottom: '1px solid #f1f5f9', textDecoration: 'none', transition: 'background 0.15s' }} onMouseOver={e => e.currentTarget.style.background = '#f8fafc'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 600, marginBottom: 2 }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{c.complaintNumber} · {new Date(c.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, background: st.bg, color: st.color, textTransform: 'uppercase', flexShrink: 0 }}>
                  {c.status.replace('_',' ')}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, marginBottom: 16, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', fontFamily: '"Baloo 2", sans-serif', margin: '0 0 16px 0' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: '✍️ File New Complaint', link: '/user/file-complaint', color: '#2563eb' },
                { label: '📦 Request Delivery', link: '/user/delivery', color: '#f59e0b' },
                { label: '📋 Track Complaint', link: '/user/complaints', color: '#8b5cf6' },
                { label: '📍 Physical Grievance Centers', link: '/user/centers', color: '#000080' },
                { label: '👤 Update Profile', link: '/user/profile', color: '#10b981' },
              ].map(({ label, link }) => (
                <Link key={link} to={link} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9', color: '#334155', textDecoration: 'none', fontSize: 14, fontWeight: 600, transition: 'all 0.15s' }} onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'} onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)', border: '1px solid #bfdbfe', borderRadius: 16, padding: 20 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📞</div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 4px 0' }}>Need Help?</h4>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px 0' }}>Call toll-free helpline for assistance</p>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#2563eb', fontFamily: '"Baloo 2", sans-serif' }}>1800-11-2233</div>
            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 0 0' }}>Available Mon-Fri, 9 AM - 6 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
