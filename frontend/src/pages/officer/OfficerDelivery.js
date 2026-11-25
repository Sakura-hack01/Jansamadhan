import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function OfficerDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', trackingId: '', description: '' });
  const [filters, setFilters] = useState({ status: '', page: 1 });

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit: 15 });
      const { data } = await api.get(`/delivery?${params}`);
      setDeliveries(data.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const handleUpdate = async () => {
    try {
      await api.put(`/delivery/${selected._id}/status`, updateForm);
      toast.success('Delivery updated!');
      setSelected(null);
      fetchDeliveries();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  const statusColors = {
    requested: '#d97706', processing: '#7c3aed', approved: '#138808',
    dispatched: '#000080', out_for_delivery: '#ea580c', delivered: '#138808',
    failed: '#dc2626', cancelled: '#64748b',
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>Deliveries</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Manage delivery requests in your department</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select style={{ padding: '10px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 }} value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">All Status</option>
          {['requested', 'processing', 'approved', 'dispatched', 'out_for_delivery', 'delivered', 'failed', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? [1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />) :
          deliveries.map((d) => (
            <div key={d._id} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 14, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, color: '#000080', fontFamily: 'monospace', fontWeight: 700 }}>{d.orderNumber}</span>
                  <span style={{ fontSize: 11.5, color: '#64748b', textTransform: 'capitalize' }}>{d.serviceType?.replace(/_/g, ' ')}</span>
                </div>
                <div style={{ fontSize: 14.5, color: '#0f172a', fontWeight: 600, marginBottom: 4 }}>
                  {d.user?.name} · {d.deliveryAddress?.city}, {d.deliveryAddress?.state}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  {new Date(d.createdAt).toLocaleDateString('en-IN')}
                  {d.priority === 'urgent' && <span style={{ marginLeft: 8, color: '#b91c1c', fontWeight: 700 }}>🔴 URGENT</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, background: `${statusColors[d.status]}18`, color: statusColors[d.status] || '#475569', textTransform: 'uppercase' }}>
                  {d.status?.replace(/_/g, ' ')}
                </span>
                {!['delivered', 'cancelled'].includes(d.status) && (
                  <button onClick={() => { setSelected(d); setUpdateForm({ status: d.status, trackingId: d.trackingId || '', description: '' }); }} style={{ padding: '7px 14px', borderRadius: 8, background: '#000080', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Update
                  </button>
                )}
              </div>
            </div>
          ))
        }
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelected(null)}>
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 28, width: '100%', maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 20 }}>Update Delivery</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', fontWeight: 700 }}>Status</label>
                <select value={updateForm.status} onChange={(e) => setUpdateForm((p) => ({ ...p, status: e.target.value }))} style={{ width: '100%', padding: 11, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 }}>
                  {['requested', 'processing', 'approved', 'dispatched', 'out_for_delivery', 'delivered', 'failed', 'cancelled'].map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', fontWeight: 700 }}>Tracking ID</label>
                <input value={updateForm.trackingId} onChange={(e) => setUpdateForm((p) => ({ ...p, trackingId: e.target.value }))} placeholder="Tracking number" style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', fontWeight: 700 }}>Update Note</label>
                <textarea value={updateForm.description} onChange={(e) => setUpdateForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Optional note..." style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, resize: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleUpdate} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#138808', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Update</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
