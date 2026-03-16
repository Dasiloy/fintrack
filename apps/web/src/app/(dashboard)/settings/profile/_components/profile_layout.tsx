'use client';

import { Bio } from '@/app/(dashboard)/settings/profile/_components/bio';
import { History } from '@/app/(dashboard)/settings/profile/_components/history';
import { Card } from '@ui/components';

export function ProfileLayout() {
  return (
    <div className="gris-cols-1 grid gap-8 px-6 pt-6 lg:px-8">
      {/** Top Sectiuon */}
      <div className="grid h-full grid-cols-1 gap-8 md:grid-cols-[0.4fr_1fr]">
        {/**Left */}
        <Bio />
        {/**Right */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Card> hello</Card>
          <Card> hello</Card>
          <Card> hello</Card>
          <Card> hello</Card>
        </div>
      </div>

      {/** Bottom Sectiuon */}
      <History />
    </div>
  );
}
