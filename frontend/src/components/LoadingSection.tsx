import { cn } from '@/app/lib/utils';

interface LoadingSectionProps {
  className?: string;
  buttonClassName?: string;
}

export default function LoadingSection({
  className,
  buttonClassName,
}: LoadingSectionProps) {
  return (
    <div className={cn('flex gap-4', className)}>
      <div className={cn('h-10 w-40 bg-card-bg rounded-xl', buttonClassName)} />
      <div className={cn('h-10 w-40 bg-card-bg rounded-xl', buttonClassName)} />
    </div>
  );
}
