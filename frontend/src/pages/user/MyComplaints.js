import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

export function MyComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ status: '', priority: '', page: 1 });

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit: 10 });
      const { data } = await api.get(`/complaints?${params}`);
      setComplaints(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const getStatusStyle = (status) => {
    const map = {
      pending: { bg: '#fef3c7', color: '#92400e', border: '#fde68a' },
      assigned: { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' },
      in_progress: { bg: '#dbeafe', color: '#1e40af', border: '#bfdbfe' },
      resolved: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
      closed: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
      rejected: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
    };
    return map[status] || map.pending;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>My Complaints</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{pagination.total || 0} complaints filed</p>
        </div>
        <Link to="/user/file-complaint" style={{ padding: '11px 22px', borderRadius: 10, background: '#000080', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
          + File New Grievance
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select style={selectStyle} value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">All Status</option>
          {['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
          ))}
        </select>
        <select style={selectStyle} value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value, page: 1 }))}>
          <option value="">All Priority</option>
          {['urgent', 'high', 'medium', 'low'].map((p) => (
            <option key={p} value={p}>{p.toUpperCase()}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 105, borderRadius: 14 }} />)
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '1px solid #cbd5e1' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>📭</div>
            <p style={{ fontSize: 16, color: '#475569', marginBottom: 16 }}>No complaints found</p>
            <Link to="/user/file-complaint" style={{ padding: '11px 22px', borderRadius: 10, background: '#000080', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              File Your First Complaint
            </Link>
          </div>
        ) : complaints.map((c) => {
          const st = getStatusStyle(c.status);
          const daysAgo = Math.floor((new Date() - new Date(c.createdAt)) / 86400000);
          const isOverdue = new Date(c.dueDate) < new Date() && !['resolved', 'closed'].includes(c.status);
          return (
            <Link key={c._id} to={`/user/complaints/${c._id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#fff', border: `1px solid ${isOverdue ? '#fca5a5' : '#cbd5e1'}`, borderRadius: 14, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, color: '#000080', fontFamily: 'monospace', fontWeight: 700 }}>{c.complaintNumber}</span>
                      {isOverdue && <span style={{ fontSize: 10, color: '#b91c1c', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#fee2e2' }}>OVERDUE</span>}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{c.title}</h3>
                    <div style={{ fontSize: 12.5, color: '#64748b' }}>
                      {c.department?.name} · {c.category} · {daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: c.priority === 'urgent' ? '#fee2e2' : '#eff6ff', color: c.priority === 'urgent' ? '#b91c1c' : '#1e40af', textTransform: 'uppercase' }}>{c.priority}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, background: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: 'uppercase' }}>{c.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: st.color, borderRadius: 3, width: ['resolved', 'closed'].includes(c.status) ? '100%' : c.status === 'in_progress' ? '60%' : c.status === 'assigned' ? '30%' : '12%' }} />
                  </div>
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>Due: {c.dueDate ? new Date(c.dueDate).toLocaleDateString('en-IN') : 'N/A'}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setFilters((f) => ({ ...f, page: p }))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #cbd5e1', background: filters.page === p ? '#000080' : '#fff', color: filters.page === p ? '#fff' : '#334155', fontWeight: 700, cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

const selectStyle = { padding: '10px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, fontWeight: 500 };

export default MyComplaints;
