'use client';

import { useAtomValue } from 'jotai';
import { lazy, Suspense, useMemo } from 'react';
import { Bell } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@ui/components';
import { notificationsAtom } from '@/lib/jotai/notification';

const List = lazy(() => import('./notifications'));

export function NotificationDrawer() {
  const notifications = useAtomValue(notificationsAtom);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="relative">
          <Bell className="text-text-secondary size-4 shrink-0 cursor-pointer" />
          {unreadCount > 0 && (
            <span className="bg-primary absolute -top-1 right-0 flex h-2 w-2 items-center justify-center rounded-full" />
          )}
        </div>
      </SheetTrigger>
      <SheetContent
        data-notification="notification"
        data-slot="notification"
        side="right"
        className="bg-bg-elevated text-text-primary sm:w-[270px]- w-4/5 border-transparent p-0 [&>button]:hidden"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Notification</SheetTitle>
          <SheetDescription>Your in-app notifications</SheetDescription>
        </SheetHeader>
        <Suspense fallback={<></>}>
          <List />
        </Suspense>
      </SheetContent>
    </Sheet>
  );
}
