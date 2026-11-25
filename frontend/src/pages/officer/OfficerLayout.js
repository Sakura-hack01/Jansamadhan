// OfficerLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import SharedLayout from '../../components/layout/SharedLayout';

const officerNavItems = [
  { path: '/officer', icon: '📊', label: 'Dashboard' },
  { path: '/officer/complaints', icon: '📋', label: 'My Complaints' },
  { path: '/officer/delivery', icon: '📦', label: 'Deliveries' },
  { path: '/officer/notifications', icon: '🔔', label: 'Notifications' },
  { path: '/officer/profile', icon: '👤', label: 'Profile' },
];

export function OfficerLayout() {
  return (
    <SharedLayout navItems={officerNavItems} role="officer">
      <Outlet />
    </SharedLayout>
  );
}

export default OfficerLayout;
