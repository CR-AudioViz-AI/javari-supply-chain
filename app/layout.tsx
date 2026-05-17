// app/layout.tsx — Javari Supply Chain
import type { Metadata } from 'next'
import './globals.css'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Javari Supply Chain | Javari by CR AudioViz AI',
  description: 'Supply chain AI',
}
import AppShell from '@/components/AppShell'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body style={{ margin: 0, padding: 0 }}><AppShell appName="Javari Supply Chain" appColor="#0891b2" appEmoji="🔗" appDesc="Supply chain AI">{children}</AppShell></body></html>)
}
