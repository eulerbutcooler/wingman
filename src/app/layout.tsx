import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

import Navbar from "@/components/ui/navbar";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "AeroMentor - AI Learning Platform",
  description: "AI-powered learning assistant for intelligent tutoring and personalized study",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="antialiased font-sans">
        <AuthProvider>
          <ErrorBoundary>
            <div className="flex flex-col justify-center items-center min-h-screen">
              <Navbar />
              <main className="flex-grow w-full">{children}</main>
            </div>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
