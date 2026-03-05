import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Verint FI Intelligence | Financial Security Insights',
  description:
    'Real-time financial institution security intelligence for the Verint sales team. ' +
    'Monitor trends in bank robberies, ATM theft, cyberattacks, and more.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-verint-gray">
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
        <footer className="bg-verint-purple-deeper text-white py-6 px-4 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-verint-purple font-black text-xs">V</span>
              </div>
              <span className="text-sm font-medium text-verint-purple-pale">
                Verint Financial Institution Intelligence Platform
              </span>
            </div>
            <div className="text-xs text-verint-purple-pale opacity-70">
              Data refreshed daily at 5:00 AM ET &nbsp;·&nbsp;
              Sources: NewscatcherAPI, GDELT, KrebsOnSecurity, FS-ISAC
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
