import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ProductionProvider } from "../lib/context/ProductionContext";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OptiSched | Smart Dynamic Production Scheduling & Machine Optimization",
  description:
    "An intelligent adaptive production scheduling and machine optimization system for electronics manufacturing plants under dynamically changing conditions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased`}>
        <ProductionProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <Footer />
        </ProductionProvider>
      </body>
    </html>
  );
}

