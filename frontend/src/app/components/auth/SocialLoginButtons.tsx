'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faFacebookF } from '../../icons';
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
  const handleGoogleLogin = () => {
    // Opens OAuth popup for Google
    window.open('/auth/google', 'GoogleLogin', popupOptions);
  };
  const handleFacebookLogin = () => {
    // Opens OAuth popup for Facebook
    window.open('/auth/facebook', 'FacebookLogin', popupOptions);
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
        <Button
          {...sharedButtonProps}
          onClick={handleGoogleLogin}
          leftIcon={<FontAwesomeIcon icon={faGoogle} className={iconClass} />}
          aria-label="Continue with Google"
        >
          Google
        </Button>
        <Button
          {...sharedButtonProps}
          onClick={handleFacebookLogin}
          leftIcon={
            <FontAwesomeIcon icon={faFacebookF} className={iconClass} />
          }
          aria-label="Continue with Facebook"
        >
          Facebook
        </Button>
      </div>
    </div>
  );
}
