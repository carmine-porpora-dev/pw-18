import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ticket Triage ML",
  description: "Ticket triage UI con dashboard e ML inference",
  icons: {
    icon: "/icon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
