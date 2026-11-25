import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiShield,
  FiCheckCircle, FiClock, FiKey, FiRefreshCw
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { RiGovernmentLine } from 'react-icons/ri';
import { motion } from 'framer-motion';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const [authMode, setAuthMode] = useState('password'); // 'password' | 'otp'
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleButtonRendered, setGoogleButtonRendered] = useState(false);

  // OTP Login / Unverified Email Flow
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);

  // 2-Month Password Expiration Flow
  const [expiredState, setExpiredState] = useState(null); // { token, expiredAt }
  const [newPasswordForm, setNewPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [showNewPassword, setShowNewPassword] = useState(false);

  const googleBtnRef = useRef(null);
  const googleTokenClientRef = useRef(null);

  const {
    login,
    updateExpiredPassword,
    googleLogin,
    sendLoginOtp,
    verifyLoginOtp,
  } = useAuth();
  const navigate = useNavigate();

  const handleGoogleCallback = useCallback(async (response) => {
    if (!response?.credential) return;
    setGoogleLoading(true);
    try {
      const data = await googleLogin({ credential: response.credential });
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(`/${data.user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google login failed.');
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLogin, navigate]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Initialize Google Identity Services (Official Button + OAuth2 Popup fallback)
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const initGis = () => {
      if (!window.google?.accounts) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        const width = Math.min(googleBtnRef.current.offsetWidth || 380, 400);
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'continue_with',
          logo_alignment: 'left',
          width,
        });
        setGoogleButtonRendered(true);
      }

      if (window.google.accounts.oauth2) {
        googleTokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse) => {
            if (tokenResponse?.error) {
              toast.error('Google authentication was cancelled.');
              return;
            }
            if (tokenResponse?.access_token) {
              setGoogleLoading(true);
              try {
                const data = await googleLogin({ access_token: tokenResponse.access_token });
                toast.success(`Welcome back, ${data.user.name}!`);
                navigate(`/${data.user.role}`);
              } catch (err) {
                toast.error(err.response?.data?.message || 'Google login failed.');
              } finally {
                setGoogleLoading(false);
              }
            }
          },
        });
      }
    };

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      initGis();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initGis;
    document.head.appendChild(script);
  }, [handleGoogleCallback, googleLogin, navigate]);

  const handleFallbackGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Login is not configured. Add REACT_APP_GOOGLE_CLIENT_ID to frontend/.env.');
      return;
    }
    if (googleTokenClientRef.current) {
      googleTokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    } else if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      toast.error('Google Sign-In is still loading. Please try again in a moment.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please enter your Email ID and Password.');
      return;
    }
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(`/${data.user.role}`);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === 'PASSWORD_EXPIRED' && errData?.passwordUpdateToken) {
        setExpiredState({
          token: errData.passwordUpdateToken,
          expiredAt: errData.passwordExpiredAt,
        });
        toast.error('Your password has expired after 2 months. Please set a new password.');
      } else if (errData?.code === 'EMAIL_NOT_VERIFIED') {
        toast.error(errData.message);
        setAuthMode('otp');
        setOtpSent(false);
      } else {
        toast.error(errData?.message || 'Sign in failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!form.email) {
      toast.error('Please enter your registered Email ID.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendLoginOtp(form.email);
      toast.success(res.message || '6-digit OTP sent to your email.');
      setOtpSent(true);
      setResendTimer(45);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    try {
      const data = await verifyLoginOtp(form.email, otpValue);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate(`/${data.user.role}`);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.code === 'PASSWORD_EXPIRED' && errData?.passwordUpdateToken) {
        setExpiredState({
          token: errData.passwordUpdateToken,
          expiredAt: errData.passwordExpiredAt,
        });
        toast.error('Your password has expired after 2 months. Please set a new password.');
      } else {
        toast.error(errData?.message || 'Invalid or expired OTP.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, '');
    if (!clean && value !== '') return;
    const next = [...otp];
    next[index] = clean.slice(-1);
    setOtp(next);
    if (clean && index < 5) {
      document.getElementById(`login-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setOtp(pasted.split(''));
      document.getElementById('login-otp-5')?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      document.getElementById(`login-otp-${index - 1}`)?.focus();
    }
  };

  const passwordRules = [
    { label: 'At least 6 characters', ok: newPasswordForm.newPassword.length >= 6 },
    { label: '1 uppercase letter (A-Z)', ok: /[A-Z]/.test(newPasswordForm.newPassword) },
    { label: '1 number (0-9)', ok: /\d/.test(newPasswordForm.newPassword) },
    { label: '1 special symbol (!@#$%^&*)', ok: /[!@#$%^&*]/.test(newPasswordForm.newPassword) },
  ];

  const handleUpdateExpiredPassword = async (e) => {
    e.preventDefault();
    if (newPasswordForm.newPassword !== newPasswordForm.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (passwordRules.some((r) => !r.ok)) {
      toast.error('Please satisfy all password security requirements.');
      return;
    }
    setLoading(true);
    try {
      const data = await updateExpiredPassword(expiredState.token, newPasswordForm.newPassword);
      toast.success('Password renewed for the next 2 months. Welcome back!');
      navigate(`/${data.user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div className="tricolor-bar" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }} />

      <Link to="/" style={styles.backLink}>
        <FiArrowLeft size={16} /> Back to Portal
      </Link>

      <div style={styles.wrapper} className="auth-split-grid">
        {/* Left Official Portal Info Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          style={styles.infoPanel}
          className="auth-info-panel"
        >
          <div style={styles.brandHeader}>
            <div style={styles.emblemBox}>
              <img src="/emblem.png" alt="National Emblem of India" style={{ height: 52, width: 52, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={styles.ministryLabel}>Government of India</div>
              <h1 style={styles.brandTitle}>JanSamadhan</h1>
              <div style={styles.brandSub}>Centralised Public Grievance Redress &amp; Monitoring</div>
            </div>
          </div>

          <div style={styles.pillBadge}>
            <RiGovernmentLine size={15} /> Official Citizen &amp; Officer Sign-In
          </div>

          <h2 style={styles.infoHeadline}>
            Unified Access to <span style={{ color: '#FF9933' }}>580+</span> Government Departments
          </h2>
          <p style={styles.infoCopy}>
            Sign in seamlessly using your Google account or registered JanSamadhan Email ID and Password / OTP. Track grievances in real time with complete transparency.
          </p>

          <div style={styles.featureList}>
            {[
              { icon: <FiCheckCircle size={17} color="#4ade80" />, title: 'Verified Single Sign-On', desc: 'Instant sign-in via Google, Email Password, or 6-digit Email OTP' },
              { icon: <FiClock size={17} color="#fbbf24" />, title: '2-Month Password Rotation Policy', desc: 'Registered passwords automatically expire every 2 months for citizen account safety' },
              { icon: <FiShield size={17} color="#93c5fd" />, title: '256-Bit Encrypted & Audit Logged', desc: 'MeitY-aligned protection against brute force, XSS, and unauthorized access' },
            ].map((item, idx) => (
              <div key={idx} style={styles.featureRow}>
                <div style={styles.featureIcon}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.45 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.infoFooter}>
            <span>Helpline: <strong>1800-11-0031</strong></span>
            <span>&middot;</span>
            <span>24&times;7 Citizen Portal</span>
          </div>
        </motion.div>

        {/* Right Authentication Card */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={styles.card}
        >
          <div className="auth-mobile-brand" style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src="/emblem.png" alt="National Emblem" style={{ height: 54, width: 54, objectFit: 'contain', marginBottom: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 900, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>JanSamadhan</div>
          </div>

          {expiredState ? (
            <div>
              <div style={styles.expiredBanner}>
                <FiKey size={22} color="#b45309" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 800, color: '#92400e', fontSize: 14 }}>Password Expired (2-Month Security Policy)</div>
                  <div style={{ fontSize: 12.5, color: '#78350f', marginTop: 2 }}>
                    Passwords created by registered users expire after 2 months. Create a new strong password to continue.
                  </div>
                </div>
              </div>

              <form onSubmit={handleUpdateExpiredPassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={styles.label}>New Password</label>
                  <div style={styles.inputWrapper}>
                    <FiLock size={17} style={styles.inputIcon} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      style={{ ...styles.input, paddingRight: 44 }}
                      placeholder="Enter new strong password"
                      value={newPasswordForm.newPassword}
                      onChange={(e) => setNewPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                      required
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={styles.eyeBtn}>
                      {showNewPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                    </button>
                  </div>
                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {passwordRules.map((r) => (
                      <div key={r.label} style={{ fontSize: 11.5, color: r.ok ? '#15803d' : '#64748b', display: 'flex', alignItems: 'center', gap: 5, fontWeight: r.ok ? 600 : 400 }}>
                        <span>{r.ok ? '✓' : '○'}</span> {r.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={styles.label}>Confirm New Password</label>
                  <div style={styles.inputWrapper}>
                    <FiLock size={17} style={styles.inputIcon} />
                    <input
                      type="password"
                      style={styles.input}
                      placeholder="Re-enter new password"
                      value={newPasswordForm.confirmPassword}
                      onChange={(e) => setNewPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <button type="submit" style={styles.submitBtn} disabled={loading}>
                  {loading ? 'Updating Password...' : 'Update Password & Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpiredState(null);
                    setNewPasswordForm({ newPassword: '', confirmPassword: '' });
                  }}
                  style={styles.secondaryBtn}
                >
                  Back to Sign In
                </button>
              </form>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 22 }}>
                <h2 style={styles.title}>Sign In to Portal</h2>
                <p style={styles.subtitle}>Choose your preferred authentication method</p>
              </div>

              {/* Google Sign-In */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {GOOGLE_CLIENT_ID ? (
                  <div style={{ position: 'relative', width: '100%' }}>
                    <div
                      ref={googleBtnRef}
                      style={{
                        width: '100%',
                        minHeight: 44,
                        display: 'flex',
                        justifyContent: 'center',
                        opacity: googleLoading ? 0.6 : 1,
                        pointerEvents: googleLoading ? 'none' : 'auto',
                      }}
                    />
                    {!googleButtonRendered && (
                      <button type="button" onClick={handleFallbackGoogleLogin} style={styles.googleBtn} disabled={googleLoading}>
                        <FcGoogle size={20} /> Continue with Google
                      </button>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={handleFallbackGoogleLogin} style={styles.googleBtn} disabled={googleLoading}>
                    <FcGoogle size={20} /> Continue with Google
                  </button>
                )}
              </div>

              <div style={styles.divider}>
                <span style={styles.dividerLine} />
                <span style={styles.dividerText}>or sign in with Email ID</span>
                <span style={styles.dividerLine} />
              </div>

              {/* Mode Switcher Tabs (Email & Password vs Email OTP) */}
              <div style={styles.tabBar}>
                <button
                  type="button"
                  onClick={() => { setAuthMode('password'); setOtpSent(false); }}
                  style={{ ...styles.tabBtn, ...(authMode === 'password' ? styles.tabBtnActive : {}) }}
                >
                  ID &amp; Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('otp')}
                  style={{ ...styles.tabBtn, ...(authMode === 'otp' ? styles.tabBtnActive : {}) }}
                >
                  Email OTP
                </button>
              </div>

              {authMode === 'password' ? (
                <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <div>
                    <label style={styles.label}>Registered Email ID</label>
                    <div style={styles.inputWrapper}>
                      <FiMail size={17} style={styles.inputIcon} />
                      <input
                        type="email"
                        style={styles.input}
                        placeholder="citizen@example.com"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ ...styles.label, marginBottom: 0 }}>Password</label>
                      <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
                    </div>
                    <div style={styles.inputWrapper}>
                      <FiLock size={17} style={styles.inputIcon} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        style={{ ...styles.input, paddingRight: 44 }}
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                        required
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                        {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" style={styles.submitBtn} disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </form>
              ) : !otpSent ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <div>
                    <label style={styles.label}>Registered Email ID</label>
                    <div style={styles.inputWrapper}>
                      <FiMail size={17} style={styles.inputIcon} />
                      <input
                        type="email"
                        style={styles.input}
                        placeholder="citizen@example.com"
                        value={form.email}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                        required
                      />
                    </div>
                    <p style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>
                      We will send a 6-digit verification OTP valid for 5 minutes.
                    </p>
                  </div>
                  <button type="submit" style={styles.submitBtn} disabled={loading}>
                    {loading ? 'Sending OTP...' : 'Send Login OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ textAlign: 'center', background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 12.5, color: '#475569' }}>Enter the 6-digit OTP sent to</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#000080' }}>{form.email}</div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`login-otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        style={styles.otpBox}
                      />
                    ))}
                  </div>

                  <button type="submit" style={styles.submitBtn} disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify OTP & Sign In'}
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                    <button type="button" onClick={() => setOtpSent(false)} style={styles.linkBtn}>
                      Change Email
                    </button>
                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={() => handleSendOtp()}
                      style={{ ...styles.linkBtn, opacity: resendTimer > 0 ? 0.55 : 1 }}
                    >
                      <FiRefreshCw size={12} /> {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}

              <p style={styles.registerLink}>
                New citizen? <Link to="/register" style={styles.registerLinkA}>Create Citizen Account</Link>
              </p>
            </>
          )}

          <div style={styles.securityNote}>
            <FiShield size={14} color="#138808" />
            <span>Protected by 256-bit SSL &amp; 2-month password rotation policy</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '56px 20px 28px',
    position: 'relative',
  },
  backLink: {
    position: 'fixed',
    top: 20,
    left: 24,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    color: '#000080',
    background: '#fff',
    border: '1px solid #cbd5e1',
    padding: '8px 14px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    textDecoration: 'none',
    zIndex: 40,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  wrapper: {
    width: '100%',
    maxWidth: 980,
    display: 'grid',
    gridTemplateColumns: '1.05fr 0.95fr',
    background: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
    boxShadow: '0 24px 60px rgba(0,0,50,0.12)',
    border: '1px solid #cbd5e1',
  },
  infoPanel: {
    background: 'linear-gradient(155deg, #00005c 0%, #000080 55%, #0f296b 100%)',
    color: '#fff',
    padding: '40px 36px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
  },
  brandHeader: { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 },
  emblemBox: {
    width: 62,
    height: 62,
    borderRadius: 14,
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
  },
  ministryLabel: { fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#FFB366' },
  brandTitle: { fontSize: 25, fontWeight: 900, color: '#fff', fontFamily: 'Poppins, sans-serif', lineHeight: 1.15 },
  brandSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.75)' },
  pillBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    width: 'fit-content',
    padding: '6px 14px',
    borderRadius: 999,
    background: 'rgba(255,153,51,0.18)',
    border: '1px solid rgba(255,153,51,0.4)',
    color: '#FFB366',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 16,
  },
  infoHeadline: {
    fontSize: 26,
    fontWeight: 800,
    color: '#fff',
    fontFamily: 'Poppins, sans-serif',
    lineHeight: 1.25,
    marginBottom: 12,
  },
  infoCopy: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 1.65,
    marginBottom: 24,
  },
  featureList: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 },
  featureRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    padding: '12px 14px',
  },
  featureIcon: { marginTop: 2, flexShrink: 0 },
  infoFooter: {
    display: 'flex',
    gap: 10,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.14)',
  },
  card: {
    padding: '38px 36px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    background: '#fff',
  },
  title: { fontSize: 24, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 4 },
  subtitle: { fontSize: 13.5, color: '#64748b' },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    height: 44,
    background: '#fff',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    color: '#1e293b',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 14px' },
  dividerLine: { flex: 1, height: 1, background: '#e2e8f0' },
  dividerText: { fontSize: 12, color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' },
  tabBar: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
    padding: 4,
    background: '#f1f5f9',
    borderRadius: 10,
    marginBottom: 18,
  },
  tabBtn: {
    padding: '8px 12px',
    borderRadius: 8,
    background: 'transparent',
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer',
  },
  tabBtnActive: {
    background: '#fff',
    color: '#000080',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
  },
  label: { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 6 },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, color: '#64748b' },
  input: {
    width: '100%',
    padding: '12px 14px 12px 42px',
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    color: '#0f172a',
    fontSize: 14.5,
    outline: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    padding: 4,
  },
  forgotLink: { fontSize: 12.5, color: '#000080', fontWeight: 600, textDecoration: 'none' },
  submitBtn: {
    width: '100%',
    padding: '13px 16px',
    background: '#000080',
    border: 'none',
    borderRadius: 10,
    color: '#fff',
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,128,0.25)',
  },
  secondaryBtn: {
    width: '100%',
    padding: '11px 16px',
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: 10,
    color: '#334155',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  otpBox: {
    width: 44,
    height: 48,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 700,
    color: '#000080',
    background: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: 8,
  },
  linkBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: 'none',
    border: 'none',
    color: '#000080',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 12.5,
  },
  expiredBanner: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
    padding: '14px 16px',
    background: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: 12,
    marginBottom: 20,
  },
  registerLink: { textAlign: 'center', fontSize: 13.5, color: '#64748b', marginTop: 18 },
  registerLinkA: { color: '#000080', fontWeight: 700, textDecoration: 'none' },
  securityNote: {
    marginTop: 18,
    paddingTop: 14,
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    fontSize: 11.5,
    color: '#475569',
  },
};
