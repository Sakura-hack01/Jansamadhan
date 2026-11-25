import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FiMenu, FiX, FiAlertTriangle } from 'react-icons/fi';

export default function SharedLayout({ children, navItems, role }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifCount, setNotifCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchNotifCount = async () => {
      try {
        const { data } = await api.get('/notifications?limit=1');
        setNotifCount(data.unreadCount || 0);
      } catch {}
    };
    fetchNotifCount();
    const interval = setInterval(fetchNotifCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    toast.success('Logged out successfully.');
  };

  const daysLeft = user?.daysUntilPasswordExpiry;
  const showExpiryWarning =
    user?.hasPassword && typeof daysLeft === 'number' && daysLeft <= 7;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Tricolor Strip */}
      <div style={{ height: 4, width: '100%', background: 'linear-gradient(90deg, #FF9933 33.33%, #fff 33.33%, #fff 66.66%, #138808 66.66%)' }} />

      {/* Main Header */}
      <header style={{ background: '#000080', borderBottom: '1px solid rgba(255,255,255,0.12)', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 20px', height: 74, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {/* Logo Section */}
          <Link to={`/${role}`} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ background: '#fff', padding: 5, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/emblem.png" alt="Emblem" style={{ height: 40, width: 40, objectFit: 'contain', display: 'block' }} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Poppins, sans-serif', letterSpacing: '0.3px', lineHeight: 1.1 }}>JanSamadhan</div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>Government of India · जन समाधान</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 4, gap: 2 }}>
              {navItems.map((item) => {
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== `/${role}` && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '8px 13px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: isActive ? '#000080' : 'rgba(255,255,255,0.88)',
                      background: isActive ? '#fff' : 'transparent',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      position: 'relative',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>{item.icon}</span> <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {role !== 'admin' && (
              <Link
                to={`/${role}/notifications`}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  textDecoration: 'none',
                }}
                title="Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {notifCount > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, padding: '0 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 999, border: '2px solid #000080' }}>
                    {notifCount}
                  </span>
                )}
              </Link>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
              <Link
                to={role === 'admin' ? '/admin/settings' : `/${role}/profile`}
                style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', color: '#000080', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, overflow: 'hidden' }}>
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="user-meta-pill">
                  <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, lineHeight: 1.2 }}>{user?.name?.split(' ')[0]}</div>
                  <div style={{ fontSize: 10.5, color: '#FF9933', fontWeight: 700, textTransform: 'uppercase' }}>{user?.role}</div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(239,68,68,0.2)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.28)',
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
              <button
                type="button"
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen((v) => !v)}
                style={{
                  background: 'rgba(255,255,255,0.14)',
                  color: '#fff',
                  borderRadius: 8,
                  width: 38,
                  height: 38,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div style={{ background: '#000066', borderTop: '1px solid rgba(255,255,255,0.12)', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== `/${role}` && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: isActive ? '#000080' : '#fff',
                    background: isActive ? '#fff' : 'rgba(255,255,255,0.06)',
                    textDecoration: 'none',
                  }}
                >
                  <span>{item.icon}</span> <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Password Expiration Warning Banner (7 days before 2-month expiry) */}
      {showExpiryWarning && (
        <div style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', padding: '10px 20px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 13, color: '#92400e' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <FiAlertTriangle size={16} />
              Your password will expire in {daysLeft} day{daysLeft === 1 ? '' : 's'} (2-month security policy). Please update it to avoid interruption.
            </span>
            {role !== 'admin' && (
              <Link to={`/${role}/profile`} style={{ padding: '5px 12px', borderRadius: 6, background: '#b45309', color: '#fff', fontWeight: 700, fontSize: 12, textDecoration: 'none' }}>
                Update Password
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '28px 24px', maxWidth: 1400, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        {children}
      </main>

      {/* Unified Footer */}
      <footer style={{ background: '#00005c', borderTop: '4px solid #FF9933', padding: '32px 24px 20px', color: '#fff', marginTop: 'auto' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/emblem.png" alt="Emblem" style={{ height: 42, background: '#fff', padding: 4, borderRadius: 8 }} />
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Poppins, sans-serif', color: '#fff', margin: 0 }}>JanSamadhan</h3>
              <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Ministry of Personnel, Public Grievances &amp; Pensions · Government of India</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.12)' }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span>&copy; {new Date().getFullYear()} JanSamadhan — Government of India</span>
            <span>Helpline: 1800-11-0031</span>
            <span>grievance@jansamadhan.gov.in</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
