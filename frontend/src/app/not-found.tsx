import Link from 'next/link';
import Button from './components/ui/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons/faWallet';
import { faTags } from '@fortawesome/free-solid-svg-icons/faTags';
import { faTrophy } from '@fortawesome/free-solid-svg-icons/faTrophy';
import { faBell } from '@fortawesome/free-solid-svg-icons/faBell';
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import Image from 'next/image';
// The previous import attempted to use `faCompassSlash`, which is not
// available in the free FontAwesome icon set and caused the build to fail.
// Use the standard `faCompass` icon instead.
import { faCompass } from '@fortawesome/free-solid-svg-icons/faCompass';

export default function NotFound() {
  return (
    <>
      {/* Distinct header for 404 (no common Header component) */}
      <header id="header" className="bg-card-bg sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <Image
                className="h-10 w-auto"
                src="/pokerhub-logo.svg"
                alt="PokerHub logo"
                width={40}
                height={40}
                sizes="40px"
              />
              <span className="ml-3 text-2xl font-bold text-accent-yellow">
                PokerHub
              </span>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <button
                type="button"
                aria-label="Profile"
                className="flex items-center text-text-secondary hover:text-accent-yellow transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
              >
                <Image
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg"
                  alt=""
                  role="presentation"
                  width={32}
                  height={32}
                  sizes="32px"
                  className="w-8 h-8 rounded-full mr-2 border-2 border-accent-yellow"
                />
                <span aria-hidden="true">Profile</span>
              </button>
              <button
                type="button"
                aria-label="Wallet balance $1,250.00"
                className="text-text-secondary hover:text-accent-yellow transition-colors duration-200 flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
              >
                <FontAwesomeIcon
                  icon={faWallet}
                  className="mr-1"
                  aria-hidden="true"
                />
                <span aria-hidden="true">$1,250.00</span>
              </button>
              <button
                type="button"
                className="text-text-secondary hover:text-accent-yellow transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
              >
                <FontAwesomeIcon icon={faTags} className="mr-1" />
                <span>Promotions</span>
              </button>
              <button
                type="button"
                className="text-text-secondary hover:text-accent-yellow transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
              >
                <FontAwesomeIcon icon={faTrophy} className="mr-1" />
                <span>Leaderboard</span>
              </button>
              <button
                type="button"
                aria-label="Notifications"
                className="relative text-text-secondary hover:text-accent-yellow transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
              >
                <FontAwesomeIcon
                  icon={faBell}
                  className="text-xl"
                  aria-hidden="true"
                />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-red text-xs text-white">
                  3
                </span>
              </button>
            </nav>
            <div className="md:hidden">
              <button
                id="mobile-menu-button"
                aria-label="Open navigation menu"
                title="Open navigation menu"
                className="text-text-secondary hover:text-accent-yellow focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow rounded"
              >
                <FontAwesomeIcon icon={faBars} className="text-2xl" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 404 Content */}
      <main
        id="main-content"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-32"
      >
        <section className="min-h-[calc(80vh-80px)] flex flex-col items-center justify-center text-center">
          <div className="bg-card-bg p-8 sm:p-12 rounded-2xl shadow-xl max-w-lg w-full">
            <FontAwesomeIcon
              icon={faCompass}
              className="text-6xl sm:text-7xl text-danger-red mb-6"
            />
            <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
              404
            </h1>
            <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary mb-4">
              Oops! Page Not Found
            </h2>
            <p className="text-text-secondary text-base sm:text-lg mb-8">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved.
            </p>
            <Link href="/" prefetch>
              <Button
                variant="primary"
                className="font-bold py-3 px-8 rounded-xl hover:brightness-110 hover-glow-green transition-colors duration-200 text-base sm:text-lg uppercase"
              >
                Go to Homepage
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
