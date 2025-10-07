import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import type { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export default function SearchInput({
  containerClassName,
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className={twMerge('relative', containerClassName)}>
      <FontAwesomeIcon
        icon={faSearch}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
      />
      <input
        {...props}
        className={twMerge(
          'w-full bg-primary-bg border border-dark rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary focus:border-accent-yellow focus:outline-none',
          className,
        )}
      />
    </div>
  );
}
