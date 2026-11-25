/**
 * Role-Based Access Control (RBAC) Utilities
 * Handles permissions for Head Administrator / Super Admin vs Staff / Regular Admin.
 */

export const isHeadAdmin = (admin?: { role?: string; adminId?: string } | null): boolean => {
  if (!admin) return false;
  const role = (admin.role || '').toLowerCase().trim();
  const id = (admin.adminId || '').toUpperCase().trim();
  return (
    id === 'ADM-2026-001' ||
    role.includes('head') ||
    role.includes('chief') ||
    role.includes('super') ||
    role.includes('master')
  );
};
