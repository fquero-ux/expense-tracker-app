import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seguimiento de Gastos",
  description: "Gestiona tus finanzas personales de forma simple y segura",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Gastos",
  },
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Global Sync Verification Banner */}
        <div className="bg-purple-600 text-white text-[10px] py-1 text-center font-bold sticky top-0 z-50">
          DEPLOYMENT VERIFICATION: v4.0-STABLE | API: GEMINI-1.5-FLASH-LATEST
        </div>
        {children}
      </body>
    </html>
  );
}
