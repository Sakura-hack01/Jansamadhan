import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiClock, FiShield } from 'react-icons/fi';

export default function UserProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: {
      street: user?.address?.street || '',
      city: user?.address?.city || '',
      state: user?.address?.state || '',
      pincode: user?.address?.pincode || '',
    },
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUser(data.data);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error('Passwords do not match.');
    }
    const rulesOk =
      passwordForm.newPassword.length >= 6 &&
      /[A-Z]/.test(passwordForm.newPassword) &&
      /\d/.test(passwordForm.newPassword) &&
      /[!@#$%^&*]/.test(passwordForm.newPassword);
    if (!rulesOk) {
      return toast.error('Password must be 6+ chars with 1 uppercase, 1 number, and 1 special symbol (!@#$%^&*).');
    }
    setPassLoading(true);
    try {
      const { data } = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (data.user) updateUser(data.user);
      toast.success(data.message || 'Password changed!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  const roleColors = { admin: '#7c3aed', officer: '#059669', user: '#000080' };
  const hasLocalPass = user?.hasPassword || user?.authProvider === 'local';
  const expiryDateStr = user?.passwordExpiresAt
    ? new Date(user.passwordExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      {/* Profile Header */}
      <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
        <div style={{ width: 78, height: 78, borderRadius: '50%', background: roleColors[user?.role] || '#000080', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            user?.name?.charAt(0)?.toUpperCase()
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>{user?.name}</h1>
          <p style={{ fontSize: 14, color: '#475569' }}>{user?.email}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: '#eff6ff', color: '#000080', border: '1px solid #bfdbfe', textTransform: 'uppercase' }}>{user?.role}</span>
            {user?.isVerified && (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>✓ Verified Account</span>
            )}
            {(user?.linkedProviders?.length ? user.linkedProviders : [user?.authProvider]).filter(Boolean).map((p) => (
              <span key={p} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8, background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', textTransform: 'capitalize' }}>
                {p} auth
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: '#e2e8f0', padding: 4, borderRadius: 12, width: 'fit-content' }}>
        {['profile', 'security'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '9px 20px',
              borderRadius: 9,
              border: 'none',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === tab ? '#000080' : 'transparent',
              color: activeTab === tab ? '#fff' : '#334155',
              transition: 'all 0.2s',
            }}
          >
            {tab === 'profile' ? '👤 Profile Details' : '🔒 Security & Password'}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 28, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', fontFamily: 'Poppins, sans-serif', marginBottom: 20 }}>Edit Profile</h3>
          <form onSubmit={handleProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="responsive-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} style={inputStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Mobile Number</label>
                <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} style={inputStyle} placeholder="+91 9876543210" />
              </div>
              <div>
                <label style={labelStyle}>Street Address</label>
                <input value={form.address.street} onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, street: e.target.value } }))} style={inputStyle} placeholder="Street" />
              </div>
              <div>
                <label style={labelStyle}>City</label>
                <input value={form.address.city} onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, city: e.target.value } }))} style={inputStyle} placeholder="City" />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input value={form.address.state} onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, state: e.target.value } }))} style={inputStyle} placeholder="State" />
              </div>
              <div>
                <label style={labelStyle}>Pincode</label>
                <input value={form.address.pincode} onChange={(e) => setForm((p) => ({ ...p, address: { ...p.address, pincode: e.target.value } }))} style={inputStyle} placeholder="6-digit pincode" maxLength={6} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loading} style={{ padding: '12px 28px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'security' && hasLocalPass && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {expiryDateStr && (
            <div style={{ background: user?.daysUntilPasswordExpiry <= 7 ? '#fef3c7' : '#eff6ff', border: `1px solid ${user?.daysUntilPasswordExpiry <= 7 ? '#fde68a' : '#bfdbfe'}`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <FiClock size={22} color={user?.daysUntilPasswordExpiry <= 7 ? '#b45309' : '#000080'} style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  2-Month Password Expiry Status: {user?.daysUntilPasswordExpiry} days remaining
                </div>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                  Your current registered password expires on <strong>{expiryDateStr}</strong>. Update it anytime below to reset your 2-month validity window.
                </div>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 18, padding: 28, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', fontFamily: 'Poppins, sans-serif', marginBottom: 20 }}>Change Password</h3>
            <form onSubmit={handlePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Current Password', key: 'currentPassword', placeholder: 'Enter current password' },
                { label: 'New Password', key: 'newPassword', placeholder: 'Min. 6 chars, 1 uppercase, 1 number, 1 symbol' },
                { label: 'Confirm New Password', key: 'confirmPassword', placeholder: 'Re-enter new password' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={labelStyle}>{label}</label>
                  <input type="password" value={passwordForm[key]} onChange={(e) => setPasswordForm((p) => ({ ...p, [key]: e.target.value }))} style={inputStyle} placeholder={placeholder} required />
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={passLoading} style={{ padding: '12px 28px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {passLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'security' && !hasLocalPass && (
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
          <FiShield size={22} color="#000080" style={{ flexShrink: 0 }} />
          <p style={{ color: '#1e3a8a', fontSize: 14, margin: 0 }}>
            You signed in using <strong style={{ textTransform: 'capitalize' }}>{user?.authProvider}</strong>. Authentication and password management are handled securely by your identity provider.
          </p>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.4px' };
const inputStyle = { width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, boxSizing: 'border-box', outline: 'none' };
