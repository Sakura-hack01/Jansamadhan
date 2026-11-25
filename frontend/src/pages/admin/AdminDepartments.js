import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', email: '', phone: '', category: 'central', resolutionDays: 30, description: '' });

  const fetchDepts = async () => {
    setLoading(true);
    try { const { data } = await api.get('/departments'); setDepartments(data.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDepts(); }, []);

  const handleSeed = async () => {
    try { await api.post('/departments/seed'); toast.success('Departments seeded!'); fetchDepts(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modal === 'create') { await api.post('/departments', form); toast.success('Department created!'); }
      else { await api.put(`/departments/${modal._id}`, form); toast.success('Updated!'); }
      setModal(null); fetchDepts();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this department?')) return;
    try { await api.delete(`/departments/${id}`); toast.success('Deleted.'); fetchDepts(); }
    catch { toast.error('Failed.'); }
  };

  const categoryColors = { central: '#000080', state: '#138808', local: '#d97706', other: '#7c3aed' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>Departments</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{departments.length} departments configured</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleSeed} style={{ padding: '10px 18px', borderRadius: 10, background: '#fff', border: '1px solid #cbd5e1', color: '#334155', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            🌱 Seed Defaults
          </button>
          <button onClick={() => { setForm({ name: '', code: '', email: '', phone: '', category: 'central', resolutionDays: 30, description: '' }); setModal('create'); }} style={{ padding: '10px 18px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
            + Add Department
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {loading ? [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />) :
          departments.map((dept) => (
            <div key={dept._id} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, padding: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: dept.color || '#000080', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏢</div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#0f172a' }}>{dept.name}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b', fontFamily: 'monospace' }}>{dept.code}</div>
                  </div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: `${categoryColors[dept.category]}15`, color: categoryColors[dept.category] || '#000080', textTransform: 'uppercase' }}>
                  {dept.category}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 4 }}>📧 {dept.email}</div>
              <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 12 }}>⏱️ SLA: {dept.resolutionDays} days</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setForm({ name: dept.name, code: dept.code, email: dept.email, phone: dept.phone || '', category: dept.category, resolutionDays: dept.resolutionDays, description: dept.description || '' }); setModal(dept); }} style={{ padding: '6px 14px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#000080', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                <button onClick={() => handleDelete(dept._id)} style={{ padding: '6px 14px', borderRadius: 8, background: '#fee2e2', border: 'none', color: '#b91c1c', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))
        }
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setModal(null)}>
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 20 }}>
              {modal === 'create' ? 'Add Department' : 'Edit Department'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Department Name *', key: 'name', type: 'text', placeholder: 'e.g. Ministry of Health' },
                { label: 'Department Code *', key: 'code', type: 'text', placeholder: 'e.g. MOH' },
                { label: 'Official Email *', key: 'email', type: 'email', placeholder: 'dept@gov.in' },
                { label: 'Phone', key: 'phone', type: 'tel', placeholder: 'Contact number' },
                { label: 'SLA Days', key: 'resolutionDays', type: 'number', placeholder: '30' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', fontWeight: 700 }}>{label}</label>
                  <input type={type} required={label.includes('*')} value={form[key]} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', fontWeight: 700 }}>Category</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} style={{ width: '100%', padding: 11, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 }}>
                  <option value="central">Central Government</option>
                  <option value="state">State Government</option>
                  <option value="local">Local Body</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                <button type="button" onClick={() => setModal(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {modal === 'create' ? 'Create' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
