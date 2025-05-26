import { Inter } from 'next/font/google';
import './globals.css'
import SessionProviderWrapper from '@/components/providers/session-provider-wrapper'; // Importar el wrapper
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Papelería Papelón',
  description: 'Develop by ChrisAlons',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProviderWrapper>
          {children}
          <Toaster />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
