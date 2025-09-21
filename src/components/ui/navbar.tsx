"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { 
  FaHome, 
  FaComments, 
  FaBookOpen, 
  FaQuestionCircle, 
  FaUser 
} from "react-icons/fa";

export default function Navbar() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const sentRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    const sent = sentRef.current;
    if (!nav || !sent) return;

    // Observe when the very top of the page is visible
    const io = new IntersectionObserver(
      ([entry]) => {
        // When the sentinel is NOT visible, user has scrolled down a bit
        nav.classList.toggle("scrolled", !entry.isIntersecting);
      },
      {
        // Trigger as soon as we leave the top
        threshold: 1,
      }
    );

    io.observe(sent);
    return () => io.disconnect();
  }, []);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Sentinel sits at the very top of the page */}
      <div
        ref={sentRef}
        aria-hidden="true"
        style={{ position: "absolute", top: 0, left: 0, width: 1, height: 1 }}
      />
      <div
        ref={navRef}
        className={[
          "flex w-11/12 z-80  items-center justify-between pl-4 lg:pl-5 pr-3 py-3 fixed top-2 left-1/2 -translate-x-1/2 rounded-4xl",
          // Smooth color fade
          "transition-colors duration-150 ease-in-out",
          // Top-of-page background (your requested f5f5f5)
          ,
        ].join(" ")}
      >
        <div>
          <h1 className="text-2xl font-bold">Wingman<span className="text-navy">AI</span></h1>
        </div>

        <div className="lg:flex hidden text-black text-sm lg:text-base space-x-3 lg:space-x-6">
          <Link href="/">Home</Link>
          <Link href="/chat">Chat</Link>
          <Link href="/library">Library</Link>
          <Link href="/quiz">Quiz</Link>
        </div>

        <div className="font-bold relative" ref={dropdownRef}>
        {!session ? (
  <Link href="/sign-in">
    <button className="py-2 px-4 bg-black text-base cursor-pointer rounded-full text-white">
      Get started
    </button>
  </Link>
) : (
  <>
    {/* Desktop view - unchanged */}
    <Link href="/dashboard" className="hidden lg:block">
      <button className="py-2 px-4 bg-black cursor-pointer rounded-full text-white">
        {session.user?.name?.charAt(0).toUpperCase()}
      </button>
    </Link>
    
    {/* Mobile view - dropdown */}
    <div className="lg:hidden">
      <button 
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="py-2 px-4 bg-black cursor-pointer rounded-full text-white"
      >
        {session.user?.name?.charAt(0).toUpperCase()}
      </button>
      
      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-4xl shadow-lg  py-2 z-50">
          <Link href="/hero" onClick={() => setIsDropdownOpen(false)}>
            <div className="flex items-center justify-center p-3 hover:bg-gray-50 cursor-pointer transition-colors">
              <FaHome className="text-gray-600" size={20} />
            </div>
          </Link>
          <Link href="/chat" onClick={() => setIsDropdownOpen(false)}>
            <div className="flex items-center justify-center p-3 hover:bg-gray-50 cursor-pointer transition-colors">
              <FaComments className="text-gray-600" size={20} />
            </div>
          </Link>
          <Link href="/library" onClick={() => setIsDropdownOpen(false)}>
            <div className="flex items-center justify-center p-3 hover:bg-gray-50 cursor-pointer transition-colors">
              <FaBookOpen className="text-gray-600" size={20} />
            </div>
          </Link>
          <Link href="/quiz" onClick={() => setIsDropdownOpen(false)}>
            <div className="flex items-center justify-center p-3 hover:bg-gray-50 cursor-pointer transition-colors">
              <FaQuestionCircle className="text-gray-600" size={20} />
            </div>
          </Link>
          <Link href="/dashboard" onClick={() => setIsDropdownOpen(false)}>
            <div className="flex items-center justify-center p-3 hover:bg-gray-50 cursor-pointer transition-colors">
              <FaUser className="text-gray-600" size={20} />
            </div>
          </Link>
        </div>
      )}
    </div>
  </>
)}
        </div>
      </div>
    </>
  );
}