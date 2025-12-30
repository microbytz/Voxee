import type {Metadata} from 'next';
import {Inter} from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import {Toaster} from '@/components/ui/toaster';

const inter = Inter({subsets: ['latin']});

export const metadata: Metadata = {
  title: 'AI Assistant + History',
  description: 'A personal AI assistant with cloud history.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <Script src="https://js.puter.com/v2/"></Script>
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
