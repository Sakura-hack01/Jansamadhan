import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft, FiClock } from 'react-icons/fi';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const rules = [
    { label: 'Min 6 characters', ok: form.password.length >= 6 },
    { label: '1 uppercase letter', ok: /[A-Z]/.test(form.password) },
    { label: '1 number', ok: /\d/.test(form.password) },
    { label: '1 special symbol (!@#$%^&*)', ok: /[!@#$%^&*]/.test(form.password) },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.');
    if (rules.some((r) => !r.ok)) return toast.error('Please satisfy all password requirements.');
    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password: form.password });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed or expired link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div className="tricolor-bar" style={{ position: 'fixed', top: 0, left: 0, right: 0 }} />
      <Link to="/login" style={backBtnStyle}><FiArrowLeft size={16} /> Back to Sign In</Link>

      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/emblem.png" alt="National Emblem" style={{ height: 64, width: 64, objectFit: 'contain', marginBottom: 8 }} />
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>Reset Password</h1>
          <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 4 }}>Set a new strong password for your JanSamadhan account</p>
        </div>

        <div style={cardStyle}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FiLock size={17} style={{ position: 'absolute', left: 14, color: '#64748b' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  placeholder="Min. 6 characters"
                  style={{ ...inputStyle, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                  {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 8 }}>
                {rules.map((r) => (
                  <div key={r.label} style={{ fontSize: 11.5, color: r.ok ? '#15803d' : '#64748b', fontWeight: r.ok ? 600 : 400 }}>
                    {r.ok ? '✓' : '○'} {r.label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Confirm New Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <FiLock size={17} style={{ position: 'absolute', left: 14, color: '#64748b' }} />
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                  required
                  placeholder="Re-enter password"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ padding: '10px 12px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 12, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiClock size={15} />
              <span>Your new password will remain valid for <strong>2 months</strong>.</span>
            </div>

            <button type="submit" disabled={loading} style={submitBtnStyle}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative',
};
const backBtnStyle = {
  position: 'fixed', top: 20, left: 24, display: 'inline-flex', alignItems: 'center', gap: 8,
  color: '#000080', background: '#fff', border: '1px solid #cbd5e1', padding: '8px 14px',
  borderRadius: 999, fontSize: 13, fontWeight: 600, textDecoration: 'none',
};
const cardStyle = {
  background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 32,
  boxShadow: '0 16px 40px rgba(0,0,50,0.08)',
};
const labelStyle = { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 };
const inputStyle = {
  width: '100%', padding: '12px 14px 12px 42px', background: '#f8fafc',
  border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14.5, boxSizing: 'border-box',
};
const submitBtnStyle = {
  padding: 13, borderRadius: 10, background: '#000080', border: 'none',
  color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,128,0.25)',
};
