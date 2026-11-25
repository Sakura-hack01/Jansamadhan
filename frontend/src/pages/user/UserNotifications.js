import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const typeIcons = {
  complaint_update: '📋',
  complaint_assigned: '👔',
  complaint_resolved: '✅',
  complaint_rejected: '❌',
  delivery_update: '📦',
  system: '🔔',
  reminder: '⏰',
  escalation: '⚠️',
};

export default function UserNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=50');
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((p) => Math.max(0, p - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read.');
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success('Deleted.');
    } catch {}
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div style={{ maxWidth: 740, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#000080', fontFamily: 'Poppins, sans-serif' }}>
            🔔 Notifications
            {unreadCount > 0 && <span style={{ fontSize: 13, fontWeight: 700, marginLeft: 10, padding: '3px 10px', borderRadius: 999, background: '#dc2626', color: '#fff' }}>{unreadCount} unread</span>}
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>{notifications.length} total notifications</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ padding: '10px 18px', borderRadius: 10, background: '#fff', border: '1px solid #cbd5e1', color: '#000080', fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
            Mark All Read
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          [1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', border: '1px solid #cbd5e1', borderRadius: 16, color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🔔</div>
            <p style={{ fontSize: 15 }}>No notifications yet</p>
          </div>
        ) : notifications.map((n) => (
          <div
            key={n._id}
            onClick={() => !n.isRead && markRead(n._id)}
            style={{
              background: n.isRead ? '#fff' : '#eff6ff',
              border: `1px solid ${n.isRead ? '#cbd5e1' : '#93c5fd'}`,
              borderRadius: 14,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              cursor: n.isRead ? 'default' : 'pointer',
              position: 'relative',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
              {typeIcons[n.type] || '🔔'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ fontSize: 14, fontWeight: n.isRead ? 600 : 700, color: '#0f172a' }}>{n.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>{timeAgo(n.createdAt)}</span>
                  <button onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 14, padding: '2px 5px' }}>✕</button>
                </div>
              </div>
              <div style={{ fontSize: 13.5, color: '#475569' }}>{n.message}</div>
            </div>
            {!n.isRead && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#000080', position: 'absolute', top: 16, left: 8 }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
