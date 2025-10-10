"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore, useUIStore } from "@/stores";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const { user, loading } = useAuthStore();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useUIStore();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement | null>(null);
  const sentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    const sent = sentRef.current;
    if (!nav || !sent) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        nav.classList.toggle("scrolled", !entry.isIntersecting);
      },
      { threshold: 1 }
    );

    io.observe(sent);
    return () => io.disconnect();
  }, []);

  // Helper function to check if a path is active
  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(path);
  };

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
          "flex w-11/12 z-50 items-center justify-between pl-5 pr-3 py-3 fixed top-2 left-1/2 -translate-x-1/2 rounded-4xl",
          // Smooth color fade
          "transition-colors duration-150 ease-in-out",
          // Transparent by default, background only when scrolled via CSS
        ].join(" ")}
      >
        <div>
          <h1 className="text-xl md:text-2xl font-bold">AeroMentor</h1>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex text-black space-x-6 relative">
          <Link
            href="/"
            className={`relative pb-1 transition-colors ${
              isActive("/") && pathname === "/"
                ? "text-black font-semibold"
                : "hover:text-navy"
            }`}
          >
            Home
            {isActive("/") && pathname === "/" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full animate-slide-in" />
            )}
          </Link>
          <Link
            href="/chat"
            className={`relative pb-1 transition-colors ${
              isActive("/chat") ? "text-black font-semibold" : "hover:text-navy"
            }`}
          >
            Chat
            {isActive("/chat") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full animate-slide-in" />
            )}
          </Link>
          <Link
            href="/library"
            className={`relative pb-1 transition-colors ${
              isActive("/library")
                ? "text-black font-semibold"
                : "hover:text-navy"
            }`}
          >
            Library
            {isActive("/library") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full animate-slide-in" />
            )}
          </Link>
          <Link
            href="/quiz"
            className={`relative pb-1 transition-colors ${
              isActive("/quiz") ? "text-black font-semibold" : "hover:text-navy"
            }`}
          >
            Quiz
            {isActive("/quiz") && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black rounded-full animate-slide-in" />
            )}
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
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed top-16 right-4 left-4 bg-white rounded-2xl shadow-2xl p-6 z-[70]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col space-y-6">
              {/* Mobile Navigation Links */}
              <Link
                href="/"
                className={`relative text-lg font-medium transition-colors inline-block ${
                  isActive("/") && pathname === "/"
                    ? "text-black font-bold"
                    : "text-black hover:text-navy"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                HOME
                {isActive("/") && pathname === "/" && (
                  <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-black rounded-full" />
                )}
              </Link>
              <Link
                href="/chat"
                className={`relative text-lg font-medium transition-colors inline-block ${
                  isActive("/chat")
                    ? "text-black font-bold"
                    : "text-black hover:text-navy"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                CHAT
                {isActive("/chat") && (
                  <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-black rounded-full" />
                )}
              </Link>
              <Link
                href="/library"
                className={`relative text-lg font-medium transition-colors inline-block ${
                  isActive("/library")
                    ? "text-black font-bold"
                    : "text-black hover:text-navy"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                LIBRARY
                {isActive("/library") && (
                  <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-black rounded-full" />
                )}
              </Link>
              <Link
                href="/quiz"
                className={`relative text-lg font-medium transition-colors inline-block ${
                  isActive("/quiz")
                    ? "text-black font-bold"
                    : "text-black hover:text-navy"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                QUIZ
                {isActive("/quiz") && (
                  <span className="absolute bottom-0 left-0 w-12 h-0.5 bg-black rounded-full" />
                )}
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
