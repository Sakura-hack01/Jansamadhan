import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Infrastructure', 'Public Services', 'Healthcare', 'Education',
  'Utilities', 'Transport', 'Environment', 'Law & Order',
  'Social Welfare', 'Agriculture', 'Revenue', 'Labour',
  'Housing', 'Finance', 'Other'
];

export default function FileComplaint() {
  const [form, setForm] = useState({
    title: '', description: '', category: '', priority: 'medium',
    department: '', location: { address: '', city: '', state: '', pincode: '' },
    tags: '', isAnonymous: false
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/departments').then(({ data }) => setDepartments(data.data)).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleLocationChange = (e) => {
    setForm((p) => ({ ...p, location: { ...p.location, [e.target.name]: e.target.value } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.category || !form.department) {
      toast.error('Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
      };
      const { data } = await api.post('/complaints', payload);
      toast.success(data.message || 'Complaint filed successfully!');
      navigate('/user/complaints');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to file complaint.');
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = 3;

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 6 }}>
          ✍️ File a Public Grievance
        </h1>
        <p style={{ fontSize: 14, color: '#475569' }}>
          Submit your grievance directly to the concerned department. You will receive a unique reference number.
        </p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28 }}>
        {['Complaint Details', 'Location & Priority', 'Review & Submit'].map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                background: step > i + 1 ? '#138808' : step === i + 1 ? '#000080' : '#e2e8f0',
                color: step >= i + 1 ? '#fff' : '#64748b', marginBottom: 6, transition: 'all 0.3s'
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <div style={{ fontSize: 12, color: step >= i + 1 ? '#000080' : '#64748b', fontWeight: step === i + 1 ? 700 : 500, textAlign: 'center' }}>{s}</div>
            </div>
            {i < totalSteps - 1 && (
              <div style={{ height: 3, flex: 0.5, background: step > i + 1 ? '#138808' : '#cbd5e1', margin: '0 4px', marginBottom: 22, borderRadius: 2 }} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div style={cardStyle}>
            <h3 style={sectionTitle}>Complaint Information</h3>
            <div className="responsive-2col" style={formGrid}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Complaint Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required placeholder="Brief title of your complaint" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Category *</label>
                <select name="category" value={form.category} onChange={handleChange} required style={inputStyle}>
                  <option value="">Select Category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Department *</label>
                <select name="department" value={form.department} onChange={handleChange} required style={inputStyle}>
                  <option value="">Select Department</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange} required placeholder="Describe your complaint in detail..." rows={5} style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }} />
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textAlign: 'right' }}>{form.description.length}/5000 characters</div>
              </div>
              <div>
                <label style={labelStyle}>Tags (comma-separated)</label>
                <input name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. road, pothole, water" style={inputStyle} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                <input type="checkbox" name="isAnonymous" id="anon" checked={form.isAnonymous} onChange={handleChange} style={{ width: 18, height: 18, accentColor: '#000080', cursor: 'pointer' }} />
                <label htmlFor="anon" style={{ fontSize: 13.5, color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                  File anonymously (hide identity)
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button
                type="button"
                onClick={() => {
                  if (!form.title || !form.description || !form.category || !form.department) {
                    toast.error('Please fill all required fields.');
                    return;
                  }
                  setStep(2);
                }}
                style={primaryBtn}
              >
                Next: Location &amp; Priority &rarr;
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={cardStyle}>
            <h3 style={sectionTitle}>Location &amp; Priority</h3>
            <div className="responsive-2col" style={formGrid}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Priority</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {['low', 'medium', 'high', 'urgent'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, priority: p }))}
                      style={{
                        flex: '1 1 110px', padding: '12px', borderRadius: 10,
                        border: `2px solid ${form.priority === p ? priorityColors[p] : '#cbd5e1'}`,
                        background: form.priority === p ? `${priorityColors[p]}15` : '#f8fafc',
                        color: form.priority === p ? priorityColors[p] : '#475569',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
                      }}
                    >
                      {priorityIcons[p]} {p}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Street Address</label>
                <input name="address" value={form.location.address} onChange={handleLocationChange} placeholder="Street / Area" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input name="city" value={form.location.city} onChange={handleLocationChange} placeholder="City" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input name="state" value={form.location.state} onChange={handleLocationChange} placeholder="State" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Pincode</label>
                <input name="pincode" value={form.location.pincode} onChange={handleLocationChange} placeholder="6-digit pincode" maxLength={6} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', marginTop: 24 }}>
              <button type="button" onClick={() => setStep(1)} style={secondaryBtn}>&larr; Back</button>
              <button type="button" onClick={() => setStep(3)} style={primaryBtn}>Next: Review &rarr;</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={cardStyle}>
            <h3 style={sectionTitle}>Review &amp; Submit</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                { label: 'Title', value: form.title },
                { label: 'Category', value: form.category },
                { label: 'Department', value: departments.find((d) => d._id === form.department)?.name || '—' },
                { label: 'Priority', value: form.priority.toUpperCase() },
                { label: 'Anonymous', value: form.isAnonymous ? 'Yes' : 'No' },
                { label: 'Location', value: [form.location.city, form.location.state, form.location.pincode].filter(Boolean).join(', ') || '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: '#475569', minWidth: 120, fontWeight: 700 }}>{label}:</span>
                  <span style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 500 }}>{value}</span>
                </div>
              ))}
              <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                <div style={{ fontSize: 13, color: '#475569', fontWeight: 700, marginBottom: 6 }}>Description:</div>
                <div style={{ fontSize: 13.5, color: '#0f172a', lineHeight: 1.6 }}>{form.description}</div>
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 14, marginBottom: 22 }}>
              <p style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6, margin: 0 }}>
                ℹ️ By submitting, you confirm that the details are accurate. A unique complaint reference number will be issued immediately.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setStep(2)} style={secondaryBtn}>&larr; Back</button>
              <button type="submit" disabled={loading} style={{ ...primaryBtn, flex: 1, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Submitting...' : 'Submit Grievance'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

const priorityColors = { low: '#138808', medium: '#000080', high: '#d97706', urgent: '#dc2626' };
const priorityIcons = { low: '🟢', medium: '🔵', high: '🟡', urgent: '🔴' };

const cardStyle = { background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 30, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' };
const sectionTitle = { fontSize: 19, fontWeight: 700, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 20 };
const formGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' };
const inputStyle = { width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
const primaryBtn = { padding: '12px 26px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,128,0.22)' };
const secondaryBtn = { padding: '12px 22px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: 14, fontWeight: 600, cursor: 'pointer' };
