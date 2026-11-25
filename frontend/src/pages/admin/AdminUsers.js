import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ role: '', search: '', page: 1 });
  const [editModal, setEditModal] = useState(null);
  const [departments, setDepartments] = useState([]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit: 20 });
      const { data } = await api.get(`/users?${params}`);
      setUsers(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data.data)).catch(() => {});
  }, []);

  const handleUpdateUser = async () => {
    try {
      await api.put(`/users/${editModal._id}`, {
        role: editModal.role,
        department: editModal.department,
        isActive: editModal.isActive,
      });
      toast.success('User updated!');
      setEditModal(null);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleToggleActive = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { isActive: !user.isActive });
      toast.success(`User ${!user.isActive ? 'activated' : 'deactivated'}.`);
      fetchUsers();
    } catch { toast.error('Failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted.');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const roleColors = { admin: '#7c3aed', officer: '#059669', user: '#000080' };
  const roleBg = { admin: '#f3e8ff', officer: '#dcfce7', user: '#eff6ff' };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>User Management</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{pagination.total || 0} registered users</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Search name or email..."
          style={{ flex: 1, minWidth: 220, padding: '10px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 }}
          value={filters.search}
          onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value, page: 1 }))}
        />
        <select
          style={{ padding: '10px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 }}
          value={filters.role}
          onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value, page: 1 }))}
        >
          <option value="">All Roles</option>
          <option value="user">Citizens</option>
          <option value="officer">Officers</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, overflowX: 'auto', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['User', 'Email', 'Role', 'Department', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#000080' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : users.map((u) => (
              <tr key={u._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: roleColors[u.role] || '#000080', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{u.name}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>{u.phone || 'No phone'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: '#334155' }}>{u.email}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: roleBg[u.role], color: roleColors[u.role], textTransform: 'uppercase' }}>{u.role}</span>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569' }}>{u.department?.name || '—'}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: u.isActive ? '#dcfce7' : '#fee2e2', color: u.isActive ? '#15803d' : '#b91c1c' }}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '13px 16px', fontSize: 12, color: '#64748b' }}>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setEditModal({ ...u })} style={{ width: 30, height: 30, borderRadius: 7, background: '#eff6ff', border: '1px solid #bfdbfe', cursor: 'pointer', fontSize: 13 }} title="Edit">✏️</button>
                    <button onClick={() => handleToggleActive(u)} style={{ width: 30, height: 30, borderRadius: 7, background: u.isActive ? '#fee2e2' : '#dcfce7', border: 'none', cursor: 'pointer', fontSize: 13 }} title={u.isActive ? 'Deactivate' : 'Activate'}>
                      {u.isActive ? '🚫' : '✅'}
                    </button>
                    {u.role !== 'admin' && (
                      <button onClick={() => handleDelete(u._id)} style={{ width: 30, height: 30, borderRadius: 7, background: '#fee2e2', border: 'none', cursor: 'pointer', fontSize: 13 }}>🗑️</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
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

      {editModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setEditModal(null)}>
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 28, width: '100%', maxWidth: 440, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 20 }}>Edit User</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', fontWeight: 700 }}>Role</label>
                <select value={editModal.role} onChange={(e) => setEditModal((p) => ({ ...p, role: e.target.value }))} style={{ width: '100%', padding: 11, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 }}>
                  <option value="user">Citizen</option>
                  <option value="officer">Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {editModal.role === 'officer' && (
                <div>
                  <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', fontWeight: 700 }}>Department</label>
                  <select value={editModal.department?._id || editModal.department || ''} onChange={(e) => setEditModal((p) => ({ ...p, department: e.target.value }))} style={{ width: '100%', padding: 11, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 }}>
                    <option value="">Select Department</option>
                    {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>Active Status</label>
                <button
                  type="button"
                  onClick={() => setEditModal((p) => ({ ...p, isActive: !p.isActive }))}
                  style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: editModal.isActive ? '#138808' : '#cbd5e1', position: 'relative' }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: editModal.isActive ? 23 : 3, transition: 'all 0.2s' }} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 700, color: editModal.isActive ? '#15803d' : '#b91c1c' }}>{editModal.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button onClick={() => setEditModal(null)} style={{ flex: 1, padding: '11px 20px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleUpdateUser} style={{ flex: 1, padding: '11px 20px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
