import { registerAs } from '@nestjs/config';

export default registerAs('admin', () => ({
  sidebar: [
    {
      id: 'events',
      label: 'Events',
      icon: 'faBell',
      component: '@/app/components/dashboard/AdminEvents',
    },
  ],
}));
