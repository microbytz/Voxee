import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
