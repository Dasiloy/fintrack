'use client';

import React, { lazy, Suspense } from 'react';
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
  Button,
  Text,
  Skeleton,
  ProfileUploader,
  toast,
} from '@ui/components';
import { SkeletonWrapper } from '@ui/components/shared';
import { useBoolean } from '@ui/hooks';
import { CheckCircle2Icon } from 'lucide-react';
import { getName, getUsername } from '@/utils/helpers';
import { api_client } from '@/lib/trpc_app/api_client';
import { cn } from '@ui/lib/utils';
import { fileToBase64 } from '@fintrack/utils/file';

// lazy laod modal for better performance
const BioModal = lazy(() =>
  import('@/app/(dashboard)/settings/profile/_components/bio_modal').then((module) => ({
    default: module.BioModal,
  })),
);

// =================================\
// Main Component
// =================================\
export function Bio() {
  const { data, isPending } = api_client.user.getMe.useQuery();
  const user = React.useMemo(() => data?.data, [data])!;

  // states
  const [isOpen, { on, off }] = useBoolean();
  const [profileImage, setProfileImage] = React.useState<File | null>(null);

  // mutations
  const utils = api_client.useUtils();
  const updateProfileImage = api_client.user.updateProfileImage.useMutation({
    onSuccess: () => {
      utils.user.getMe.invalidate();
      toast.success('Profile image updated', {
        description: 'Your profile image has been updated',
      });
      setProfileImage(null);
    },
    onError: (error) => {
      toast.error('Failed to update profile image', {
        description: error.message,
      });
    },
  });

  // handlers
  const handleUpdateProfileImage = React.useCallback(async () => {
    if (!profileImage) {
      toast.error('No profile image selected', {
        description: 'Please select a profile image to update',
      });
      return;
    }

    const base64 = await fileToBase64(profileImage);
    updateProfileImage.mutate({
      base64,
      mimeType: profileImage.type,
      fileName: profileImage.name,
      size: profileImage.size,
    });
  }, [profileImage, updateProfileImage]);

  return (
    <React.Fragment>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardAction>
            <Button size="xs" variant={'secondary'} onClick={on}>
              Edit Profile
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="flex flex-col gap-8">
          <div className="grid grid-cols-[auto_1fr] items-center gap-6">
            <ProfileUploader
              src={user?.avatar}
              alt={getName(user)}
              file={profileImage}
              onSelect={setProfileImage}
              className="size-32"
              loading={updateProfileImage.isPending}
              onUpload={handleUpdateProfileImage}
            />

            <div
              className={cn('flex flex-col', {
                'gap-1': !isPending,
                'gap-3': isPending,
              })}
            >
              <SkeletonWrapper loading={isPending} className="h-space-5 w-auto max-w-[200px]">
                <Text variant={'body-lg'} className="font-bold">
                  {getName(user)}
                </Text>
              </SkeletonWrapper>
              <SkeletonWrapper loading={isPending} className="h-space-5 w-auto max-w-[150px]">
                <Text variant={'body-sm'} color="tertiary">
                  {`@${getUsername(user)}`}
                </Text>
              </SkeletonWrapper>

              <SkeletonWrapper loading={isPending} className="h-space-5 w-auto max-w-[100px]">
                <Badge variant={'default'} className="mt-space-2">
                  <CheckCircle2Icon className="text-primary size-4" />
                  Verified Identity
                </Badge>
              </SkeletonWrapper>
            </div>
          </div>
          {/** bio names */}
          <div className="grid grid-cols-1 gap-6">
            {/** label / value */}
            <div className="flex flex-col gap-1">
              <Text variant={'caption'} color="secondary" className="font-bold">
                FLLNAME
              </Text>
              <SkeletonWrapper loading={isPending} className="h-space-5 w-auto max-w-[200px]">
                <Text variant={'body'} className="font-medium">
                  {getName(user)}
                </Text>
              </SkeletonWrapper>
            </div>
            {/** label / value */}
            <div className="flex flex-col gap-1">
              <Text variant={'caption'} color="secondary">
                USERNAME
              </Text>
              <SkeletonWrapper loading={isPending} className="h-space-5 w-auto max-w-[150px]">
                <Text variant={'body'}>{`@${getUsername(user)}`}</Text>
              </SkeletonWrapper>
            </div>
            {/** label / value */}
            <div className="flex flex-col gap-1">
              <Text variant={'caption'} color="secondary">
                EMAIL
              </Text>
              <SkeletonWrapper loading={isPending} className="h-space-5 w-auto max-w-[200px]">
                <Text variant={'body'}>{user?.email ?? ''}</Text>
              </SkeletonWrapper>
            </div>
          </div>
        </CardContent>
      </Card>
      <Suspense fallback={<></>}>
        <BioModal user={user as any} isOpen={isOpen} off={off} />
      </Suspense>
    </React.Fragment>
  );
}
