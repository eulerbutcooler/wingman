"use client"

import Navbar from '@/components/ui/navbar'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      <Navbar />
      <main className="pt-24">
        {children}
      </main>
    </>
  )
}
