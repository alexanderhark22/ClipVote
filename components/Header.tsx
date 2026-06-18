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
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(10,10,11,0.72)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "13px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Logo size={26} />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Clip<span className="accent-text">Vote</span>
          </span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {account ? (
            <>
              {!chainOk && (
                <button onClick={() => switchToArc().catch(() => {})} className="btn btn--sm" style={{ borderColor: "#7a3b3b", color: "#e88" }}>
                  Switch to ARC
                </button>
              )}
              <span className="pill" style={{ color: "var(--text)" }}>
                <span className="accent-text" style={{ fontWeight: 700 }}>{balance || "0"}</span>
                <span style={{ color: "var(--muted)" }}>USDC</span>
                <span style={{ width: 1, height: 13, background: "var(--line-strong)" }} />
                <a href={`${ARCSCAN}/address/${account}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "var(--muted)" }}>
                  {account.slice(0, 6)}…{account.slice(-4)}
                </a>
              </span>
            </>
          ) : (
            <button onClick={onConnect} disabled={connecting} className="btn btn--accent">
              {connecting ? "Connecting…" : "Connect wallet"}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
