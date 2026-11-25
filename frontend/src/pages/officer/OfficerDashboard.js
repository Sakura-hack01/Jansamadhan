import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          api.get('/complaints/stats'),
          api.get('/complaints?limit=5&sortBy=createdAt&sortOrder=desc'),
        ]);
        setStats(statsRes.data.data);
        setRecentComplaints(complaintsRes.data.data);
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  const byStatus = stats?.byStatus || [];
  const getCount = (status) => byStatus.find(s => s._id === status)?.count || 0;

  const statusCards = [
    { label: 'Total Assigned', value: stats?.total || 0, icon: '📋', color: '#2563eb' },
    { label: 'Pending', value: getCount('pending') + getCount('assigned'), icon: '⏳', color: '#f59e0b' },
    { label: 'In Progress', value: getCount('in_progress'), icon: '🔄', color: '#8b5cf6' },
    { label: 'Resolved', value: getCount('resolved') + getCount('closed'), icon: '✅', color: '#10b981' },
  ];

  const getStatusStyle = (status) => {
    const map = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      assigned: { bg: '#e0e7ff', color: '#3730a3' },
      in_progress: { bg: '#dbeafe', color: '#1e40af' },
      resolved: { bg: '#dcfce7', color: '#166534' },
    };
    return map[status] || map.pending;
  };

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 28, padding: '24px 32px', background: 'linear-gradient(135deg, #ffffff, #f8fafc)', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: '"Baloo 2", sans-serif', margin: '0 0 8px 0' }}>
          Officer Dashboard 👔
        </h1>
        <p style={{ fontSize: 14, color: '#475569', margin: 0 }}>
          Welcome, {user?.name}! Here are your assigned complaints.
        </p>
        {user?.department && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '6px 16px', borderRadius: 10, background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
            <span style={{ fontSize: 13, color: '#059669', fontWeight: 600 }}>🏢 {user.department?.name || 'Department'}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statusCards.map((card, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', fontFamily: '"Baloo 2", sans-serif' }}>
              {loading ? '—' : card.value}
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: 500 }}>{card.label}</div>
            <div style={{ height: 4, background: card.color, borderRadius: 2, marginTop: 14, opacity: 0.8 }} />
          </div>
        ))}
      </div>

      {/* Recent complaints */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', fontFamily: '"Baloo 2", sans-serif', margin: 0 }}>Recent Complaints</h3>
          <Link to="/officer/complaints" style={{ fontSize: 13, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>View All →</Link>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Complaint #', 'Title', 'Priority', 'Status', 'Date'].map(h => (
                <th key={h} style={{ padding: '12px 24px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : recentComplaints.map(c => {
              const st = getStatusStyle(c.status);
              return (
                <tr key={c._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '16px 24px' }}><span style={{ fontSize: 13, color: '#2563eb', fontFamily: 'monospace', fontWeight: 600 }}>{c.complaintNumber}</span></td>
                  <td style={{ padding: '16px 24px', fontSize: 14, color: '#1e293b', fontWeight: 500, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: c.priority === 'urgent' ? '#fee2e2' : '#dbeafe', color: c.priority === 'urgent' ? '#ef4444' : '#2563eb', textTransform: 'uppercase' }}>{c.priority}</span>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, background: st.bg, color: st.color, textTransform: 'uppercase' }}>{c.status?.replace('_',' ')}</span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: 13, color: '#64748b' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
