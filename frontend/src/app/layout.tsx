import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FeedPulse — AI-Powered Product Feedback',
  description: 'Collect and analyze product feedback with AI-powered insights',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
