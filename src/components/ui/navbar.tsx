"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Navbar() {
  const navRef = useRef<HTMLDivElement | null>(null);
  const sentRef = useRef<HTMLDivElement | null>(null);

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
          "flex w-11/12 justify-between p-6 fixed top-8 left-1/2 -translate-x-1/2 rounded-4xl",
          // Smooth color fade
          "transition-colors duration-300 ease-in-out",
          // Top-of-page background (your requested f5f5f5)
          "bg-[#f5f5f5]",
        ].join(" ")}
      >
        <div>
          <h1 className="text-2xl font-bold">Wingman<span className="text-blue-600">AI</span></h1>
        </div>

        <div className="flex text-black space-x-6">
          <Link href="/">Home</Link>
          <Link href="/chat">Chat</Link>
          <Link href="/library">Library</Link>
          <Link href="/learning">Learning</Link>
        </div>

        <div className="text-2xl font-bold">
          <button>Get started!</button>
        </div>
      </div>
    </>
  );
}
