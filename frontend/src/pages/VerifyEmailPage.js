import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../utils/api';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const verify = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative' }}>
      <div className="tricolor-bar" style={{ position: 'fixed', top: 0, left: 0, right: 0 }} />
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 20, padding: 44, textAlign: 'center', maxWidth: 440, width: '100%', boxShadow: '0 16px 40px rgba(0,0,50,0.08)' }}>
        <img src="/emblem.png" alt="National Emblem" style={{ height: 56, width: 56, objectFit: 'contain', marginBottom: 16 }} />
        {status === 'loading' && (
          <>
            <div className="spinner" style={{ margin: '0 auto 18px', width: 38, height: 38 }} />
            <p style={{ color: '#475569', fontSize: 15, fontWeight: 500 }}>Verifying your email address...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <FiCheckCircle size={32} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 8 }}>Email Verified!</h2>
            <p style={{ color: '#475569', marginBottom: 24, fontSize: 14 }}>Your email has been verified. You can now sign in and access all portal services.</p>
            <Link to="/login" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 10, background: '#000080', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>Go to Sign In</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <FiXCircle size={32} />
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', fontFamily: 'Poppins, sans-serif', marginBottom: 8 }}>Verification Failed</h2>
            <p style={{ color: '#475569', marginBottom: 24, fontSize: 14 }}>This verification link may have expired or is invalid.</p>
            <Link to="/login" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 10, background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Back to Sign In</Link>
          </>
        )}
      </div>
    </div>
  );
}
