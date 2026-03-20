'use client';

import Image from 'next/image';
import { api_client } from '@/lib/trpc_app/api_client';
import { ProfileSection } from '@/app/(dashboard)/settings/account/_components/profile_section';

export function ExportAccountStatement() {
  const getMe = api_client.user.getMe.useQuery();
  return (
    <ProfileSection
      title="Data & Privacy"
      description="Export your account statement"
      Icon={<Image width={20} height={20} alt="Export Account Statement" src="/shield.svg" />}
    >
      <div className="grid grid-cols-1 gap-4"></div>
    </ProfileSection>
  );
}
