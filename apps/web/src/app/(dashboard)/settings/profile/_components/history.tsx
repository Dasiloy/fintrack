'use client';

import React from 'react';
import { api_client } from '@/lib/trpc_app/api_client';
import {
  Button,
  Card,
  CardAction,
  CardHeader,
  CardTitle,
  Progress,
  Separator,
  SkeletonWrapper,
  Text,
  toast,
} from '@ui/components';
import { CheckCircle2 } from 'lucide-react';
import { useCsv, useIsMobile } from '@ui/hooks';
import dayjs from '@fintrack/utils/date';
import type { Session } from '@fintrack/database/types';
import { UiSession } from '@/app/(dashboard)/settings/_components/session';
import { flattenObject } from '@fintrack/utils/format';

// Helpers
const getSecurityScore = ({
  hasTwoFactor,
  hasBackupCodes,
  hasPassword,
}: {
  hasTwoFactor: boolean;
  hasBackupCodes: boolean;
  hasPassword: boolean;
}) => {
  let score = 40;
  if (hasPassword) {
    score += 20;
  }
  if (hasTwoFactor) {
    score += 20;
  }
  if (hasBackupCodes) {
    score += 20;
  }
  return score;
};

// ==================================
// MAIN COMPONENT
// ==================================
export function History() {
  // custom hooks
  const isMobile = useIsMobile();

  const { downloadCsv, isDownloading } = useCsv('profile.csv');

  // queries
  const twoFaData = api_client.auth.get2fa.useQuery();
  const sessionHistoryData = api_client.auth.getSessions.useQuery({ take: 1 });
  const { data, isPending } = api_client.user.getMe.useQuery();

  // memoized data
  const user = React.useMemo(() => (data?.data ? data.data : null), [data]);
  const hasTwoFactor = React.useMemo(
    () => twoFaData?.data?.data?.twoFactorEnabled ?? false,
    [twoFaData],
  );
  const hasBackupCodes = React.useMemo(() => {
    if (!twoFaData?.data?.data?.codeLeft) return false;
    return twoFaData?.data?.data?.codeLeft > 0;
  }, [twoFaData]);
  const hasPassword = React.useMemo(() => twoFaData?.data?.data?.hasPassword ?? false, [user]);
  const sessionHistory = React.useMemo(
    () => sessionHistoryData?.data?.data ?? [],
    [sessionHistoryData],
  );

  const downloadProfileCsv = async () => {
    const flattenedUser = flattenObject(user ?? {});
    const data = Object.entries(flattenedUser).map(([key, value]) => ({
      label: key,
      value: value as string,
    }));
    try {
      await downloadCsv(data);
    } catch (error) {
      toast.error('Failed to download profile CSV');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
        <CardAction>
          <Button
            size="xs"
            variant={'secondary'}
            onClick={downloadProfileCsv}
            loading={isDownloading}
            disabled={isPending || isDownloading}
          >
            Export CSV
          </Button>
        </CardAction>
      </CardHeader>

      <Separator />
      <div className="flex flex-col md:min-h-32 md:flex-row">
        {/** TIER */}
        <div className="p-space-6 xl:p-space-8 flex-1">
          <SkeletonWrapper loading={isPending} className="mb-space-2 h-5 w-auto max-w-4/5">
            <Text color={'tertiary'} variant={'caption'} className="mb-space-2 font-bold">
              CURRENT TIER
            </Text>
          </SkeletonWrapper>
          <SkeletonWrapper loading={isPending} className="mb-space-2 h-5 w-auto max-w-full">
            <div className="mb-space-2 flex items-center gap-2">
              <Text variant={'h1'} color="primary" className="font-bold">
                {user?.subscription?.plan}
              </Text>
              <Text variant={'body'} color="tertiary">
                {user?.subscription?.plan === 'FREE' ? 'Free Account' : 'Monthly Member'}
              </Text>
            </div>
          </SkeletonWrapper>
          <SkeletonWrapper loading={isPending} className="h-5 w-auto max-w-3/5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-success size-4" />
              <Text variant={'body-sm'} color="success">
                Active until{' '}
                {user?.subscription?.stripeCurrentPeriodEnd
                  ? dayjs(user.subscription.stripeCurrentPeriodEnd).format('dddd, MMMM DD YYYY')
                  : '...'}
              </Text>
            </div>
          </SkeletonWrapper>
        </div>
        <Separator orientation={isMobile ? 'horizontal' : 'vertical'} />
        {/** SECURITY */}
        <div className="p-space-6 xl:p-space-8 flex-1">
          <SkeletonWrapper loading={twoFaData.isPending} className="mb-4.5 h-5 w-auto max-w-4/5">
            <Text color={'tertiary'} variant={'caption'} className="mb-4.5 font-bold">
              SECURITY STATUS
            </Text>
          </SkeletonWrapper>
          <SkeletonWrapper
            loading={twoFaData.isPending}
            className="mb-space-4 h-5 w-auto max-w-4/5"
          >
            {' '}
            <div className="mb-space-4 flex items-center gap-2">
              <Progress
                value={getSecurityScore({
                  hasTwoFactor,
                  hasBackupCodes,
                  hasPassword,
                })}
                max={100}
              />
              <Text variant={'body-sm'} color="secondary">
                {getSecurityScore({
                  hasTwoFactor,
                  hasBackupCodes,
                  hasPassword,
                })}
                %
              </Text>
            </div>
          </SkeletonWrapper>
          <SkeletonWrapper
            loading={twoFaData.isPending}
            className="mb-space-2 h-5 w-auto max-w-4/5"
          >
            <Text color={'secondary'} variant={'body-sm'} className="font-bold">
              Complete 2FA to reach 100% security score.
            </Text>
          </SkeletonWrapper>
        </div>
        <Separator orientation={isMobile ? 'horizontal' : 'vertical'} />
        {/** LAST LOGIN */}
        <div className="p-space-6 xl:p-space-8 flex-1">
          <SkeletonWrapper
            loading={sessionHistoryData.isPending}
            className="mb-space-2 h-5 w-auto max-w-4/5"
          >
            <Text color={'tertiary'} variant={'caption'} className="mb-space-2 font-bold">
              LAST LOGIN
            </Text>
          </SkeletonWrapper>

          <SkeletonWrapper loading={sessionHistoryData.isPending} className="mb-space-4 h-6 w-full">
            {sessionHistory.length && <UiSession session={sessionHistory[0] as Session} />}
          </SkeletonWrapper>
        </div>
      </div>
    </Card>
  );
}
