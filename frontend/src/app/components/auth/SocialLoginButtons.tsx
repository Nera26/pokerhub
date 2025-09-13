'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebookF } from '@fortawesome/free-brands-svg-icons';
import { useQuery } from '@tanstack/react-query';
import type { AuthProvidersResponse } from '@shared/types';
import { fetchAuthProviders } from '@/lib/api/auth';
import Button, { type ButtonProps } from '../ui/Button';

const popupOptions = 'width=500,height=600';
const sharedButtonProps: Pick<
  ButtonProps,
  'variant' | 'fullWidth' | 'className'
> = {
  variant: 'secondary',
  fullWidth: true,
  className: 'text-body-sm font-medium',
};
const iconClass = 'text-xl';

export default function SocialLoginButtons() {
  const { data, isLoading, error } = useQuery<AuthProvidersResponse>({
    queryKey: ['auth', 'providers'],
    queryFn: ({ signal }) => fetchAuthProviders({ signal }),
  });

  if (isLoading) return <div>Loading providers...</div>;
  if (error) return <div>Error loading providers</div>;

  const icons: Record<string, any> = {
    google: faGoogle,
    facebook: faFacebookF,
  };

  return (
    <div className="mt-8">
      <div className="relative flex items-center py-3">
        <div className="flex-grow border-t border-border-dark" />
        <span className="mx-4 text-subtext text-text-secondary">
          Or continue with
        </span>
        <div className="flex-grow border-t border-border-dark" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {data?.map((provider) => {
          const icon = icons[provider.name];
          return (
            <Button
              {...sharedButtonProps}
              key={provider.name}
              onClick={() =>
                window.open(
                  provider.url,
                  `${provider.label}Login`,
                  popupOptions,
                )
              }
              leftIcon={
                icon ? (
                  <FontAwesomeIcon icon={icon} className={iconClass} />
                ) : undefined
              }
              aria-label={`Continue with ${provider.label}`}
            >
              {provider.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
