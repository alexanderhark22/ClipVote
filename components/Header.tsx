"use client";

import Link from "next/link";
import Logo from "./Logo";
import { ARCSCAN, switchToArc } from "@/lib/arcNetwork";

interface HeaderProps {
  account: string;
  balance: string;
  chainOk: boolean;
  connecting: boolean;
  onConnect: () => void;
}

export default function Header({ account, balance, chainOk, connecting, onConnect }: HeaderProps) {
  const shortAddr = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : "";
  const wrongChain = account && !chainOk;

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(7,10,20,0.66)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--maxw)",
          margin: "0 auto",
          padding: "14px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        {/* wordmark */}
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}
        >
          <Logo size={24} />
          <span
            className="serif"
            style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em" }}
          >
            ClipVote
          </span>
        </Link>

        {/* minimal centre nav (desktop only, decorative editorial wayfinding) */}
        <nav
          className="label cv-nav"
          style={{ display: "flex", gap: 26, letterSpacing: "0.2em" }}
        >
          <a href="#leaderboard" style={{ textDecoration: "none", color: "var(--muted)" }}>
            Leaderboard
          </a>
          <a href="#thesis" style={{ textDecoration: "none", color: "var(--muted)" }}>
            Thesis
          </a>
          <a href="#post" style={{ textDecoration: "none", color: "var(--muted)" }}>
            Submit
          </a>
        </nav>

        {/* wallet rail — restrained, mono */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {wrongChain && (
            <button
              onClick={() => switchToArc().catch(() => {})}
              className="btn btn--sm"
              style={{ borderColor: "rgba(190,120,120,0.6)", color: "#e2a3a3" }}
            >
              Switch to ARC
            </button>
          )}

          {account ? (
            <span className="pill" style={{ color: "var(--text)" }}>
              <span className="accent-text" style={{ fontWeight: 600 }}>
                {balance || "0"}
              </span>
              <span style={{ color: "var(--muted)" }}>USDC</span>
              <span style={{ width: 1, height: 12, background: "var(--line-strong)" }} />
              <a
                href={`${ARCSCAN}/address/${account}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", color: "var(--muted)" }}
              >
                {shortAddr}
              </a>
            </span>
          ) : (
            <button onClick={onConnect} disabled={connecting} className="btn">
              {connecting ? "Opening…" : "Tune in wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
