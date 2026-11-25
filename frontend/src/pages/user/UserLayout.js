import React from 'react';
import { Outlet } from 'react-router-dom';
import SharedLayout from '../../components/layout/SharedLayout';

const userNavItems = [
  { path: '/user', icon: '🏠', label: 'Dashboard' },
  { path: '/user/file-complaint', icon: '✍️', label: 'File Complaint' },
  { path: '/user/complaints', icon: '📋', label: 'My Complaints' },
  { path: '/user/delivery', icon: '📦', label: 'Request Delivery' },
  { path: '/user/centers', icon: '📍', label: 'Physical Centers' },
  { path: '/user/notifications', icon: '🔔', label: 'Notifications' },
  { path: '/user/profile', icon: '👤', label: 'My Profile' },
];

export default function UserLayout() {
  return (
    <SharedLayout navItems={userNavItems} role="user">
      <Outlet />
    </SharedLayout>
  );
}
