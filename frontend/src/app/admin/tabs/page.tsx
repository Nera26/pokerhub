'use client';

import AdminCrudPage from '@/app/components/dashboard/common/AdminCrudPage';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { createAdminTabCrudConfig } from '@/app/admin/shared/adminCrudConfigs';

export default function AdminTabsPage() {
  useRequireAdmin();
  return <AdminCrudPage {...createAdminTabCrudConfig()} />;
}
