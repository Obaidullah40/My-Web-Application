import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevLedger',
  description: 'Developer portfolio and business management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
