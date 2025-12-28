import type {Metadata} from 'next';
import Script from 'next/script';

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
      <body>{children}</body>
    </html>
  );
}
