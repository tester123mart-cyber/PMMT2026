import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PMMT 2026 | Mission Coordination",
  description: "Central coordination tool for PMMT 2026 medical mission trip - role allocation, clinic capacity planning, and patient ticketing.",
  keywords: ["PMMT", "medical mission", "logistics", "coordination", "clinic", "2026"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className} antialiased`}>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
