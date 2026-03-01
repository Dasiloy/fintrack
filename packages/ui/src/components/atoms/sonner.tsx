import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps, toast, useSonner } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      richColors
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--ft-color-bg-surface)',
          '--normal-text': 'var(--ft-color-text-primary)',
          '--normal-border': 'var(--ft-color-border-subtle)',
          '--success-bg': 'color-mix(in srgb, var(--ft-color-success) 8%, var(--ft-color-bg-surface))',
          '--success-border': 'color-mix(in srgb, var(--ft-color-success) 25%, transparent)',
          '--success-text': 'var(--ft-color-text-primary)',
          '--error-bg': 'color-mix(in srgb, var(--ft-color-error) 8%, var(--ft-color-bg-surface))',
          '--error-border': 'color-mix(in srgb, var(--ft-color-error) 25%, transparent)',
          '--error-text': 'var(--ft-color-text-primary)',
          '--warning-bg': 'color-mix(in srgb, var(--ft-color-warning) 8%, var(--ft-color-bg-surface))',
          '--warning-border': 'color-mix(in srgb, var(--ft-color-warning) 25%, transparent)',
          '--warning-text': 'var(--ft-color-text-primary)',
          '--info-bg': 'color-mix(in srgb, var(--ft-color-info) 8%, var(--ft-color-bg-surface))',
          '--info-border': 'color-mix(in srgb, var(--ft-color-info) 25%, transparent)',
          '--info-text': 'var(--ft-color-text-primary)',
          '--border-radius': 'var(--ft-radius-card)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster, toast, useSonner };
