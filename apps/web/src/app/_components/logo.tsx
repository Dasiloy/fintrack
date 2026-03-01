import { cn } from '@ui/lib/utils/cn';
import Link from 'next/link';
import Image from 'next/image';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';

interface LogoProps {
  isPro?: boolean;
  showPlan?: boolean;
  className?: string;
}

export function Logo({ isPro, showPlan, className }: LogoProps) {
  return (
    <Link href={STATIC_ROUTES.HOME} className={cn('flex items-center gap-2', className)}>
      <div className="bg-primary shadow-glow flex size-8 shrink-0 items-center justify-center rounded-lg">
        <Image
          src="/logo-icon-white.png"
          alt="FinTrack"
          width={18}
          height={18}
          priority
          className="h-[18px] w-auto"
        />
      </div>
      <div className="grid flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
        <span className="font-manrope text-text-primary text-sm font-semibold">FinTrack</span>
        {showPlan && (
          <span className="text-text-tertiary text-[10px]">{isPro ? 'Pro' : 'Free plan'}</span>
        )}
      </div>
    </Link>
  );
}
