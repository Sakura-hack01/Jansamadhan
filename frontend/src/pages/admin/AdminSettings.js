import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get('/settings');
        setForm(data.data || {});
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const settingsList = Object.entries(form).map(([key, value]) => ({ key, value }));
      await api.put('/settings/bulk', { settings: settingsList });
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save settings.'); }
    finally { setSaving(false); }
  };

  const handleInit = async () => {
    try {
      await api.post('/settings/init');
      toast.success('Default settings initialized!');
      const { data } = await api.get('/settings');
      setForm(data.data || {});
    } catch { toast.error('Failed.'); }
  };

  if (loading) return <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>System Settings</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Configure JanSamadhan portal settings</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleInit} style={{ padding: '10px 18px', borderRadius: 10, background: '#fff', border: '1px solid #cbd5e1', color: '#334155', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            🔄 Reset to Defaults
          </button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '10px 20px', borderRadius: 10, background: '#000080', border: 'none', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Saving...' : '💾 Save Settings'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        <div style={card}>
          <h3 style={cardTitle}>🌐 General Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Site Name', key: 'site_name', type: 'text' },
              { label: 'Site Tagline', key: 'site_tagline', type: 'text' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input type={type} value={form[key] || ''} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
              </div>
            ))}
            <ToggleSetting label="Maintenance Mode" value={form.maintenance_mode} onChange={(v) => setForm((p) => ({ ...p, maintenance_mode: v }))} description="Temporarily disable portal access" danger />
          </div>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>📋 Complaint Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Default SLA Days', key: 'default_sla_days', type: 'number' },
              { label: 'Max Attachments', key: 'max_attachments', type: 'number' },
              { label: 'Max File Size (MB)', key: 'max_file_size_mb', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label style={labelStyle}>{label}</label>
                <input type={type} value={form[key] || ''} onChange={(e) => setForm((p) => ({ ...p, [key]: Number(e.target.value) }))} style={inputStyle} />
              </div>
            ))}
            <ToggleSetting label="Allow Anonymous Complaints" value={form.allow_anonymous_complaints} onChange={(v) => setForm((p) => ({ ...p, allow_anonymous_complaints: v }))} description="Citizens can file complaints without revealing identity" />
          </div>
        </div>

        <div style={card}>
          <h3 style={cardTitle}>🔔 Notifications</h3>
          <ToggleSetting label="Email Notifications" value={form.email_notifications} onChange={(v) => setForm((p) => ({ ...p, email_notifications: v }))} description="Send email alerts for complaint updates" />
        </div>

        <div style={card}>
          <h3 style={cardTitle}>ℹ️ System Info</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Version', value: '7.0.0' },
              { label: 'Stack', value: 'PostgreSQL (Neon/Supabase), Express, React, Node.js' },
              { label: 'Auth Providers', value: 'Email ID + OTP + Google' },
              { label: 'Password Policy', value: '2-Month Mandatory Rotation' },
              { label: 'Country', value: '🇮🇳 India' },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleSetting({ label, value, onChange, description, danger }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #e2e8f0' }}>
      <div>
        <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{description}</div>}
      </div>
      <button type="button" onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: value ? (danger ? '#dc2626' : '#138808') : '#cbd5e1', position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'all 0.2s' }} />
      </button>
    </div>
  );
}

const card = { background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' };
const cardTitle = { fontSize: 17, fontWeight: 700, color: '#000080', fontFamily: 'Poppins, sans-serif', marginBottom: 18 };
const labelStyle = { fontSize: 12, color: '#475569', display: 'block', marginBottom: 6, textTransform: 'uppercase', fontWeight: 700 };
const inputStyle = { width: '100%', padding: '11px 14px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a', fontSize: 14, boxSizing: 'border-box' };
