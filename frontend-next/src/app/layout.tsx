import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Supreme Data Vault",
  description: "Next-gen Blockchain Data Security",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <Providers>
          {children}
          <Toaster position="bottom-right" toastOptions={{
            style: {
              background: '#111',
              color: '#fff',
              border: '1px solid #333',
            }
          }} />
        </Providers>
      </body>
    </html>
  );
}
