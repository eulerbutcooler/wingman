"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
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
          "flex w-11/12 z-10 items-center justify-between pl-5 pr-3 py-3 fixed top-2 left-1/2 -translate-x-1/2 rounded-4xl",
          // Smooth color fade
          "transition-colors duration-150 ease-in-out",
          // Top-of-page background
          "bg-[#f5f5f5]",
        ].join(" ")}
      >
        <div>
          <h1 className="text-2xl font-bold">
            Wingman<span className="text-navy">AI</span>
          </h1>
        </div>

        <div className="flex text-black space-x-6">
          <Link href="/">Home</Link>
          <Link href="/chat">Chat</Link>
          <Link href="/library">Library</Link>
          <Link href="/quiz">Quiz</Link>
        </div>

        <div className="font-bold">
          {loading ? (
            <div className="py-2 px-4 bg-gray-200 rounded-full animate-pulse w-20 h-10" />
          ) : !user ? (
            <Link href="/signin">
              <button className="py-2 px-4 bg-black cursor-pointer rounded-full text-white">
                Get started
              </button>
            </Link>
          ) : (
            <Link href="/dashboard">
              <button className="py-2 px-4 bg-black cursor-pointer rounded-full text-white">
                {user.user_metadata?.name?.charAt(0).toUpperCase() ||
                  user.email?.charAt(0).toUpperCase() ||
                  "U"}
              </button>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
