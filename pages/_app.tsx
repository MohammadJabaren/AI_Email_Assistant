import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { useState } from 'react';

import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

type CustomAppProps = AppProps & {
  pageProps: {
    session?: Session;
  };
};

function App({ Component, pageProps: { session, ...pageProps } }: CustomAppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: false,
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }));

  return (
    <SessionProvider session={session}>
      <div className={inter.className}>
        <Toaster
          toastOptions={{
            style: {
              maxWidth: 500,
              wordBreak: 'break-all',
            },
          }}
        />
        <QueryClientProvider client={queryClient}>
          <Component {...pageProps} />
        </QueryClientProvider>
      </div>
    </SessionProvider>
  );
}

export default appWithTranslation(App);
