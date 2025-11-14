import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Poneglyph",
  description: "AI-powered document search and RAG using Gemini File Search API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster 
          position="bottom-left"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2a2a2a',
              color: '#fff',
              border: '1px solid #444',
            },
            success: {
              duration: 3000,
              style: {
                background: '#1e3a2f',
                border: '1px solid #10b981',
              },
              iconTheme: {
                primary: '#10b981',
                secondary: '#1e3a2f',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#3a1f1f',
                border: '1px solid #ef4444',
              },
              iconTheme: {
                primary: '#ef4444',
                secondary: '#3a1f1f',
              },
            },
          }}
        />
      </body>
    </html>
  );
}

