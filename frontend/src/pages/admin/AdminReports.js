import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#000080', '#138808', '#FF9933', '#7c3aed', '#dc2626', '#0284c7'];

export default function AdminReports() {
  const [summary, setSummary] = useState(null);
  const [deptReport, setDeptReport] = useState([]);
  const [officerReport, setOfficerReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(dateRange);
      const [sumRes, deptRes, offRes] = await Promise.all([
        api.get(`/reports/summary?${params}`),
        api.get('/reports/departments'),
        api.get('/reports/officers'),
      ]);
      setSummary(sumRes.data.data);
      setDeptReport(deptRes.data.data);
      setOfficerReport(offRes.data.data);
    } catch {
      toast.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  if (loading) return (
    <div>
      <div className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 280, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  const trend = summary?.complaintTrend?.slice(-30) || [];
  const statusData = (summary?.complaintsByStatus || []).map((s) => ({
    name: s._id?.replace('_', ' ')?.toUpperCase(),
    value: s.count,
  }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>Reports &amp; Analytics</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Comprehensive system performance overview</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input type="date" value={dateRange.startDate} onChange={(e) => setDateRange((p) => ({ ...p, startDate: e.target.value }))} style={dateInput} />
          <input type="date" value={dateRange.endDate} onChange={(e) => setDateRange((p) => ({ ...p, endDate: e.target.value }))} style={dateInput} />
          <button onClick={fetchReports} style={{ padding: '10px 18px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>Apply Filter</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {['summary', 'departments', 'officers'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: '8px 20px', borderRadius: 9, border: 'none', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: activeTab === tab ? '#000080' : 'transparent', color: activeTab === tab ? '#fff' : '#334155', textTransform: 'capitalize' }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'summary' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Complaints', value: summary?.overview?.totalComplaints || 0, icon: '📋', color: '#000080' },
              { label: 'Registered Citizens', value: summary?.overview?.totalUsers || 0, icon: '👥', color: '#7c3aed' },
              { label: 'Avg. Resolution', value: `${summary?.avgResolutionDays || 0} days`, icon: '⏱️', color: '#138808' },
              { label: 'Delivery Orders', value: summary?.overview?.totalDeliveries || 0, icon: '📦', color: '#FF9933' },
            ].map((k, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{k.icon}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', fontFamily: 'Poppins, sans-serif' }}>{k.value}</div>
                <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{k.label}</div>
                <div style={{ height: 3, borderRadius: 2, background: k.color, marginTop: 12 }} />
              </div>
            ))}
          </div>

          <div className="responsive-2col" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={chartCard}>
              <h3 style={chartTitle}>📈 Daily Complaint Trend (30 Days)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend.map((t) => ({ date: t._id?.slice(5), count: t.count }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a' }} />
                  <Line type="monotone" dataKey="count" stroke="#000080" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={chartCard}>
              <h3 style={chartTitle}>Status Distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" paddingAngle={3}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a' }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 4 }}>
                {statusData.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#475569', fontWeight: 600 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[i % COLORS.length] }} />
                    {s.name}: {s.value}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={chartCard}>
            <h3 style={chartTitle}>⚡ Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={(summary?.priorityBreakdown || []).map((p) => ({ name: p._id?.toUpperCase(), count: p.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a' }} />
                <Bar dataKey="count" fill="#FF9933" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {activeTab === 'departments' && (
        <div>
          <div style={{ ...chartCard, marginBottom: 20 }}>
            <h3 style={chartTitle}>🏢 Department-wise Performance</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptReport.slice(0, 10)} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 10 }} angle={-30} textAnchor="end" height={50} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#475569', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a' }} />
                <Bar dataKey="total" name="Total" fill="#000080" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#138808" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="Pending" fill="#FF9933" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Department', 'Total', 'Pending', 'In Progress', 'Resolved', 'Resolution Rate'].map((h) => (
                    <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#fff', textTransform: 'uppercase', background: '#000080' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deptReport.map((d, i) => {
                  const rate = d.total > 0 ? ((d.resolved / d.total) * 100).toFixed(1) : 0;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{d.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: 14, color: '#334155' }}>{d.total}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#b45309', fontWeight: 700 }}>{d.pending}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#1d4ed8', fontWeight: 700 }}>{d.inProgress}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: '#15803d', fontWeight: 700 }}>{d.resolved}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${rate}%`, height: '100%', background: rate > 70 ? '#138808' : rate > 40 ? '#FF9933' : '#dc2626', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#334155', fontWeight: 600, minWidth: 36 }}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'officers' && (
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Officer', 'Total Assigned', 'Resolved', 'Pending', 'Resolution Rate'].map((h) => (
                  <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#fff', textTransform: 'uppercase', background: '#000080' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {officerReport.map((o, i) => {
                const rate = o.totalAssigned > 0 ? ((o.resolved / o.totalAssigned) * 100).toFixed(1) : 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#138808', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>{o.name?.charAt(0)}</div>
                        <div>
                          <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{o.name}</div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>{o.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: '#334155' }}>{o.totalAssigned}</td>
                    <td style={{ padding: '14px 16px', color: '#15803d', fontWeight: 700 }}>{o.resolved}</td>
                    <td style={{ padding: '14px 16px', color: '#b45309', fontWeight: 700 }}>{o.pending}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${rate}%`, height: '100%', background: rate > 70 ? '#138808' : '#FF9933', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, color: '#334155', fontWeight: 600, minWidth: 36 }}>{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const dateInput = { padding: '9px 12px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 13 };
const chartCard = { background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };
const chartTitle = { fontSize: 16, fontWeight: 700, color: '#000080', marginBottom: 18, fontFamily: 'Poppins, sans-serif' };
