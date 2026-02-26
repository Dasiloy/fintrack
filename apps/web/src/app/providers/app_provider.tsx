'use client';

import { TooltipProvider, AlertProvider } from '@ui/components';

export default function AppProviver({ children }: React.PropsWithChildren) {
  return (
    <AlertProvider>
      <TooltipProvider>{children}</TooltipProvider>
    </AlertProvider>
  );
}
