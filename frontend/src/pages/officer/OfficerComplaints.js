import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export function OfficerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', page: 1 });
  const [selected, setSelected] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', note: '' });

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit: 15 });
      const { data } = await api.get(`/complaints?${params}`);
      setComplaints(data.data);
      setPagination(data.pagination);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const handleStatus = async () => {
    try {
      await api.put(`/complaints/${selected._id}/status`, { status: statusForm.status, resolutionNote: statusForm.note });
      toast.success('Status updated!');
      setSelected(null);
      fetchComplaints();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const getStatusStyle = (status) => {
    const map = {
      pending: { bg: '#fef3c7', color: '#92400e' },
      assigned: { bg: '#e0e7ff', color: '#3730a3' },
      in_progress: { bg: '#dbeafe', color: '#1e40af' },
      resolved: { bg: '#dcfce7', color: '#166534' },
      closed: { bg: '#f1f5f9', color: '#475569' },
      rejected: { bg: '#fee2e2', color: '#991b1b' },
    };
    return map[status] || map.pending;
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>Department Complaints</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{pagination.total || 0} complaints in your department</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input type="text" placeholder="🔍 Search..." style={{ flex: 1, minWidth: 200, padding: '10px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 }} value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))} />
        <select style={selectStyle} value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">All Status</option>
          {['pending', 'assigned', 'in_progress', 'resolved', 'closed'].map((s) => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
        </select>
        <select style={selectStyle} value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value, page: 1 }))}>
          <option value="">All Priority</option>
          {['urgent', 'high', 'medium', 'low'].map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          [1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>📭</div>
            No complaints found
          </div>
        ) : complaints.map((c) => {
          const st = getStatusStyle(c.status);
          const isOverdue = new Date(c.dueDate) < new Date() && !['resolved', 'closed'].includes(c.status);
          return (
            <div key={c._id} style={{ background: '#fff', border: `1px solid ${isOverdue ? '#fca5a5' : '#cbd5e1'}`, borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, color: '#000080', fontFamily: 'monospace', fontWeight: 700 }}>{c.complaintNumber}</span>
                  {isOverdue && <span style={{ fontSize: 10, color: '#b91c1c', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#fee2e2' }}>OVERDUE</span>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: '#64748b' }}>{c.category} · Filed: {new Date(c.createdAt).toLocaleDateString('en-IN')}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: c.priority === 'urgent' ? '#fee2e2' : '#eff6ff', color: c.priority === 'urgent' ? '#b91c1c' : '#1e40af', textTransform: 'uppercase' }}>{c.priority}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, background: st.bg, color: st.color, textTransform: 'uppercase' }}>{c.status.replace('_', ' ')}</span>
                <button onClick={() => { setSelected(c); setStatusForm({ status: c.status, note: '' }); }} style={{ padding: '7px 14px', borderRadius: 8, background: '#000080', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Update
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 28, width: '100%', maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>Update Complaint</h3>
            <p style={{ fontSize: 13, color: '#475569', fontFamily: 'monospace', fontWeight: 700, marginBottom: 20 }}>{selected.complaintNumber}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', fontWeight: 700 }}>Status</label>
                <select value={statusForm.status} onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))} style={{ width: '100%', padding: 11, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 }}>
                  {['in_progress', 'resolved', 'rejected'].map((s) => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', fontWeight: 700 }}>Resolution Note</label>
                <textarea value={statusForm.note} onChange={(e) => setStatusForm((p) => ({ ...p, note: e.target.value }))} rows={3} placeholder="Describe the action taken..." style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, resize: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleStatus} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#138808', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Submit Update</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const selectStyle = { padding: '10px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 };

export default OfficerComplaints;
