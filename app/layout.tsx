import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClipVote — vote on video with real money, on ARC",
  description:
    "Likes are free, so they mean nothing. On ClipVote a vote is a native USDC micro-payment that goes straight to the creator. Clips ranked by dollars, not hearts. Only possible on ARC.",
  keywords:
    "ClipVote, ARC, USDC, video voting, onchain video, micropayments, web3, creators",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
