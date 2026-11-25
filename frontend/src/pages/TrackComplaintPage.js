import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { FiSearch, FiArrowLeft } from 'react-icons/fi';

export default function TrackComplaintPage() {
  const { complaintNumber } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState(complaintNumber || '');
  const [searchValue, setSearchValue] = useState(complaintNumber || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchValue) { search(searchValue); }
    else { setLoading(false); }
  }, [searchValue]);

  const search = async (number) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/complaints/track/${encodeURIComponent(number)}`);
      setComplaint(data.data);
    } catch {
      setComplaint(null);
      setError('Complaint not found. Please check your Registration Number.');
    } finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (input.trim()) setSearchValue(input.trim());
  };

  const progressSteps = [
    { status: 'pending', label: 'Filed', icon: '📝' },
    { status: 'assigned', label: 'Assigned', icon: '👔' },
    { status: 'in_progress', label: 'In Progress', icon: '🔄' },
    { status: 'resolved', label: 'Resolved', icon: '✅' },
  ];

  const getStatusIndex = (status) => {
    const map = { pending: 0, assigned: 1, in_progress: 2, resolved: 3, closed: 3, rejected: -1 };
    return map[status] ?? 0;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '56px 20px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <div className="tricolor-bar" style={{ position: 'fixed', top: 0, left: 0, right: 0 }} />
      <Link to="/" style={{ position: 'fixed', top: 20, left: 24, display: 'inline-flex', alignItems: 'center', gap: 8, color: '#000080', background: '#fff', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
        <FiArrowLeft size={16} /> Home
      </Link>

      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, textDecoration: 'none' }}>
        <img src="/emblem.png" alt="National Emblem" style={{ height: 52, width: 52, objectFit: 'contain' }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#000080', fontFamily: 'Poppins, sans-serif', lineHeight: 1.1 }}>JanSamadhan</div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Government of India · Grievance Tracker</div>
        </div>
      </Link>

      <div style={{ width: '100%', maxWidth: 680 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 6 }}>
            Track Your Grievance
          </h1>
          <p style={{ color: '#475569', fontSize: 14 }}>Enter your complaint reference number to check live redressal status</p>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <FiSearch size={18} style={{ position: 'absolute', left: 16, color: '#64748b' }} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="e.g. JANSR/2026/00001"
              style={{ width: '100%', padding: '14px 16px 14px 44px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 12, color: '#0f172a', fontSize: 15, fontFamily: 'monospace', letterSpacing: '0.8px', outline: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            />
          </div>
          <button type="submit" style={{ padding: '14px 28px', borderRadius: 12, background: '#000080', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,128,0.25)' }}>
            Track
          </button>
        </form>

        {loading && searchValue && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner" style={{ margin: '0 auto', width: 36, height: 36 }} />
          </div>
        )}

        {error && !loading && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <p style={{ color: '#b91c1c', fontSize: 14.5, fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {complaint && !loading && (
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 20, padding: 28, boxShadow: '0 12px 30px rgba(0,0,50,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12.5, color: '#000080', fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>{complaint.complaintNumber}</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>{complaint.title}</h2>
                <p style={{ fontSize: 13, color: '#64748b' }}>{complaint.category} · {complaint.department?.name}</p>
              </div>
              <span className={`badge badge-${complaint.status}`}>
                {complaint.status.replace('_', ' ')}
              </span>
            </div>

            {complaint.status !== 'rejected' && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  {progressSteps.map((step, i) => {
                    const current = getStatusIndex(complaint.status);
                    const done = i <= current;
                    return (
                      <div key={step.status} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ width: 38, height: 38, borderRadius: '50%', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: done ? '#000080' : '#f1f5f9', color: done ? '#fff' : '#64748b', border: done ? 'none' : '1px solid #cbd5e1' }}>
                          {done ? (i === current ? step.icon : '✓') : step.icon}
                        </div>
                        <div style={{ fontSize: 11.5, color: done ? '#000080' : '#64748b', fontWeight: done ? 700 : 500 }}>{step.label}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', margin: '0 18px' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, #FF9933, #138808)', borderRadius: 3, width: `${(getStatusIndex(complaint.status) / 3) * 100}%`, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
              {[
                { label: 'Filed On', value: new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { label: 'Expected SLA Due Date', value: complaint.dueDate ? new Date(complaint.dueDate).toLocaleDateString('en-IN') : 'N/A' },
                { label: 'Priority', value: complaint.priority?.toUpperCase() || 'MEDIUM' },
                { label: 'Assigned Officer', value: complaint.assignedOfficer?.name || 'Pending Assignment' },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 600 }}>{value}</div>
                </div>
              ))}
            </div>

            {complaint.resolutionNote && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 11.5, color: '#15803d', fontWeight: 700, marginBottom: 4 }}>RESOLUTION NOTE</div>
                <p style={{ fontSize: 13.5, color: '#14532d' }}>{complaint.resolutionNote}</p>
              </div>
            )}

            <div style={{ marginTop: 18, padding: '12px 16px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10 }}>
              <p style={{ fontSize: 12.5, color: '#1e40af', margin: 0 }}>
                For complete audit timeline and appeal options, please <Link to="/login" style={{ fontWeight: 700, textDecoration: 'underline' }}>sign in to your account</Link>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
