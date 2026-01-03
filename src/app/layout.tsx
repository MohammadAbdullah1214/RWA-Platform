import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/lib/theme-provider'
import { AppProvider } from '@/contexts/app-context'
import { RootLayoutWrapper } from '@/components/layout/root-layout-wrapper'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RWA Platform | Tokenized Real World Assets',
  description: 'TRex-compatible RWA platform on Cosmos with CosmWasm smart contracts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} overflow-x-hidden`}>
        <ThemeProvider>
          <AppProvider>
            <RootLayoutWrapper>
              {children}
            </RootLayoutWrapper>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}