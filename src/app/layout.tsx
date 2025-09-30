import type { Metadata } from "next";

import { Inter } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/ui/navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Wingman App",
  description: "AI-powered learning assistant",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-[#f5f5f5] antialiased`}>
        <div className="flex flex-col justify-center items-center min-h-screen">
          <Navbar />
          <main className="flex-grow w-full">{children}</main>
        </div>
      </body>
    </html>
  );
}
