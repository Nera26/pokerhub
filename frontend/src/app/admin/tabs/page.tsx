'use client';

import AdminCrudPage from '@/components/dashboard/common/admin-crud-page';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { createAdminTabCrudConfig } from '@/app/admin/shared/adminCrudConfigs';

export default function AdminTabsPage() {
  useRequireAdmin();
  return <AdminCrudPage {...createAdminTabCrudConfig()} />;
}
