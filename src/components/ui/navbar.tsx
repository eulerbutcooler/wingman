'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

interface NavbarProps {
  sections: string[]
  activeSection: string
  setActiveSection: (section: string) => void
  scrollToSection: (sectionId: string) => void
}

export default function Navbar({ sections, activeSection, scrollToSection }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  // Navigation links array with their corresponding routes
  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Chat', path: '/chat' },
    { name: 'Library', path: '/library' },
    { name: 'Learning', path: '/learning' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSectionClick = (sectionId: string, path?: string) => {
    if (sectionId === 'get-started') {
      // Handle get started button click - you can customize this
      router.push('/dashboard') // or wherever you want to navigate
      setIsMenuOpen(false)
      return
    }

    // If path is provided, navigate to that path
    if (path) {
      router.push(path)
      setIsMenuOpen(false)
      return
    }
    
    // Fallback to original scroll behavior
    scrollToSection(sectionId)
    setIsMenuOpen(false)
  }

  return (
    <nav className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 transition-colors duration-300 backdrop-blur-sm border border-border rounded-full shadow-lg ${
      isScrolled ? 'bg-white' : 'bg-[#f5f5f5]'
    }`} style={{ width: '64rem', height: '4.5rem' }}>
      <div className="container mx-auto px-10 py-3 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo on the left */}
          <div className="text-lg font-bold text-foreground">
            AK
          </div>
          
          {/* Navigation Links in the middle */}
          <div className="hidden md:flex items-center space-x-6 flex-1 justify-center">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => handleSectionClick(link.name.toLowerCase(), link.path)}
                className={`text-sm transition-colors duration-300 hover:text-primary cursor-pointer ${
                  activeSection === link.name.toLowerCase() ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>

          {/* Get Started Button/User Info and Mobile Menu Toggle on the extreme right */}
          <div className="flex items-center">
            {status === "loading" ? (
              <div className="hidden md:block text-sm text-muted-foreground">Loading...</div>
            ) : session ? (
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-sm text-foreground">Hi, {session.user?.name}</span>
                <button
                  className="bg-red-600 text-white px-4 py-1.5 text-sm rounded-full hover:bg-red-700 transition-colors duration-300"
                  onClick={() => signOut()}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className="hidden md:block bg-[#000080] text-white px-8 py-3 text-lg font-semibold rounded-full hover:bg-[#000066] transition-colors duration-300 shadow-md"
                onClick={() => router.push('/sign-up')}
              >
                Get Started
              </button>
            )}

            <button
              className="md:hidden text-foreground cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu - positioned below the floating navbar */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 md:hidden">
            <div className="bg-white rounded-lg shadow-lg border border-border p-4">
              <div className="flex flex-col space-y-2">
                {navLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleSectionClick(link.name.toLowerCase(), link.path)}
                    className={`capitalize py-2 px-4 text-left transition-colors duration-300 hover:text-primary rounded-lg ${
                      activeSection === link.name.toLowerCase() ? 'text-primary font-semibold bg-primary/10' : 'text-muted-foreground'
                    }`}
                  >
                    {link.name}
                  </button>
                ))}
                
                {session ? (
                  <div className="pt-2 border-t border-border">
                    <div className="text-sm text-foreground mb-2">Hi, {session.user?.name}</div>
                    <button
                      className="bg-red-600 text-white px-6 py-2 rounded-full hover:bg-red-700 transition-colors duration-300 w-full"
                      onClick={() => signOut()}
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    className="bg-[#000080] text-white px-6 py-2 rounded-full hover:bg-[#000066] transition-colors duration-300 mt-4"
                    onClick={() => router.push('/sign-up')}
                  >
                    Get Started
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}