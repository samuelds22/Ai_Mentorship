import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doc Q&A Assistant",
  description: "Search and ask questions grounded in your uploaded documents.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
