'use client';

import Link from 'next/link';
import Image from 'next/image';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, Text } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';

export interface AuthLayoutProps extends React.PropsWithChildren {
  title?: string;
  description?: string;
}

export default function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="bg-bg-deep gap-space-6 p-space-6 md:p-space-10 flex min-h-svh flex-col items-center justify-center">
      <div className="gap-space-6 flex w-full max-w-md flex-col">
        {/** HEADER: primary box with white logo + Fintrack text */}
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <Image
              src={'/logo-icon-white.png'}
              alt="logo"
              objectFit="contain"
              priority
              width={16}
              height={16}
              className="h-4 w-auto"
            ></Image>
          </div>
          Fintrack
        </Link>

        {/** BODY */}
        <div className="gap-space-6 flex flex-col">
          {/** FOORM */}
          <Card>
            <CardHeader className="text-center">
              {title && <CardTitle className="text-h3">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>{children}</CardContent>
          </Card>

          {/** FOOTER */}
          <Text
            as="div"
            variant={'body-sm'}
            color={'secondary'}
            className="px-space-6 py-space-2 text-center leading-relaxed tracking-wide"
          >
            By clicking continue, you agree to our &nbsp;
            <Link
              className={cn('hover:text-primary inline h-auto p-0 underline underline-offset-4')}
              href="/terms"
            >
              Terms of Service
            </Link>
            &nbsp;and &nbsp;
            <Link
              className={cn('hover:text-primary inline h-auto p-0 underline underline-offset-4')}
              href="/policy"
            >
              {` Privacy Policy `}
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
}
