'use client';

import { lazy, Suspense } from 'react';
import { Bell } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@ui/components';

const List = lazy(() => import('./notifications'));

export function NotificationDrawer() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Bell className="text-text-secondary size-4 shrink-0 cursor-pointer" />
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
