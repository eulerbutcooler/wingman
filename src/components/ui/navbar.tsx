"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore, useUIStore } from "@/stores";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const { user, userType, loading } = useAuthStore();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useUIStore();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement | null>(null);
  const sentRef = useRef<HTMLDivElement | null>(null);
  
  // Only show analytics link to admins
  const showAnalytics = user && userType === "admin";

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
          "flex w-full max-w-5xl z-50 items-center justify-between px-6 py-3 fixed top-6 left-1/2 -translate-x-1/2 rounded-full border",
          "transition-all duration-300",
          // Scrolled state will be applied via CSS class
        ].join(" ")}
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgb(219 234 254)',
          boxShadow: '0 10px 15px -3px rgb(59 130 246 / 0.05), 0 4px 6px -4px rgb(59 130 246 / 0.05)'
        }}
      >
        <div className="flex items-center gap-2 text-xl font-bold text-slate-900 tracking-tighter">
          <span>AeroMentor</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-slate-600 font-medium text-sm">
          <Link
            href="/"
            className={`hover:text-blue-600 transition-colors ${
              isActive("/") && pathname === "/"
                ? "text-blue-600 font-semibold"
                : ""
            }`}
          >
            Home
          </Link>
          <Link
            href="/chat"
            className={`hover:text-blue-600 transition-colors ${
              isActive("/chat") ? "text-blue-600 font-semibold" : ""
            }`}
          >
            Chat
          </Link>
          <Link
            href="/library"
            className={`hover:text-blue-600 transition-colors ${
              isActive("/library")
                ? "text-blue-600 font-semibold"
                : ""
            }`}
          >
            Library
          </Link>
          <Link
            href="/quiz"
            className={`hover:text-blue-600 transition-colors ${
              isActive("/quiz") ? "text-blue-600 font-semibold" : ""
            }`}
          >
            Quiz
          </Link>
          {showAnalytics && (
            <Link
              href="/analytics"
              className={`hover:text-blue-600 transition-colors ${
                isActive("/analytics")
                  ? "text-blue-600 font-semibold"
                  : ""
              }`}
            >
              Analytics
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
          >
            {isMobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
        </div>

        {/* Desktop Auth Button */}
        <div className="hidden md:block">
          {loading ? (
            <div className="py-2 px-5 bg-gray-200 rounded-full animate-pulse w-24 h-10" />
          ) : !user ? (
            <Link href="/signin">
              <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full font-semibold transition-all hover:shadow-lg hover:shadow-slate-900/20 text-sm">
                Get Started
              </button>
            </Link>
          ) : (
            <Link href="/dashboard">
              <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-full font-semibold transition-all hover:shadow-lg hover:shadow-slate-900/20 text-sm">
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
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed top-24 w-[90%] max-w-md left-1/2 -translate-x-1/2 bg-white border border-slate-100 rounded-2xl shadow-2xl p-4 z-[70] animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              {/* Mobile Navigation Links */}
              <Link
                href="/"
                className={`text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl block font-medium ${
                  isActive("/") && pathname === "/"
                    ? "bg-slate-50 text-blue-600"
                    : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/chat"
                className={`text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl block font-medium ${
                  isActive("/chat")
                    ? "bg-slate-50 text-blue-600"
                    : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Chat
              </Link>
              <Link
                href="/library"
                className={`text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl block font-medium ${
                  isActive("/library")
                    ? "bg-slate-50 text-blue-600"
                    : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Library
              </Link>
              <Link
                href="/quiz"
                className={`text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl block font-medium ${
                  isActive("/quiz")
                    ? "bg-slate-50 text-blue-600"
                    : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Quiz
              </Link>
              {showAnalytics && (
                <Link
                  href="/analytics"
                  className={`text-slate-600 hover:bg-slate-50 px-4 py-3 rounded-xl block font-medium ${
                    isActive("/analytics")
                      ? "bg-slate-50 text-blue-600"
                      : ""
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Analytics
                </Link>
              )}

              {/* Mobile Auth Button */}
              <div className="pt-2">
                {loading ? (
                  <div className="py-3 bg-slate-200 rounded-xl animate-pulse h-12" />
                ) : !user ? (
                  <Link
                    href="/signin"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                      Get Started
                    </button>
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                      Dashboard
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
