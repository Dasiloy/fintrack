'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Button,
  Input,
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  PasswordInput,
  toast,
} from '@ui/components';
import { cn } from '@ui/lib/utils';
import { AUTH_ROUTES } from '@fintrack/types/constants/routes.constants';
import { ServerFormatter } from '@fintrack/utils/server';

import { useRouter } from '@bprogress/next';

import StyledLink from '@/app/_components/styled_linkt';
import { axiosClient } from '@/lib/axios/axios_client';
import { useSearchParams } from 'next/navigation';

const signupSchema = z
  .object({
    firstName: z.string().min(1, 'First name must be at least 2 characters'),
    lastName: z.string().min(1, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .refine((v) => /[a-z]/.test(v), 'Must contain a lowercase letter')
      .refine((v) => /[A-Z]/.test(v), 'Must contain an uppercase letter')
      .refine((v) => /\d/.test(v), 'Must contain a number')
      .refine((v) => /[@$!%*?&]/.test(v), 'Must contain a special characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

interface SignupFormProps extends React.ComponentProps<'form'> {
  email?: string;
}

export function SignupForm({ className, email }: SignupFormProps) {
  const router = useRouter();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: email ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (_data: SignupFormValues) => {
    try {
      await axiosClient.post('/proxy-auth/signup', _data);

      form.reset();
      router.push(AUTH_ROUTES.VERIFY_EMAIL);
    } catch (error: any) {
      toast.error('Failed to sign up', {
        description: ServerFormatter.formatError(error),
      });
    }
  };

  return (
    <form className={cn('pt-6', className)} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Field orientation={'horizontal'} className="items-start gap-4">
          <Field>
            <FieldLabel htmlFor="firstName">First Name</FieldLabel>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              autoComplete="given-name"
              aria-invalid={!!form.formState.errors.firstName}
              {...form.register('firstName')}
            />
            <FieldError errors={[form.formState.errors.firstName]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="lastName">Last Name</FieldLabel>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              autoComplete="family-name"
              aria-invalid={!!form.formState.errors.lastName}
              {...form.register('lastName')}
            />
            <FieldError errors={[form.formState.errors.lastName]} />
          </Field>
        </Field>

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            autoComplete="email"
            aria-invalid={!!form.formState.errors.email}
            {...form.register('email')}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            placeholder="********"
            autoComplete="new-password"
            aria-invalid={!!form.formState.errors.password}
            {...form.register('password')}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
          <PasswordInput
            id="confirm-password"
            placeholder="********"
            autoComplete="new-password"
            aria-invalid={!!form.formState.errors.confirmPassword}
            {...form.register('confirmPassword')}
          />
          <FieldError errors={[form.formState.errors.confirmPassword]} />
        </Field>

        <Field className="mb-2">
          <Button
            className="mb-1"
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={form.formState.isSubmitting}
          >
            Sign Up
          </Button>
          <FieldDescription className="text-center text-sm">
            Already have an account? <StyledLink href={AUTH_ROUTES.LOGIN}>Login</StyledLink>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
