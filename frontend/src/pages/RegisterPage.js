import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff,
  FiArrowLeft, FiArrowRight, FiShield, FiClock, FiCheckCircle, FiRefreshCw
} from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { RiGovernmentLine } from 'react-icons/ri';
import { motion } from 'framer-motion';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [countryCode, setCountryCode] = useState('+91');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleButtonRendered, setGoogleButtonRendered] = useState(false);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);

  const googleBtnRef = useRef(null);
  const googleTokenClientRef = useRef(null);

  const { register, verifyLoginOtp, sendLoginOtp, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleCallback = useCallback(async (response) => {
    if (!response?.credential) return;
    setGoogleLoading(true);
    try {
      const data = await googleLogin({ credential: response.credential });
      toast.success(`Welcome to JanSamadhan, ${data.user.name}!`);
      navigate(`/${data.user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-up failed.');
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLogin, navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || step !== 1) return;

    const initGis = () => {
      if (!window.google?.accounts) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
      });

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        const width = Math.min(googleBtnRef.current.offsetWidth || 380, 400);
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: 'signup_with',
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
            if (tokenResponse?.access_token) {
              setGoogleLoading(true);
              try {
                const data = await googleLogin({ access_token: tokenResponse.access_token });
                toast.success(`Welcome to JanSamadhan, ${data.user.name}!`);
                navigate(`/${data.user.role}`);
              } catch (err) {
                toast.error(err.response?.data?.message || 'Google sign-up failed.');
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
  }, [step, handleGoogleCallback, googleLogin, navigate]);

  const handleFallbackGoogle = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-In is not configured. Add REACT_APP_GOOGLE_CLIENT_ID to frontend/.env.');
      return;
    }
    if (googleTokenClientRef.current) {
      googleTokenClientRef.current.requestAccessToken({ prompt: 'select_account' });
    } else {
      window.google?.accounts?.id?.prompt();
    }
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      return toast.error('Please enter your full name and email address.');
    }
    setStep(2);
  };

  const passwordRules = [
    { label: 'Min 6 characters', ok: form.password.length >= 6 },
    { label: '1 uppercase letter', ok: /[A-Z]/.test(form.password) },
    { label: '1 number', ok: /\d/.test(form.password) },
    { label: '1 special symbol (!@#$%^&*)', ok: /[!@#$%^&*]/.test(form.password) },
  ];
  const passedCount = passwordRules.filter((r) => r.ok).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match.');
    if (passedCount < 4) {
      return toast.error('Password must be at least 6 characters long and include 1 uppercase, 1 number, and 1 special character (!@#$%^&*).');
    }
    setLoading(true);
    try {
      const cleanDigits = form.phone.replace(/\s+/g, '');
      const fullPhone = cleanDigits ? `${countryCode} ${cleanDigits}` : undefined;
      const res = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(fullPhone ? { phone: fullPhone } : {}),
      });
      toast.success(res.message || 'OTP sent to your email.');
      setResendTimer(45);
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await sendLoginOtp(form.email.trim());
      toast.success('A fresh 6-digit OTP has been sent to your email.');
      setResendTimer(45);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, '');
    if (!clean && value !== '') return;
    const newOtp = [...otp];
    newOtp[index] = clean.slice(-1);
    setOtp(newOtp);
    if (clean && index < 5) {
      document.getElementById(`reg-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setOtp(pasted.split(''));
      document.getElementById('reg-otp-5')?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      document.getElementById(`reg-otp-${index - 1}`)?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return toast.error('Please enter the 6-digit OTP.');
    setLoading(true);
    try {
      const data = await verifyLoginOtp(form.email.trim(), otpValue);
      toast.success('Registration verified! Welcome to JanSamadhan.');
      navigate(`/${data.user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div className="tricolor-bar" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50 }} />
      <Link to="/" style={styles.backLink}><FiArrowLeft size={16} /> Back to Portal</Link>

      <div style={styles.wrapper} className="auth-split-grid">
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
              <div style={styles.brandSub}>Citizen Grievance &amp; Redressal Portal</div>
            </div>
          </div>

          <div style={styles.pillBadge}>
            <RiGovernmentLine size={15} /> Free Citizen Registration
          </div>

          <h2 style={styles.infoHeadline}>
            Create Your <span style={{ color: '#FF9933' }}>Digital Citizen</span> Account
          </h2>
          <p style={styles.infoCopy}>
            Lodge complaints against Central &amp; State departments, track SLA progress in real time, and escalate unresolved issues directly to Appellate Authorities.
          </p>

          <div style={styles.featureList}>
            {[
              { icon: <FiCheckCircle size={17} color="#4ade80" />, title: 'Instant OTP Verification', desc: 'Secure email verification ensures authentic citizen grievance tracking' },
              { icon: <FiClock size={17} color="#fbbf24" />, title: '2-Month Password Security Cycle', desc: 'Registered passwords automatically expire after 2 months to keep your account protected' },
              { icon: <FiShield size={17} color="#93c5fd" />, title: '100% Free Government Service', desc: 'No charges or middlemen — direct access to Nodal PG Officers' },
            ].map((item, idx) => (
              <div key={idx} style={styles.featureRow}>
                <div style={{ marginTop: 2, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', lineHeight: 1.45 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.infoFooter}>
            <span>Toll-Free: <strong>1800-11-0031</strong></span>
            <span>&middot;</span>
            <span>CPGRAMS Standard</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={styles.card}
        >
          <div className="auth-mobile-brand" style={{ textAlign: 'center', marginBottom: 16 }}>
            <img src="/emblem.png" alt="National Emblem" style={{ height: 52, width: 52, objectFit: 'contain', marginBottom: 4 }} />
            <div style={{ fontSize: 22, fontWeight: 900, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>JanSamadhan</div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {[
              { n: 1, label: 'Details' },
              { n: 2, label: 'Password' },
              { n: 3, label: 'Verify OTP' },
            ].map((s) => (
              <div key={s.n} style={{ flex: 1 }}>
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: step >= s.n ? 'linear-gradient(90deg, #FF9933, #138808)' : '#e2e8f0',
                    transition: 'all 0.3s ease',
                    marginBottom: 4,
                  }}
                />
                <div style={{ fontSize: 11, fontWeight: step === s.n ? 700 : 500, color: step >= s.n ? '#000080' : '#94a3b8' }}>
                  {s.n}. {s.label}
                </div>
              </div>
            ))}
          </div>

          <h2 style={styles.cardTitle}>
            {step === 1 ? 'Personal Information' : step === 2 ? 'Set Strong Password' : 'Verify Your Email'}
          </h2>

          {step === 1 && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {GOOGLE_CLIENT_ID ? (
                  <div style={{ position: 'relative', width: '100%' }}>
                    <div ref={googleBtnRef} style={{ width: '100%', minHeight: 42, display: 'flex', justifyContent: 'center' }} />
                    {!googleButtonRendered && (
                      <button type="button" onClick={handleFallbackGoogle} style={styles.googleBtn} disabled={googleLoading}>
                        <FcGoogle size={20} /> Sign up with Google
                      </button>
                    )}
                  </div>
                ) : (
                  <button type="button" onClick={handleFallbackGoogle} style={styles.googleBtn} disabled={googleLoading}>
                    <FcGoogle size={20} /> Sign up with Google
                  </button>
                )}
              </div>

              <div style={styles.divider}>
                <span style={styles.dividerLine} />
                <span style={styles.dividerText}>or register with Email ID</span>
                <span style={styles.dividerLine} />
              </div>

              <form onSubmit={handleNext} style={styles.form}>
                <div>
                  <label style={styles.label}>Full Name *</label>
                  <div style={styles.inputWrapper}>
                    <FiUser style={styles.inputIcon} />
                    <input name="name" type="text" value={form.name} onChange={handleChange} style={styles.input} placeholder="Enter your full name" required />
                  </div>
                </div>
                <div>
                  <label style={styles.label}>Email Address *</label>
                  <div style={styles.inputWrapper}>
                    <FiMail style={styles.inputIcon} />
                    <input name="email" type="email" value={form.email} onChange={handleChange} style={styles.input} placeholder="citizen@example.com" required />
                  </div>
                </div>
                <div>
                  <label style={styles.label}>Mobile Number (Optional)</label>
                  <div style={styles.inputWrapper}>
                    <FiPhone style={styles.inputIcon} />
                    <div style={{ display: 'flex', width: '100%', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, overflow: 'hidden' }}>
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        style={{ padding: '12px 8px 12px 38px', border: 'none', background: '#f1f5f9', color: '#334155', fontSize: 13.5, fontWeight: 600, outline: 'none', borderRight: '1px solid #cbd5e1' }}
                      >
                        <option value="+91">IN (+91)</option>
                        <option value="+1">US (+1)</option>
                        <option value="+44">UK (+44)</option>
                        <option value="+61">AU (+61)</option>
                        <option value="+971">UAE (+971)</option>
                      </select>
                      <input
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        style={{ ...styles.input, border: 'none', borderRadius: 0, paddingLeft: 12, flex: 1 }}
                        placeholder="10-digit mobile number"
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" style={styles.submitBtn}>
                  Continue <FiArrowRight style={{ marginLeft: 6 }} />
                </button>
              </form>
            </>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} style={styles.form}>
              <div>
                <label style={styles.label}>Create Password *</label>
                <div style={styles.inputWrapper}>
                  <FiLock style={styles.inputIcon} />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    style={{ ...styles.input, paddingRight: 44 }}
                    placeholder="Min. 6 characters"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.passToggle}>
                    {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                  </button>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={styles.strengthBar}>
                    <div
                      style={{
                        ...styles.strengthFill,
                        width: `${(passedCount / 4) * 100}%`,
                        background: passedCount === 4 ? '#138808' : passedCount >= 2 ? '#FF9933' : '#dc3545',
                      }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginTop: 8 }}>
                    {passwordRules.map((r) => (
                      <div key={r.label} style={{ fontSize: 11.5, color: r.ok ? '#15803d' : '#64748b', fontWeight: r.ok ? 600 : 400 }}>
                        {r.ok ? '✓' : '○'} {r.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label style={styles.label}>Confirm Password *</label>
                <div style={styles.inputWrapper}>
                  <FiLock style={styles.inputIcon} />
                  <input
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    style={styles.input}
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 12, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiClock size={15} style={{ flexShrink: 0 }} />
                <span>For citizen account security, your password remains valid for <strong>2 months</strong> before requiring renewal.</span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep(1)} style={styles.backBtn}><FiArrowLeft /> Back</button>
                <button type="submit" style={{ ...styles.submitBtn, flex: 1 }} disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send Verification OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleVerifyOtp} style={styles.form}>
              <div style={{ textAlign: 'center', background: '#f8fafc', padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>We&apos;ve sent a 6-digit verification code to:</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#000080' }}>{form.email}</p>
                <p style={{ fontSize: 11.5, color: '#dc2626', marginTop: 4 }}>Expires in 5 minutes</p>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '8px 0' }} onPaste={handleOtpPaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`reg-otp-${index}`}
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                <button type="button" onClick={() => setStep(2)} style={styles.linkBtn}>
                  <FiArrowLeft size={13} /> Edit Password
                </button>
                <button
                  type="button"
                  disabled={resendTimer > 0 || loading}
                  onClick={handleResendOtp}
                  style={{ ...styles.linkBtn, opacity: resendTimer > 0 ? 0.55 : 1 }}
                >
                  <FiRefreshCw size={12} /> {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>

              <button type="submit" style={styles.submitBtn} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Complete Registration'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: 13.5, color: '#64748b', marginTop: 18 }}>
            Already have an account? <Link to="/login" style={{ color: '#000080', fontWeight: 700 }}>Sign In</Link>
          </p>

          <div style={{ marginTop: 14, padding: '10px 14px', background: '#ecfdf5', borderRadius: 10, border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiShield size={17} color="#138808" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 11.5, color: '#14532d', lineHeight: 1.45 }}>
              256-bit SSL encrypted &amp; aligned with Government of India cybersecurity standards.
            </p>
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
  infoHeadline: { fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'Poppins, sans-serif', lineHeight: 1.25, marginBottom: 12 },
  infoCopy: { fontSize: 13.5, color: 'rgba(255,255,255,0.78)', lineHeight: 1.65, marginBottom: 24 },
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
  infoFooter: {
    display: 'flex',
    gap: 10,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    paddingTop: 16,
    borderTop: '1px solid rgba(255,255,255,0.14)',
  },
  card: { background: '#fff', padding: '34px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  cardTitle: { fontSize: 22, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 16 },
  googleBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    width: '100%', height: 42, background: '#fff', border: '1px solid #cbd5e1',
    borderRadius: 8, color: '#1e293b', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 14px' },
  dividerLine: { flex: 1, height: 1, background: '#e2e8f0' },
  dividerText: { fontSize: 12, color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  label: { display: 'block', fontSize: 12.5, fontWeight: 600, color: '#334155', marginBottom: 5 },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: 14, color: '#64748b', fontSize: 17, zIndex: 2 },
  input: {
    width: '100%', padding: '12px 14px 12px 42px', background: '#f8fafc',
    border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14.5,
    outline: 'none', boxSizing: 'border-box',
  },
  passToggle: { position: 'absolute', right: 12, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', padding: 4 },
  submitBtn: {
    width: '100%', padding: 13, background: '#000080', border: 'none', borderRadius: 10,
    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  backBtn: {
    padding: '12px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 10,
    color: '#334155', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
  },
  strengthBar: { height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 3, transition: 'all 0.3s ease' },
  otpBox: {
    width: 44, height: 48, textAlign: 'center', fontSize: 20, fontWeight: 700,
    color: '#000080', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8,
  },
  linkBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
    color: '#000080', fontWeight: 600, cursor: 'pointer', fontSize: 12.5,
  },
};
