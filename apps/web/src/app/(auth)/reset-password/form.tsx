'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { cn } from '@ui/lib/utils';
import {
  Button,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  PasswordInput,
  toast,
} from '@ui/components';
import { useRouter } from 'next/navigation';
import { ServerFormatter } from '@fintrack/utils/server';
import { axiosClient } from '@/lib/axios/axios_client';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { useBoolean } from '@ui/hooks';

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .refine((v) => /[a-z]/.test(v), 'Must contain a lowercase letter')
      .refine((v) => /[A-Z]/.test(v), 'Must contain an uppercase letter')
      .refine((v) => /\d/.test(v), 'Must contain a number')
      .refine((v) => /[@$!%*?&]/.test(v), 'Must contain a special characters'),
    confirmNewPassword: z.string().min(8).max(20),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'Passwords do not match',
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm({ className }: React.ComponentProps<'form'>) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useBoolean(false);
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    try {
      setIsLoading.on();
      await axiosClient.post('/proxy-auth/reset-password', values);

      toast.success('Password created', {
        description: 'Redirecting to login',
      });
      router.push(AUTH_ROUTES.LOGIN);
    } catch (error) {
      console.error(error);
      toast.error('An error occured!', {
        description: ServerFormatter.formatError(error),
      });
    } finally {
      setIsLoading.off();
    }
  };

  return (
    <form className={cn('pt-6', className)} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field>
          <FieldLabel>New Password</FieldLabel>
          <PasswordInput
            id="newPassword"
            placeholder="Enter your new password"
            aria-invalid={!!form.formState.errors.newPassword}
            {...form.register('newPassword')}
          />
          <FieldError errors={[form.formState.errors.newPassword]} />
        </Field>
        <Field>
          <FieldLabel>Confirm New Password</FieldLabel>
          <PasswordInput
            id="confirmNewPassword"
            placeholder="Confirm your new password"
            aria-invalid={!!form.formState.errors.confirmNewPassword}
            {...form.register('confirmNewPassword')}
          />
          <FieldError errors={[form.formState.errors.confirmNewPassword]} />
        </Field>
        <Field className="gap-space-3 flex flex-col items-center text-center">
          <Button type="submit" variant="default" loading={isLoading} disabled={isLoading}>
            Reset Password
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
