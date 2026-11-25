import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ status: '', category: '', priority: '', search: '', page: 1 });
  const [assignModal, setAssignModal] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [statusModal, setStatusModal] = useState(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit: 15 });
      const { data } = await api.get(`/complaints?${params}`);
      setComplaints(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const fetchOfficers = async (deptId) => {
    try {
      const { data } = await api.get(`/users/officers/${deptId}`);
      setOfficers(data.data);
    } catch {}
  };

  const handleAssign = async (officerId) => {
    try {
      await api.put(`/complaints/${assignModal._id}/assign`, { officerId });
      toast.success('Complaint assigned successfully!');
      setAssignModal(null);
      fetchComplaints();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign.'); }
  };

  const handleStatusUpdate = async (status, note) => {
    try {
      await api.put(`/complaints/${statusModal._id}/status`, { status, resolutionNote: note });
      toast.success('Status updated!');
      setStatusModal(null);
      fetchComplaints();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this complaint permanently?')) return;
    try {
      await api.delete(`/complaints/${id}`);
      toast.success('Complaint deleted.');
      fetchComplaints();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

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
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>All Complaints</h1>
          <p style={styles.subtitle}>{pagination.total || 0} total complaints across all departments</p>
        </div>
      </div>

      <div style={styles.filtersBar}>
        <input
          type="text"
          placeholder="🔍 Search by number, title..."
          style={styles.searchInput}
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
        />
        <select style={styles.select} value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">All Status</option>
          {['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'].map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
          ))}
        </select>
        <select style={styles.select} value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value, page: 1 }))}>
          <option value="">All Priority</option>
          {['urgent', 'high', 'medium', 'low'].map((p) => (
            <option key={p} value={p}>{p.toUpperCase()}</option>
          ))}
        </select>
        <button onClick={() => setFilters({ status: '', category: '', priority: '', search: '', page: 1 })} style={styles.clearBtn}>Clear</button>
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              {['Complaint #', 'Title', 'Complainant', 'Department', 'Priority', 'Status', 'Date', 'Actions'].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : complaints.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>📭 No complaints found</td></tr>
            ) : complaints.map((c) => {
              const st = getStatusStyle(c.status);
              return (
                <tr key={c._id}>
                  <td style={styles.td}><span style={{ fontSize: 12, color: '#000080', fontFamily: 'monospace', fontWeight: 700 }}>{c.complaintNumber}</span></td>
                  <td style={styles.td}>
                    <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>{c.category}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>{c.complainant?.name || 'N/A'}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>{c.complainant?.email || ''}</div>
                  </td>
                  <td style={styles.td}><span style={{ fontSize: 12.5, color: '#475569' }}>{c.department?.name || 'N/A'}</span></td>
                  <td style={styles.td}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', background: c.priority === 'urgent' ? '#fee2e2' : c.priority === 'high' ? '#fef3c7' : '#eff6ff', color: c.priority === 'urgent' ? '#b91c1c' : c.priority === 'high' ? '#92400e' : '#1e40af' }}>
                      {c.priority}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: 'uppercase' }}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={styles.td}><span style={{ fontSize: 12, color: '#64748b' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</span></td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setAssignModal(c); fetchOfficers(c.department?._id); }} style={styles.actionBtn} title="Assign Officer">👔</button>
                      <button onClick={() => setStatusModal(c)} style={styles.actionBtn} title="Update Status">✏️</button>
                      <button onClick={() => handleDelete(c._id)} style={{ ...styles.actionBtn, background: '#fee2e2', color: '#dc2626' }} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setFilters((f) => ({ ...f, page: p }))} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #cbd5e1', background: filters.page === p ? '#000080' : '#fff', color: filters.page === p ? '#fff' : '#334155', fontWeight: 700, cursor: 'pointer' }}>{p}</button>
          ))}
        </div>
      )}

      {assignModal && (
        <div style={modalStyles.overlay} onClick={() => setAssignModal(null)}>
          <div style={modalStyles.box} onClick={(e) => e.stopPropagation()}>
            <h3 style={modalStyles.title}>Assign Officer</h3>
            <p style={{ color: '#475569', marginBottom: 16, fontSize: 14 }}>
              Complaint: <strong style={{ color: '#000080' }}>{assignModal.complaintNumber}</strong>
            </p>
            {officers.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: 20 }}>No officers available in this department.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                {officers.map((o) => (
                  <div key={o._id} onClick={() => handleAssign(o._id)} style={modalStyles.officerItem}>
                    <div style={modalStyles.officerAvatar}>{o.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{o.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{o.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setAssignModal(null)} style={{ ...modalStyles.cancelBtn, width: '100%' }}>Cancel</button>
          </div>
        </div>
      )}

      {statusModal && <StatusUpdateModal complaint={statusModal} onClose={() => setStatusModal(null)} onUpdate={handleStatusUpdate} />}
    </div>
  );
}

function StatusUpdateModal({ complaint, onClose, onUpdate }) {
  const [status, setStatus] = useState(complaint.status);
  const [note, setNote] = useState('');

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.box} onClick={(e) => e.stopPropagation()}>
        <h3 style={modalStyles.title}>Update Status</h3>
        <p style={{ color: '#000080', marginBottom: 20, fontSize: 13.5, fontFamily: 'monospace', fontWeight: 700 }}>{complaint.complaintNumber}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', fontWeight: 700 }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', padding: 11, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 }}>
              {['pending', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'].map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', fontWeight: 700 }}>Resolution Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Add a note (optional)..." style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, resize: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{ ...modalStyles.cancelBtn, marginTop: 0 }}>Cancel</button>
            <button onClick={() => onUpdate(status, note)} style={modalStyles.confirmBtn}>Update Status</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 26, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  filtersBar: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  searchInput: { flex: 1, minWidth: 220, padding: '10px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 },
  select: { padding: '10px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 },
  clearBtn: { padding: '10px 16px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  tableWrap: { background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, overflowX: 'auto', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '13px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#000080' },
  td: { padding: '13px 16px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'middle' },
  actionBtn: { width: 30, height: 30, borderRadius: 7, background: '#f1f5f9', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  box: { background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' },
  title: { fontSize: 20, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 6 },
  officerItem: { display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, cursor: 'pointer', background: '#f8fafc', border: '1px solid #cbd5e1' },
  officerAvatar: { width: 36, height: 36, borderRadius: '50%', background: '#000080', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 },
  cancelBtn: { flex: 1, padding: '11px 20px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 16 },
  confirmBtn: { flex: 1, padding: '11px 20px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
};
