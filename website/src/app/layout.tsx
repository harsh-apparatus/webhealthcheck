import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Latenzo Console",
  description: "Real-Time Uptime. Real-World Confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased min-h-screen w-full`}>
        <ClerkProvider>{children}</ClerkProvider>
      </body>
    </html>
  );
}
