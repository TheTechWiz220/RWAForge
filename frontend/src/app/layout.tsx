import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SolanaProvider } from "@/components/providers/solana-provider";
import { Header } from "@/components/layout/header";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "RWAForge — AI-Powered RWA Tokenization on Solana",
  description:
    "Tokenize real world assets with Token-2022 extensions. AI valuation, KYC compliance, and marketplace trading.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen`}>
        <ThemeProvider>
          <SolanaProvider>
            <Header />
            <main className="container mx-auto px-4 py-8">{children}</main>
          </SolanaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
