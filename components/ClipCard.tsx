"use client";

import { Clip, fmtUsdc, shortAddr, parseVideo } from "@/lib/clipvote";
import { ARCSCAN } from "@/lib/arcNetwork";

interface Props {
  clip: Clip;
  rank?: number;
  me: string;
  busy: boolean;
  msg?: string;
  onVote: (id: number, amount: string) => void;
}

const AMOUNTS = ["0.1", "0.5", "1"];

export default function ClipCard({ clip, rank, me, busy, msg, onVote }: Props) {
  const v = parseVideo(clip.url);
  const isMine = me && clip.creator.toLowerCase() === me.toLowerCase();

  return (
    <div className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* thumbnail */}
      <a
        href={v.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "relative",
          display: "block",
          aspectRatio: "16 / 9",
          background: v.thumb ? `#000 center/cover no-repeat url(${v.thumb})` : "var(--bg3)",
          borderBottom: "1px solid var(--line)",
          textDecoration: "none",
        }}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.18)" }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 46, height: 46, borderRadius: 999, background: "rgba(10,10,11,0.7)", border: "1px solid var(--line-strong)" }}>
            <svg width="14" height="14" viewBox="0 0 100 100"><path d="M34 26 L74 50 L34 74 Z" fill="#f3f1ea" /></svg>
          </span>
        </div>
        {rank != null && (
          <span className="serif" style={{ position: "absolute", top: 8, left: 12, fontSize: 26, color: "var(--text)", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
            {rank}
          </span>
        )}
        <span className="label" style={{ position: "absolute", bottom: 8, right: 12, fontSize: 9.5, color: "var(--text)", opacity: 0.8 }}>
          {v.kind === "link" ? "Watch ↗" : v.kind}
        </span>
      </a>

      {/* body */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 19, lineHeight: 1.12, marginBottom: 6 }}>
            {clip.title}
          </div>
          <a href={`${ARCSCAN}/address/${clip.creator}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}>
            by {isMine ? "you" : shortAddr(clip.creator)}
          </a>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="accent-text serif" style={{ fontSize: 24 }}>${fmtUsdc(clip.backed)}</span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>backed · {clip.votes} {clip.votes === 1 ? "vote" : "votes"}</span>
        </div>

        {isMine ? (
          <div className="pill" style={{ alignSelf: "flex-start" }}>Your clip</div>
        ) : (
          <div style={{ display: "flex", gap: 6 }}>
            {AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => onVote(clip.id, a)}
                disabled={busy}
                className="btn btn--sm"
                style={{ flex: 1, padding: "8px 0", borderColor: "var(--accent)", color: "var(--accent)" }}
              >
                +${a}
              </button>
            ))}
          </div>
        )}
        {msg && (
          <div style={{ fontSize: 12, fontWeight: 600, color: msg.startsWith("✓") ? "var(--accent)" : msg.startsWith("✗") ? "#e88" : "var(--muted)" }}>
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
