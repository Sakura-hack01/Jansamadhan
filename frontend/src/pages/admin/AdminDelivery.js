import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['requested', 'processing', 'approved', 'dispatched', 'out_for_delivery', 'delivered'];

const statusColors = {
  requested: { bg: '#fef3c7', color: '#92400e' },
  processing: { bg: '#f3e8ff', color: '#6b21a8' },
  approved: { bg: '#dcfce7', color: '#166534' },
  dispatched: { bg: '#dbeafe', color: '#1e40af' },
  out_for_delivery: { bg: '#ffedd5', color: '#9a3412' },
  delivered: { bg: '#dcfce7', color: '#166534' },
  failed: { bg: '#fee2e2', color: '#991b1b' },
  cancelled: { bg: '#f1f5f9', color: '#475569' },
};

export default function AdminDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', serviceType: '', page: 1 });
  const [updateModal, setUpdateModal] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', trackingId: '', description: '' });

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, limit: 15 });
      const { data } = await api.get(`/delivery?${params}`);
      setDeliveries(data.data);
    } catch {
      toast.error('Failed.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const handleUpdate = async () => {
    try {
      await api.put(`/delivery/${updateModal._id}/status`, updateForm);
      toast.success('Delivery status updated!');
      setUpdateModal(null);
      fetchDeliveries();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed.'); }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>Delivery Management</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Manage government delivery requests</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select style={selectStyle} value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">All Status</option>
          {STATUS_FLOW.concat(['failed', 'cancelled']).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
        </select>
        <select style={selectStyle} value={filters.serviceType} onChange={(e) => setFilters((p) => ({ ...p, serviceType: e.target.value, page: 1 }))}>
          <option value="">All Types</option>
          {['documents', 'certificates', 'ration', 'medicines', 'seeds_fertilizers', 'pension', 'scholarship', 'equipment', 'other'].map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ').toUpperCase()}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, overflowX: 'auto', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Order #', 'Citizen', 'Service Type', 'Address', 'Priority', 'Status', 'Date', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '13px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#fff', textTransform: 'uppercase', background: '#000080' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : deliveries.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>📦 No delivery orders found</td></tr>
            ) : deliveries.map((d) => {
              const sc = statusColors[d.status] || statusColors.requested;
              return (
                <tr key={d._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '13px 16px' }}><span style={{ fontSize: 12, color: '#000080', fontFamily: 'monospace', fontWeight: 700 }}>{d.orderNumber}</span></td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{d.user?.name}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>{d.user?.phone || d.user?.email}</div>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12.5, color: '#334155', textTransform: 'capitalize' }}>{d.serviceType?.replace(/_/g, ' ')}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12.5, color: '#475569', maxWidth: 180 }}>{d.deliveryAddress?.city}, {d.deliveryAddress?.state} - {d.deliveryAddress?.pincode}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: d.priority === 'urgent' ? '#fee2e2' : '#eff6ff', color: d.priority === 'urgent' ? '#b91c1c' : '#1e40af', textTransform: 'uppercase' }}>{d.priority}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: sc.bg, color: sc.color, textTransform: 'uppercase' }}>{d.status?.replace(/_/g, ' ')}</span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: '#64748b' }}>{new Date(d.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <button onClick={() => { setUpdateModal(d); setUpdateForm({ status: d.status, trackingId: d.trackingId || '', description: '' }); }} style={{ padding: '6px 14px', borderRadius: 8, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#000080', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Update</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {updateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setUpdateModal(null)}>
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 28, width: '100%', maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 6 }}>Update Delivery</h3>
            <p style={{ fontSize: 13, color: '#475569', marginBottom: 20, fontFamily: 'monospace', fontWeight: 700 }}>{updateModal.orderNumber}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', fontWeight: 700 }}>Status</label>
                <select value={updateForm.status} onChange={(e) => setUpdateForm((p) => ({ ...p, status: e.target.value }))} style={{ width: '100%', padding: 11, background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 }}>
                  {STATUS_FLOW.concat(['failed', 'cancelled']).map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', fontWeight: 700 }}>Tracking ID</label>
                <input value={updateForm.trackingId} onChange={(e) => setUpdateForm((p) => ({ ...p, trackingId: e.target.value }))} placeholder="e.g. IND123456789" style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#475569', display: 'block', marginBottom: 5, textTransform: 'uppercase', fontWeight: 700 }}>Note</label>
                <textarea value={updateForm.description} onChange={(e) => setUpdateForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Optional update note..." style={{ width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, resize: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setUpdateModal(null)} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleUpdate} style={{ flex: 1, padding: '11px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Update</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const selectStyle = { padding: '10px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14 };
