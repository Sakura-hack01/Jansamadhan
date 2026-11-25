import React from 'react';
import { Outlet } from 'react-router-dom';
import SharedLayout from '../../components/layout/SharedLayout';

const adminNavItems = [
  { path: '/admin', icon: '📊', label: 'Dashboard' },
  { path: '/admin/complaints', icon: '📋', label: 'All Complaints' },
  { path: '/admin/users', icon: '👥', label: 'Users' },
  { path: '/admin/departments', icon: '🏢', label: 'Departments' },
  { path: '/admin/delivery', icon: '📦', label: 'Delivery Orders' },
  { path: '/admin/reports', icon: '📈', label: 'Reports & Analytics' },
  { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
];

export default function AdminLayout() {
  return (
    <SharedLayout navItems={adminNavItems} role="admin">
      <Outlet />
    </SharedLayout>
  );
}
