import React from "react"
import type { Metadata, Viewport } from 'next'
import { Inter, Oswald } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/toaster'
import { Providers } from '@/components/providers'
import './globals.css'

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });

export const metadata: Metadata = {
  title: 'KitZone - Премиум футболни екипи',
  description: 'Пазарувай най-новите футболни екипи, фланелки и артикули от водещи клубове по света. Безплатна доставка за поръчки над 100 €.',
  keywords: ['футболни екипи', 'футболни фланелки', 'спортно облекло', 'екипи на отбори'],
    generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="bg">
      <body className={`${inter.variable} ${oswald.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
