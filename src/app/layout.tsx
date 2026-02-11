import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SINTAS - Sistem Integrasi Administrasi Surat",
  description: "Sistem manajemen administrasi surat masuk dan surat keluar yang terintegrasi",
  keywords: ["SINTAS", "Administrasi Surat", "Surat Masuk", "Surat Keluar", "Manajemen Surat"],
  authors: [{ name: "SINTAS Team" }],
  openGraph: {
    title: "SINTAS - Sistem Integrasi Administrasi Surat",
    description: "Sistem manajemen administrasi surat masuk dan surat keluar yang terintegrasi",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
