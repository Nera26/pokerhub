import dynamic from 'next/dynamic';

const LoginPage = dynamic(() => import('@/features/login'), {
  loading: () => <div>Loading...</div>,
});

export default LoginPage;
