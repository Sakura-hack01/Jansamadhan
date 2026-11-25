import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link.');
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
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>Forgot Password</h1>
          <p style={{ color: '#64748b', fontSize: 13.5, marginTop: 4 }}>
            Enter your registered email ID to receive a secure password reset link
          </p>
        </div>

        <div style={cardStyle}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <FiCheckCircle size={28} />
              </div>
              <h3 style={{ fontSize: 19, color: '#0f172a', fontFamily: 'Poppins, sans-serif', marginBottom: 8 }}>Check Your Email</h3>
              <p style={{ color: '#475569', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                We sent a password reset link to <strong style={{ color: '#000080' }}>{email}</strong>. The link expires in 30 minutes.
              </p>
              <Link to="/login" style={primaryLinkBtn}>Return to Sign In</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Registered Email Address</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <FiMail size={17} style={{ position: 'absolute', left: 14, color: '#64748b' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="citizen@example.com"
                    style={inputStyle}
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} style={submitBtnStyle}>
                {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
              </button>
              <Link to="/login" style={{ textAlign: 'center', color: '#000080', fontSize: 13.5, fontWeight: 600 }}>
                &larr; Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 20,
  position: 'relative',
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
const primaryLinkBtn = {
  display: 'inline-block', padding: '11px 24px', borderRadius: 10,
  background: '#000080', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
};
