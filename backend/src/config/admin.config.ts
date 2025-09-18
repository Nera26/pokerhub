import { registerAs } from '@nestjs/config';

export default registerAs('admin', () => ({
  sidebar: [
    {
      id: 'events',
      label: 'Events',
      icon: 'faBell',
      component: '@/app/components/dashboard/AdminEvents',
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: 'faMoneyBillWave',
      component: '@/app/components/dashboard/transactions/TransactionHistory',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'faChartLine',
      component: '@/app/components/dashboard/analytics/Analytics',
    },
    {
      id: 'feature-flags',
      label: 'Feature Flags',
      icon: 'faToggleOn',
      component: '@/app/components/dashboard/FeatureFlagsPanel',
    },
    {
      id: 'broadcast',
      label: 'Broadcasts',
      icon: 'faBullhorn',
      component: '@/app/components/dashboard/BroadcastPanel',
    },
  ],
}));
