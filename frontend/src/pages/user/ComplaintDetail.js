import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ComplaintDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: '' });
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/complaints/${id}`);
        setComplaint(data.data);
      } catch {
        toast.error('Complaint not found.');
        navigate('/user/complaints');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const handleFeedback = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/complaints/${id}/feedback`, feedbackForm);
      toast.success('Feedback submitted! Thank you.');
      setShowFeedback(false);
      const { data } = await api.get(`/complaints/${id}`);
      setComplaint(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback.');
    }
  };

  if (loading) return <div className="skeleton" style={{ height: 480, borderRadius: 16 }} />;
  if (!complaint) return null;

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

  const st = getStatusStyle(complaint.status);

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>
      <button onClick={() => navigate('/user/complaints')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 14px', color: '#000080', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', marginBottom: 18 }}>
        &larr; Back to Complaints
      </button>

      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 28, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: '#000080', fontFamily: 'monospace', fontWeight: 700 }}>{complaint.complaintNumber}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 12, background: st.bg, color: st.color, textTransform: 'uppercase' }}>{complaint.status.replace('_', ' ')}</span>
            </div>
            <h1 style={{ fontSize: 23, fontWeight: 800, color: '#0f172a', fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>{complaint.title}</h1>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              {complaint.category} · {complaint.department?.name} · Filed {new Date(complaint.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, background: complaint.priority === 'urgent' ? '#fee2e2' : '#eff6ff', color: complaint.priority === 'urgent' ? '#b91c1c' : '#1e40af', textTransform: 'uppercase' }}>
            {complaint.priority} PRIORITY
          </span>
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 18, marginBottom: 18 }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Description</h4>
          <p style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.7, margin: 0 }}>{complaint.description}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { label: 'Department', value: complaint.department?.name || 'N/A' },
            { label: 'Assigned Officer', value: complaint.assignedOfficer?.name || 'Pending Assignment' },
            { label: 'Due Date', value: complaint.dueDate ? new Date(complaint.dueDate).toLocaleDateString('en-IN') : 'N/A' },
            { label: 'Last Updated', value: new Date(complaint.updatedAt).toLocaleDateString('en-IN') },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13.5, color: '#0f172a', fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>

        {complaint.resolutionNote && (
          <div style={{ marginTop: 16, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: 16 }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 6, textTransform: 'uppercase' }}>Resolution Note</h4>
            <p style={{ fontSize: 14, color: '#14532d', margin: 0 }}>{complaint.resolutionNote}</p>
          </div>
        )}

        {complaint.rejectionReason && (
          <div style={{ marginTop: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: 16 }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, color: '#b91c1c', marginBottom: 6, textTransform: 'uppercase' }}>Rejection Reason</h4>
            <p style={{ fontSize: 14, color: '#7f1d1d', margin: 0 }}>{complaint.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 28, marginBottom: 20, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 20 }}>📜 Activity Timeline</h3>
        {complaint.timeline?.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: 14 }}>No activity yet.</p>
        ) : [...(complaint.timeline || [])].reverse().map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: 20, position: 'relative' }}>
            {i < complaint.timeline.length - 1 && (
              <div style={{ position: 'absolute', left: 19, top: 40, bottom: 0, width: 2, background: '#e2e8f0' }} />
            )}
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {i === 0 ? '📌' : '✏️'}
            </div>
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{item.action}</div>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 3 }}>{item.description}</div>
              <div style={{ fontSize: 11.5, color: '#64748b' }}>
                {item.performedBy?.name || 'System'} ({item.performedByRole}) · {new Date(item.timestamp).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback */}
      {complaint.status === 'resolved' && !complaint.feedback && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 18, padding: 28 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 6 }}>⭐ Share Your Feedback</h3>
          <p style={{ fontSize: 14, color: '#475569', marginBottom: 18 }}>Your complaint has been resolved. Please rate the resolution quality.</p>
          {!showFeedback ? (
            <button onClick={() => setShowFeedback(true)} style={{ padding: '11px 24px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Give Feedback
            </button>
          ) : (
            <form onSubmit={handleFeedback} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Rating</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setFeedbackForm((p) => ({ ...p, rating: n }))} style={{ width: 44, height: 44, borderRadius: 10, border: `2px solid ${feedbackForm.rating >= n ? '#f59e0b' : '#cbd5e1'}`, background: feedbackForm.rating >= n ? '#fef3c7' : '#fff', fontSize: 20, cursor: 'pointer' }}>
                      ⭐
                    </button>
                  ))}
                  <span style={{ fontSize: 14, color: '#334155', fontWeight: 700, marginLeft: 8 }}>{feedbackForm.rating}/5</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>Comments</label>
                <textarea value={feedbackForm.comment} onChange={(e) => setFeedbackForm((p) => ({ ...p, comment: e.target.value }))} rows={3} placeholder="Share your experience..." style={{ width: '100%', padding: '12px 14px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, resize: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowFeedback(false)} style={{ padding: '11px 20px', borderRadius: 10, background: '#fff', border: '1px solid #cbd5e1', color: '#475569', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '11px 24px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Submit Feedback</button>
              </div>
            </form>
          )}
        </div>
      )}

      {complaint.feedback && (
        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 16, padding: 20 }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#15803d', marginBottom: 8 }}>Your Submitted Feedback</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ fontSize: 18, filter: i < complaint.feedback.rating ? 'none' : 'grayscale(100%) opacity(0.3)' }}>⭐</span>
            ))}
            <span style={{ fontSize: 13, color: '#334155', fontWeight: 700, marginLeft: 4 }}>{complaint.feedback.rating}/5</span>
          </div>
          {complaint.feedback.comment && <p style={{ fontSize: 13.5, color: '#14532d', margin: 0 }}>{complaint.feedback.comment}</p>}
        </div>
      )}
    </div>
  );
}
