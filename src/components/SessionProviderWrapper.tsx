'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { FaviconUpdater } from './FaviconUpdater';

export function SessionProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <FaviconUpdater />
      {children}
    </SessionProvider>
  );
}
