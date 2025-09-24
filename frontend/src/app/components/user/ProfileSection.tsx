'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe } from '@fortawesome/free-solid-svg-icons/faGlobe';
import { faPencil } from '@fortawesome/free-solid-svg-icons/faPencil';
import Tooltip from '../ui/Tooltip';
import { Button } from '../ui/Button';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { fetchTiers } from '@/lib/api/tiers';
import { computeTierProgress } from '@/lib/tierProgress';
import type { Tier, UserProfile } from '@shared/types';

interface Props {
  profile: UserProfile;
  onEdit(): void;
}

function useTiers() {
  return useQuery<Tier[]>({
    queryKey: ['tiers'],
    queryFn: ({ signal }) => fetchTiers({ signal }),
  });
}

export default function ProfileSection({ profile, onEdit }: Props) {
  const { data: tiers = [], isLoading, isError } = useTiers();
  const progress =
    !isError && tiers.length
      ? computeTierProgress(tiers, profile.experience)
      : null;
  const showProgress = Boolean(progress) && !isLoading;
  const nextExp = progress ? progress.next : profile.experience;

  return (
    <section className="bg-card-bg rounded-2xl p-8 mb-8 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-transform duration-200">
      <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
        {/* Avatar + user info */}
        <div className="flex-shrink-0 relative flex flex-col items-center md:items-start mb-6 md:mb-0">
          <Tooltip text="Click to edit avatar" wrapperProps={{ tabIndex: -1 }}>
            <button
              onClick={onEdit}
              aria-label="Edit avatar"
              className="w-32 h-32 rounded-full border-4 border-accent-yellow shadow-lg cursor-pointer"
            >
              <Image
                src={profile.avatarUrl}
                alt={`${profile.username} avatar`}
                width={128}
                height={128}
                sizes="128px"
                className="w-32 h-32 rounded-full"
              />
            </button>
          </Tooltip>

          <button
            onClick={onEdit}
            className="text-2xl font-bold mt-4 cursor-pointer"
            role="heading"
            aria-level={1}
          >
            {profile.username}
          </button>
          <p className="text-text-secondary text-sm mt-1">{profile.email}</p>
          <p className="text-text-secondary text-sm mt-1">
            Bank: {profile.bank}
          </p>
          <p className="text-text-secondary flex items-center mt-1 text-sm">
            <FontAwesomeIcon
              icon={faGlobe}
              className="mr-2 text-accent-yellow"
            />
            {profile.location}
          </p>
          <p className="text-text-secondary text-xs mt-1">
            Joined:{' '}
            {new Date(profile.joined).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-text-secondary text-sm mt-3 max-w-xs text-center md:text-left italic">
            "{profile.bio}"
          </p>

          {/* Tier & EXP bar */}
          <p className="mt-1 flex items-center">
            Tier:
            {showProgress ? (
              <span className="inline-block bg-accent-yellow text-primary-bg font-semibold py-1 px-3 rounded-full text-sm ml-2">
                {progress.name}
              </span>
            ) : isLoading ? (
              <span className="ml-2 text-text-secondary text-sm">
                Loading tiers...
              </span>
            ) : (
              <span className="ml-2 text-text-secondary text-sm">
                Tier data unavailable
              </span>
            )}
          </p>
          {showProgress ? (
            <>
              <div className="w-full bg-border-dark rounded-full h-3 mt-2 overflow-hidden">
                <div
                  className="h-full bg-accent-green"
                  data-testid="tier-progress-bar"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <p className="text-text-secondary text-xs mt-1">
                EXP: {progress.current.toLocaleString()} /{' '}
                {nextExp.toLocaleString()}
              </p>
            </>
          ) : null}
        </div>

        {/* Balance & action buttons */}
        <div className="flex-grow flex flex-col md:items-end space-y-6">
          <button
            type="button"
            className="w-full md:w-auto text-center md:text-right tooltip"
            onClick={onEdit}
          >
            <p className="uppercase text-text-secondary text-sm tracking-wider">
              Current Balance
            </p>
            <p className="text-4xl font-bold text-accent-yellow mt-1">
              {profile.balance.toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
              })}
            </p>
            <span className="tooltip-text">View Transaction History</span>
          </button>
          <Button variant="outline" className="cursor-pointer" onClick={onEdit}>
            <FontAwesomeIcon icon={faPencil} className="mr-2" /> Edit Profile
          </Button>
        </div>
      </div>
    </section>
  );
}
