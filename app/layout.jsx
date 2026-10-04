import './globals.css';

export const metadata = {
  title: 'MediWatch Kenya | Strategic Media & Social Intelligence',
  description: 'Verified country intelligence, multi-source corroboration, and national narrative early warnings.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
