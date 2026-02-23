import * as React from 'react';
import { cn } from '@ui/lib/utils/cn';
import { cva, type VariantProps } from 'class-variance-authority';

const textVariants = cva('', {
  variants: {
    variant: {
      h1: 'text-h1 font-bold tracking-tight',
      h2: 'text-h2 font-bold tracking-tight',
      h3: 'text-h3 font-semibold tracking-tight',
      h4: 'text-h4 font-semibold',
      'body-lg': 'text-body-lg font-medium',
      body: 'text-body font-normal',
      'body-sm': 'text-body-sm font-normal',
      caption: 'text-caption font-normal',
      overline: 'text-overline font-semibold uppercase tracking-wider',
    },
    color: {
      primary: 'text-text-primary',
      secondary: 'text-text-secondary',
      tertiary: 'text-text-tertiary',
      disabled: 'text-text-disabled',
      brand: 'text-primary',
      success: 'text-success',
      error: 'text-error',
      warning: 'text-warning',
    },
  },
  defaultVariants: {
    variant: 'body',
    color: 'primary',
  },
});

type TextTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'label';

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>, VariantProps<typeof textVariants> {
  as?: TextTag;
  asChild?: boolean;
}

const Text = ({ className, variant, color, as, asChild, ...props }: TextProps) => {
  const defaultTag =
    variant === 'h1' || variant === 'h2' || variant === 'h3' || variant === 'h4' ? variant : 'p';
  const Component = as || defaultTag;

  return <Component className={cn(textVariants({ variant, color, className }))} {...props} />;
};

Text.displayName = 'Text';

export { Text, textVariants };
