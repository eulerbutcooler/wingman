"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const sentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
          "flex w-11/12 z-10 items-center justify-between pl-5 pr-3 py-3 fixed top-2 left-1/2 -translate-x-1/2 rounded-2xl",
          // Smooth color fade
          "transition-colors duration-150 ease-in-out",
          // Top-of-page background
          "bg-[#f5f5f5]",
        ].join(" ")}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            AeroMentor<span className="text-navy">AI</span>
          </h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex text-black space-x-6">
          <Link href="/" className="hover:text-navy transition-colors">
            Home
          </Link>
          <Link href="/chat" className="hover:text-navy transition-colors">
            Chat
          </Link>
          <Link href="/library" className="hover:text-navy transition-colors">
            Library
          </Link>
          <Link href="/quiz" className="hover:text-navy transition-colors">
            Quiz
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Desktop Auth Button */}
        <div className="hidden md:block font-bold">
          {loading ? (
            <div className="py-2 px-4 bg-gray-200 rounded-full animate-pulse w-20 h-10" />
          ) : !user ? (
            <Link href="/signin">
              <button className="py-2 px-4 bg-black cursor-pointer rounded-full text-white hover:bg-gray-800 transition-colors">
                Get started
              </button>
            </Link>
          ) : (
            <Link href="/dashboard">
              <button className="py-2 px-4 bg-black cursor-pointer rounded-full text-white hover:bg-gray-800 transition-colors">
                {user.user_metadata?.name?.charAt(0).toUpperCase() ||
                  user.email?.charAt(0).toUpperCase() ||
                  "U"}
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed top-16 right-4 left-4 bg-white rounded-2xl shadow-2xl p-6 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-6">
              {/* Mobile Navigation Links */}
              <Link
                href="/"
                className="text-lg font-medium text-black hover:text-navy transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/chat"
                className="text-lg font-medium text-black hover:text-navy transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Chat
              </Link>
              <Link
                href="/library"
                className="text-lg font-medium text-black hover:text-navy transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Library
              </Link>
              <Link
                href="/quiz"
                className="text-lg font-medium text-black hover:text-navy transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Quiz
              </Link>

              {/* Mobile Auth Button */}
              <div className="pt-4 border-t border-gray-200">
                {loading ? (
                  <div className="py-3 px-6 bg-gray-200 rounded-full animate-pulse h-12" />
                ) : !user ? (
                  <Link
                    href="/signin"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <button className="w-full py-3 px-6 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
                      Get started
                    </button>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <button className="w-full py-3 px-6 bg-black text-white rounded-full hover:bg-gray-800 transition-colors">
                      Go to Dashboard
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
