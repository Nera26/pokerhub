'use client';

import AdminCrudPage from '@/app/components/dashboard/common/AdminCrudPage';
import { useRequireAdmin } from '@/hooks/useRequireAdmin';
import { createNavCrudConfig } from '@/app/admin/shared/adminCrudConfigs';

export default function NavAdminPage() {
  useRequireAdmin();
  return <AdminCrudPage {...createNavCrudConfig()} />;
}
