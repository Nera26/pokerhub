'use client';

import AdminCrudPage from '@/components/dashboard/common/admin-crud-page';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { createNavCrudConfig } from '@/app/admin/shared/adminCrudConfigs';

export default function NavAdminPage() {
  useRequireAdmin();
  return <AdminCrudPage {...createNavCrudConfig()} />;
}
