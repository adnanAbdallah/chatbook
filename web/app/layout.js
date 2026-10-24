import { SessionProvider } from '@/components/SessionProvider';
import './globals.css';

export const metadata = {
  title: 'chatbook',
  description: 'A tiny social network with real-time chat',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
