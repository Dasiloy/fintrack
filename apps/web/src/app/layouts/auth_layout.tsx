'use client';

import { cn } from '@ui/lib/utils';

import { STATIC_ROUTES } from '@fintrack/types/constants/routes.constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Text } from '@ui/components';

import { Logo, StyledLink } from '@/app/_components';

export interface AuthLayoutProps extends React.PropsWithChildren {
  title?: string;
  withFooter?: boolean;
  description?: string;
}

export default function AuthLayout({
  children,
  title,
  description,
  withFooter = true,
}: AuthLayoutProps) {
  return (
    <div className="bg-bg-deep gap-space-6 p-space-6 md:p-space-10 flex min-h-svh flex-col items-center justify-center">
      <div className="gap-space-6 flex w-full max-w-md flex-col">
        {/** HEADER: primary box with white logo + Fintrack text */}
        <Logo className="mx-auto" />

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
            className={cn('px-space-6 py-space-2 text-center leading-relaxed tracking-wide', {
              hidden: !withFooter,
            })}
          >
            By clicking continue, you agree to our &nbsp;
            <StyledLink variant={'underline'} href={STATIC_ROUTES.TERMS}>
              Terms of Service
            </StyledLink>
            &nbsp;and &nbsp;
            <StyledLink
              variant={'underline'}
              href={STATIC_ROUTES.PRIVACY}
            >{` Privacy Policy `}</StyledLink>
          </Text>
        </div>
      </div>
    </div>
  );
}
