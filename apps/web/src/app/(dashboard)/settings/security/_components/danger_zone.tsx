'use client';

import { Trash2, TriangleAlert } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  toast,
} from '@ui/components';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DangerZone() {
  const handleDelete = () => {
    // TODO: wire up API call (packages/trpc_app/src/routers/auth.ts → deleteAccount)
    toast.info('Coming soon', { description: 'Account deletion will be available soon.' });
  };

  return (
    <div className="rounded-card border border-red-500/20 bg-red-500/[0.02] p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Icon */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
          <TriangleAlert className="size-5 text-red-400" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-text-primary mb-1 text-sm font-semibold uppercase tracking-wider">
            Danger Zone
          </h3>
          <p className="text-text-secondary mb-5 text-sm leading-relaxed">
            Permanently deletes your account, all financial records, and revokes every active
            session. This action <strong className="text-text-primary">cannot be undone</strong>.
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-3.5" />
                Delete Account
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogMedia className="bg-red-500/10">
                  <TriangleAlert className="size-7 text-red-400" />
                </AlertDialogMedia>
                <AlertDialogTitle>Delete account permanently?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately delete your account, all financial records, and revoke all
                  active sessions. There is no recovery path.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Yes, delete my account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
