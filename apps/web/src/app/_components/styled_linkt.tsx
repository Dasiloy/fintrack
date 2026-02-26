import Link, { type LinkProps as Props } from 'next/link';

import { cn, cva, type VariantProps } from '@ui/lib/utils';
import type { PropsWithChildren } from 'react';

const variants = cva(
  'hover:text-primary text-text-secondary inline h-auto p-0 underline-offset-4',
  {
    variants: {
      variant: {
        underline: 'underline',
        default: 'no-underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface LinkProps extends Props, PropsWithChildren, VariantProps<typeof variants> {
  className?: string;
}

export default function StyledLink({ className, href, children, variant, ...rest }: LinkProps) {
  return (
    <Link className={cn(variants({ variant, className }))} href={href} {...rest}>
      {children}
    </Link>
  );
}
