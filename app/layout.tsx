import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Provatsoft Receipt SaaS',
  description: 'Multi-template receipt generator for vendors and admins',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
