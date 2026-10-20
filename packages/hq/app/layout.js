import './globals.css';

export const metadata = {
  title: 'Aurex HQ — Control Center',
  description: 'One control center for the Aurex Discord bot family: Music, Level, Greet, Ticket, Ping & Guard.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}