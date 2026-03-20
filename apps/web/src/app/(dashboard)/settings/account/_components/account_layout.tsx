'use client';

import type { CookiKeys } from '@/lib/constants/cookies';
import { Prefrences } from '@/app/(dashboard)/settings/account/_components/prefrences';
import { NotificationPrefrences } from '@/app/(dashboard)/settings/account/_components/notification_prefrences';
import { ExportAccountStatement } from '@/app/(dashboard)/settings/account/_components/export_account_statement';

interface AccountLayoutProps {
  cookies: Map<CookiKeys, string>;
}

export function AccountLayout({ cookies }: AccountLayoutProps) {
  return (
    <div className="grid w-full max-w-6xl grid-cols-1 gap-6 px-6 py-8 lg:px-8">
      <Prefrences cookies={cookies} />
      <NotificationPrefrences />
      <ExportAccountStatement />
    </div>
  );
}
