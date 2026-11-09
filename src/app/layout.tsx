import type { Metadata } from 'next'
import { Bricolage_Grotesque, Fraunces } from 'next/font/google'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['opsz', 'WONK'],
})

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Gratitude',
  description: 'Write what you are grateful for. Share it with the people you choose.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${bricolage.variable} h-full antialiased`}>
      {/*
        The footer lives here rather than per-route so it reaches the signed-out
        pages too: someone has to be able to read the privacy policy before
        deciding to hand over an email address, not only after.
      */}
      <body className="flex min-h-full flex-col">
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
