import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NIRNAY | Delhi PWD Monsoon Decision Engine',
  description: 'Pre-storm what-if flash-flood simulation and optimal pump resource allocation for Delhi underpasses.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
