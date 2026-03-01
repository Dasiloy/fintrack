'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { StyledLink } from '@/app/_components';
import { useRouter } from '@bprogress/next';
import { cn } from '@ui/lib/utils';

import { Button, Field, FieldError, FieldGroup, FieldLabel, Input, toast } from '@ui/components';

import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { ServerFormatter } from '@fintrack/utils/server';
import { axiosClient } from '@/lib/axios/axios_client';
import { useBoolean } from '@ui/hooks';

const forgotpasswordSchema = z.object({
  email: z.string().email('Invalid Email'),
});

type ForgotPasswordValues = z.infer<typeof forgotpasswordSchema>;

export default function ForgotPasswordForm({ className }: React.ComponentProps<'form'>) {
  const [isLoading, setIsLoading] = useBoolean(false);
  const router = useRouter();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotpasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (_data: ForgotPasswordValues) => {
    try {
      setIsLoading.on();
      await axiosClient.post('/proxy-auth/forgot-password', _data);

      toast.success('Reset instructions sent to email', {
        description: 'Please check your email for the reset instructions',
      });

      form.reset();
      router.push(AUTH_ROUTES.VERIFY_PASSWORD_TOKEN);
    } catch (error) {
      toast.error('An error occured', {
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
          <FieldLabel>Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            aria-invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>

        <Field className="my-space-2">
          <Button type="submit" variant="default" loading={isLoading} disabled={isLoading}>
            Send Code
          </Button>
          <div className="flex justify-center">
            <StyledLink
              className="mt-space-2 text-text-tertiary self-center text-sm"
              href={AUTH_ROUTES.LOGIN}
            >
              Back to Login
            </StyledLink>
          </div>
        </Field>
      </FieldGroup>
    </form>
  );
}
