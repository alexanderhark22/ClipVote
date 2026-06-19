import type { Metadata } from "next";
import { Playfair_Display, Sometype_Mono } from "next/font/google";
import "./globals.css";

// High-contrast editorial serif for the display type.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// Restrained uppercase mono for labels / subheads / data.
const sometypeMono = Sometype_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClipVote — money is the only honest signal",
  description:
    "Likes are free, so they mean nothing. On ClipVote a vote is a native USDC micro-payment that goes straight to the creator. Clips ranked by dollars, not hearts. Only possible on ARC.",
  keywords:
    "ClipVote, ARC, USDC, video voting, onchain video, micropayments, web3, creators",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${sometypeMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
