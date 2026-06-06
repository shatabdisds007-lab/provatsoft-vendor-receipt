import type { Metadata } from 'next';
import './globals.css';
import { validateSupabaseAtStartup } from '@/lib/supabaseStartup';
import { AuthProvider } from '@/providers/AuthProvider';

// Validate Supabase credentials at app startup
validateSupabaseAtStartup();

export const metadata: Metadata = {
  title: 'Provatsoft Receipt SaaS',
  description: 'Multi-template receipt generator for vendors and admins',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
