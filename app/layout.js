import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Outfit Pal - Premium AI Stylist',
  description: 'Your conversational AI stylist for personalized outfit recommendations',
}

// Theme configuration - Change ACTIVE_THEME to 'default' to restore previous background
const ACTIVE_THEME = "default"; 

const THEMES = {
  default: "theme-default",
  sky: "theme-sky"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body suppressHydrationWarning className={`${inter.className} ${THEMES[ACTIVE_THEME]} min-h-screen text-slate-900`}>
        {children}
      </body>
    </html>
  )
}
