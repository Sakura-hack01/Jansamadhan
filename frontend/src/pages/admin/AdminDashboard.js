import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../utils/api';

const COLORS = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#3b82f6'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [reportRes, userRes, deliveryRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/users/stats'),
          api.get('/delivery/stats'),
        ]);
        setStats({
          report: reportRes.data.data,
          users: userRes.data.data,
          delivery: deliveryRes.data.data,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally { setLoading(false); }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingState />;

  const overview = stats?.report?.overview || {};
  const byStatus = stats?.report?.complaintsByStatus || [];
  const trend = stats?.report?.complaintTrend || [];
  const byDept = stats?.report?.complaintsByDept || [];

  const statusData = byStatus.map(s => ({
    name: s._id?.replace('_', ' ')?.toUpperCase() || 'Unknown',
    value: s.count
  }));

  const trendData = trend.slice(-14).map(t => ({
    date: t._id?.slice(5) || '',
    complaints: t.count
  }));

  const overviewCards = [
    {
      label: 'Total Complaints', value: overview.totalComplaints || 0,
      icon: '📋', color: '#2563eb', change: '+12%',
      link: '/admin/complaints',
    },
    {
      label: 'Total Citizens', value: overview.totalUsers || 0,
      icon: '👥', color: '#8b5cf6', change: '+8%',
      link: '/admin/users',
    },
    {
      label: 'Govt. Officers', value: overview.totalOfficers || 0,
      icon: '👔', color: '#059669', change: 'Active',
      link: '/admin/users',
    },
    {
      label: 'Delivery Orders', value: overview.totalDeliveries || 0,
      icon: '📦', color: '#f59e0b', change: '+5%',
      link: '/admin/delivery',
    },
  ];

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease' }}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, Super Admin 👋 — Here's what's happening today.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/admin/complaints" style={styles.headerBtn}>View All Complaints</Link>
          <Link to="/admin/reports" style={styles.headerBtnPrimary}>📈 Reports</Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div style={styles.cardsGrid}>
        {overviewCards.map((card, i) => (
          <Link key={i} to={card.link} style={styles.cardLink}>
            <div style={styles.statCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ fontSize: 36 }}>{card.icon}</div>
                <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>{card.change}</span>
              </div>
              <div style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', fontFamily: 'Poppins, sans-serif' }}>
                {card.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 13.5, color: '#475569', fontWeight: 600, marginTop: 4 }}>{card.label}</div>
              <div style={{ height: 3, background: card.color, borderRadius: 2, marginTop: 16, opacity: 0.7 }} />
            </div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div style={styles.chartsGrid}>
        {/* Trend Chart */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📈 Complaint Trend (Last 14 days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 11 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a' }} />
              <Area type="monotone" dataKey="complaints" stroke="#000080" strokeWidth={2} fill="url(#blueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📊 Complaints by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {statusData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a' }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {statusData.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569', fontWeight: 600 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                {s.name}: {s.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Stats */}
      {byDept.length > 0 && (
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>🏢 Complaints by Department (Top 8)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDept.slice(0, 8)} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a' }} />
              <Bar dataKey="count" fill="#000080" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Quick stats row */}
      <div style={styles.quickStats}>
        <div style={styles.quickCard}>
          <div style={styles.quickIcon}>⏱️</div>
          <div>
            <div style={styles.quickValue}>{stats?.report?.avgResolutionDays || 0} days</div>
            <div style={styles.quickLabel}>Avg. Resolution Time</div>
          </div>
        </div>
        <div style={styles.quickCard}>
          <div style={styles.quickIcon}>✅</div>
          <div>
            <div style={styles.quickValue}>
              {byStatus.find(s => s._id === 'resolved')?.count || 0}
            </div>
            <div style={styles.quickLabel}>Complaints Resolved</div>
          </div>
        </div>
        <div style={styles.quickCard}>
          <div style={styles.quickIcon}>⚠️</div>
          <div>
            <div style={styles.quickValue}>
              {byStatus.find(s => s._id === 'pending')?.count || 0}
            </div>
            <div style={styles.quickLabel}>Pending Complaints</div>
          </div>
        </div>
        <div style={styles.quickCard}>
          <div style={styles.quickIcon}>📦</div>
          <div>
            <div style={styles.quickValue}>
              {stats?.delivery?.byStatus?.find(s => s._id === 'delivered')?.count || 0}
            </div>
            <div style={styles.quickLabel}>Deliveries Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const LoadingState = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
    <div className="skeleton" style={{ height: 60, borderRadius: 12, background: '#f1f5f9' }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
      {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16, background: '#f1f5f9' }} />)}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
      <div className="skeleton" style={{ height: 280, borderRadius: 16, background: '#f1f5f9' }} />
      <div className="skeleton" style={{ height: 280, borderRadius: 16, background: '#f1f5f9' }} />
    </div>
  </div>
);

const styles = {
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 32, flexWrap: 'wrap', gap: 16,
    background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
    padding: '24px 32px', borderRadius: 20,
    border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
  },
  title: {
    fontSize: 32, fontWeight: 800, color: '#0f172a',
    fontFamily: '"Baloo 2", sans-serif', margin: '0 0 8px 0'
  },
  subtitle: { fontSize: 14, color: '#475569', margin: 0 },
  headerBtn: {
    padding: '10px 20px', borderRadius: 10,
    background: '#fff',
    border: '1px solid #cbd5e1',
    color: '#334155', fontSize: 14, fontWeight: 600,
    textDecoration: 'none', boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
  },
  headerBtnPrimary: {
    padding: '10px 20px', borderRadius: 10,
    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    border: 'none', color: '#fff', fontSize: 14, fontWeight: 600,
    textDecoration: 'none', boxShadow: '0 4px 15px rgba(37,99,235,0.2)'
  },
  cardsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16, marginBottom: 24,
  },
  cardLink: { textDecoration: 'none' },
  statCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    borderRadius: 16, padding: 24,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  chartsGrid: {
    display: 'grid', gridTemplateColumns: '2fr 1fr',
    gap: 16, marginBottom: 16,
  },
  chartCard: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
    borderRadius: 16, padding: 24, marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16, fontWeight: 700, color: '#0f172a',
    margin: '0 0 20px 0', fontFamily: '"Baloo 2", sans-serif',
  },
  quickStats: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },
  quickCard: {
    display: 'flex', alignItems: 'center', gap: 16,
    padding: 20, borderRadius: 14,
    background: '#fff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
  },
  quickIcon: { fontSize: 28 },
  quickValue: { fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: '"Baloo 2", sans-serif' },
  quickLabel: { fontSize: 12, color: '#64748b', marginTop: 2 },
};
