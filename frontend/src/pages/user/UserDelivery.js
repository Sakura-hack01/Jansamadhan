import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const SERVICE_TYPES = [
  { value: 'documents', label: '📄 Government Documents', desc: 'Certificates, licenses, permits' },
  { value: 'certificates', label: '🏅 Official Certificates', desc: 'Birth, death, caste certificates' },
  { value: 'ration', label: '🌾 PDS / Ration', desc: 'Public distribution system goods' },
  { value: 'medicines', label: '💊 Government Medicines', desc: 'AYUSH, Jan Aushadhi medicines' },
  { value: 'seeds_fertilizers', label: '🌱 Seeds & Fertilizers', desc: 'Agricultural supplies' },
  { value: 'pension', label: '👴 Pension Documents', desc: 'Pension related papers' },
  { value: 'scholarship', label: '🎓 Scholarship', desc: 'Scholarship disbursement docs' },
  { value: 'equipment', label: '⚙️ Equipment', desc: 'Government issued equipment' },
  { value: 'other', label: '📦 Other Services', desc: 'Any other government service' },
];

export default function UserDelivery() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    serviceType: '', department: '', priority: 'normal', specialInstructions: '',
    deliveryAddress: { name: '', phone: '', street: '', city: '', state: '', pincode: '', landmark: '' },
    items: [{ name: '', quantity: 1, price: 0 }],
  });

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/delivery?limit=20');
      setDeliveries(data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    api.get('/departments').then(({ data }) => setDepartments(data.data)).catch(() => {});
  }, []);

  const handleAddrChange = (e) => setForm((p) => ({ ...p, deliveryAddress: { ...p.deliveryAddress, [e.target.name]: e.target.value } }));
  const handleItemChange = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm((p) => ({ ...p, items }));
  };
  const addItem = () => setForm((p) => ({ ...p, items: [...p.items, { name: '', quantity: 1, price: 0 }] }));
  const removeItem = (i) => setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.serviceType || !form.department) return toast.error('Please fill all required fields.');
    if (!form.deliveryAddress.street || !form.deliveryAddress.city || !form.deliveryAddress.pincode) {
      return toast.error('Please complete the delivery address.');
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/delivery', form);
      toast.success(data.message || 'Delivery request submitted!');
      setShowForm(false);
      fetchDeliveries();
      setForm({
        serviceType: '', department: '', priority: 'normal', specialInstructions: '',
        deliveryAddress: { name: '', phone: '', street: '', city: '', state: '', pincode: '', landmark: '' },
        items: [{ name: '', quantity: 1, price: 0 }],
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors = {
    requested: '#d97706', processing: '#7c3aed', approved: '#138808',
    dispatched: '#000080', out_for_delivery: '#ea580c', delivered: '#138808',
    failed: '#dc2626', cancelled: '#64748b'
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>📦 Government Document Delivery</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Request official certificates and services delivered to your doorstep</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '11px 22px', borderRadius: 10,
            background: showForm ? '#f1f5f9' : '#000080',
            border: showForm ? '1px solid #cbd5e1' : 'none',
            color: showForm ? '#334155' : '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer'
          }}
        >
          {showForm ? '✕ Cancel' : '+ New Delivery Request'}
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 28, marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: 19, fontWeight: 700, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 20 }}>New Delivery Request</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={labelStyle}>Service Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                {SERVICE_TYPES.map((s) => (
                  <div
                    key={s.value}
                    onClick={() => setForm((p) => ({ ...p, serviceType: s.value }))}
                    style={{
                      padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                      border: `2px solid ${form.serviceType === s.value ? '#000080' : '#e2e8f0'}`,
                      background: form.serviceType === s.value ? '#eff6ff' : '#f8fafc',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: form.serviceType === s.value ? '#000080' : '#0f172a', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: '#64748b' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="responsive-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Department *</label>
                <select value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} style={inputStyle} required>
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))} style={inputStyle}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Items / Documents</label>
              {form.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <input placeholder="Item / document name" value={item.name} onChange={(e) => handleItemChange(i, 'name', e.target.value)} style={{ ...inputStyle, flex: 2 }} />
                  <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => handleItemChange(i, 'quantity', Number(e.target.value))} style={{ ...inputStyle, width: 85 }} min={1} />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} style={{ padding: '0 12px', borderRadius: 8, background: '#fee2e2', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItem} style={{ fontSize: 13, color: '#000080', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }}>+ Add Item</button>
            </div>

            <div>
              <label style={labelStyle}>Delivery Address *</label>
              <div className="responsive-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <input name="name" placeholder="Recipient Name" value={form.deliveryAddress.name} onChange={handleAddrChange} style={inputStyle} />
                <input name="phone" placeholder="Phone Number" value={form.deliveryAddress.phone} onChange={handleAddrChange} style={inputStyle} />
                <input name="street" placeholder="Street Address *" value={form.deliveryAddress.street} onChange={handleAddrChange} style={{ ...inputStyle, gridColumn: '1 / -1' }} required />
                <input name="city" placeholder="City *" value={form.deliveryAddress.city} onChange={handleAddrChange} style={inputStyle} required />
                <input name="state" placeholder="State *" value={form.deliveryAddress.state} onChange={handleAddrChange} style={inputStyle} required />
                <input name="pincode" placeholder="Pincode *" value={form.deliveryAddress.pincode} onChange={handleAddrChange} style={inputStyle} maxLength={6} required />
                <input name="landmark" placeholder="Landmark" value={form.deliveryAddress.landmark} onChange={handleAddrChange} style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Special Instructions</label>
              <textarea name="specialInstructions" value={form.specialInstructions} onChange={(e) => setForm((p) => ({ ...p, specialInstructions: e.target.value }))} rows={2} placeholder="Any special delivery instructions..." style={{ ...inputStyle, resize: 'none' }} />
            </div>

            <button type="submit" disabled={submitting} style={{ padding: '13px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {submitting ? 'Submitting...' : 'Submit Delivery Request'}
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? [1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 14 }} />) :
          deliveries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, color: '#64748b' }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>📦</div>
              <p style={{ fontSize: 15, marginBottom: 16 }}>No delivery requests yet</p>
              <button onClick={() => setShowForm(true)} style={{ padding: '11px 22px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Request Your First Delivery</button>
            </div>
          ) : deliveries.map((d) => (
            <div key={d._id} style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 14, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, color: '#000080', fontFamily: 'monospace', fontWeight: 700 }}>{d.orderNumber}</span>
                    {d.priority === 'urgent' && <span style={{ fontSize: 10, color: '#b91c1c', fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: '#fee2e2' }}>URGENT</span>}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                    {SERVICE_TYPES.find((s) => s.value === d.serviceType)?.label || d.serviceType}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748b' }}>
                    📍 {d.deliveryAddress?.city}, {d.deliveryAddress?.state} · {new Date(d.createdAt).toLocaleDateString('en-IN')}
                  </div>
                  {d.trackingId && <div style={{ fontSize: 12, color: '#334155', marginTop: 2 }}>Tracking: <strong>{d.trackingId}</strong></div>}
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, background: `${statusColors[d.status]}18`, color: statusColors[d.status] || '#475569', textTransform: 'uppercase' }}>
                  {d.status?.replace(/_/g, ' ')}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
                {['requested', 'processing', 'approved', 'dispatched', 'out_for_delivery', 'delivered'].map((step, i) => {
                  const stepIndex = ['requested', 'processing', 'approved', 'dispatched', 'out_for_delivery', 'delivered'].indexOf(d.status);
                  const done = i <= stepIndex;
                  return (
                    <div key={step} style={{ flex: 1, height: 4, borderRadius: 2, background: done ? statusColors[d.status] || '#000080' : '#e2e8f0' }} />
                  );
                })}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' };
const inputStyle = { width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
