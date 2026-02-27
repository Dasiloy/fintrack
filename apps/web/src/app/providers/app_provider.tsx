'use client';

import { AppProgressProvider } from '@bprogress/next';
import { TooltipProvider, AlertProvider } from '@ui/components';

export default function AppProviver({ children }: React.PropsWithChildren) {
  return (
    <AlertProvider>
      <TooltipProvider>
        <AppProgressProvider
          color="#7c7aff"
          disableSameURL
          shallowRouting={false}
          shouldCompareComplexProps
        >
          {children}
        </AppProgressProvider>
      </TooltipProvider>
    </AlertProvider>
  );
}
