'use client';

import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Button,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  toast,
} from '@ui/components';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { User } from '@fintrack/database/types';
import { useEffect } from 'react';
import { api_client } from '@/lib/trpc_app/api_client';
import { ServerFormatter } from '@fintrack/utils/server';

const scheam = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
});

type SchemaType = z.infer<typeof scheam>;

export function BioModal({ user, isOpen, off }: { user: User; isOpen: boolean; off: () => void }) {
  const form = useForm<SchemaType>({
    resolver: zodResolver(scheam),
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  const onOpenChange = (open: boolean) => {
    if (!open) {
      off();
      form.reset();
    }
  };

  const utils = api_client.useUtils();
  const updateProfile = api_client.user.updateMe.useMutation({
    onSuccess: () => {
      utils.user.getMe.invalidate();
      off();
      toast.success('Profile updated successfully', {
        description: 'Your profile has been updated successfully',
      });
      form.reset();
    },
    onError: (error) => {
      toast.error('An error occured', {
        description: ServerFormatter.formatError(error),
      });
    },
  });
  const onUpdate = () => {
    updateProfile.mutate({
      firstName: form.getValues('firstName'),
      lastName: form.getValues('lastName'),
      avatar: undefined,
      language: undefined,
      currency: undefined,
      dateFormat: undefined,
    });
  };

  useEffect(() => {
    if (isOpen) {
      form.reset({
        firstName: user?.firstName ?? '',
        lastName: user?.lastName ?? '',
      });
    }
  }, [user, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Edit your profile information.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onUpdate)}>
          <FieldGroup>
            <Field>
              <FieldLabel>First Name</FieldLabel>
              <Input type="text" {...form.register('firstName')} placeholder="First Name" />
            </Field>
            <Field>
              <FieldLabel>Last Name</FieldLabel>
              <Input type="text" {...form.register('lastName')} placeholder="Last Name" />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" disabled={updateProfile.isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              loading={updateProfile.isPending}
              disabled={updateProfile.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
