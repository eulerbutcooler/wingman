"use client"

import { useState } from 'react'
import Navbar from '@/components/ui/navbar'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const [activeSection, setActiveSection] = useState('home')

  const scrollToSection = (sectionId: string) => {
    console.log(`Scrolling to section: ${sectionId}`)
    setActiveSection(sectionId)
    
    // Try to scroll to element if it exists
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      <Navbar 
        sections={['home', 'chat', 'library', 'learning']}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        scrollToSection={scrollToSection}
      />
      <main className="pt-24">
        {children}
      </main>
    </>
  )
}
