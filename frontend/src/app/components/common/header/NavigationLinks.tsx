import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons/faWallet';
import { faTags } from '@fortawesome/free-solid-svg-icons/faTags';
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface NavigationLinksProps {
  balance: string;
  avatarUrl?: string;
}

const DEFAULT_AVATAR =
  'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

export default function NavigationLinks({
  balance,
  avatarUrl = DEFAULT_AVATAR,
}: NavigationLinksProps) {
  const { data } = useFeatureFlags();
  const flags = data ?? { promotions: false, leaderboard: false };
  return (
    <>
      <Link
        href="/profile"
        prefetch
        className="flex items-center text-text-secondary hover:text-accent-yellow transition-colors duration-200"
      >
        <Image
          src={avatarUrl}
          alt="User Avatar"
          width={32}
          height={32}
          sizes="32px"
          className="w-8 h-8 rounded-full mr-2 border-2 border-accent-yellow"
        />
        <span>Profile</span>
      </Link>

      <Link
        href="/wallet"
        prefetch
        className="text-text-secondary hover:text-accent-yellow transition-colors duration-200 flex items-center"
        aria-label="Wallet"
      >
        <FontAwesomeIcon icon={faWallet} className="mr-2" />
        <span className="font-semibold">{balance}</span>
      </Link>

      {flags.promotions && (
        <Link
          href="/promotions"
          prefetch
          className="text-text-secondary hover:text-accent-yellow transition-colors duration-200 flex items-center"
        >
          <FontAwesomeIcon icon={faTags} className="mr-2" />
          <span>Promotions</span>
        </Link>
      )}

      {flags.leaderboard && (
        <Link
          href="/leaderboard"
          prefetch
          className="text-text-secondary hover:text-accent-yellow transition-colors duration-200 flex items-center"
        >
          <FontAwesomeIcon icon={faTrophy} className="mr-2" />
          <span>Leaderboard</span>
        </Link>
      )}
    </>
  );
}
