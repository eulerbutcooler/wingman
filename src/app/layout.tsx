import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/ui/navbar";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
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
      <body
        className={`${ubuntu.variable} antialiased`}
      >
        <div className="flex flex-col justify-center items-center min-h-screen">
          <Navbar />
          <main className="flex-grow w-full">{children}</main>
        </div>
      </body>
    </html>
  );
}
