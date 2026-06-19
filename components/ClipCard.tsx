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
    <div className="card row" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* thumbnail / watch */}
      <a
        href={v.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "relative",
          display: "block",
          aspectRatio: "16 / 9",
          background: v.thumb
            ? `#000 center/cover no-repeat url(${v.thumb})`
            : "linear-gradient(150deg, var(--ink-3), var(--ink))",
          borderBottom: "1px solid var(--line)",
          textDecoration: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(7,10,20,0.30)",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 46,
              height: 46,
              borderRadius: 999,
              background: "rgba(7,10,20,0.62)",
              border: "1px solid var(--accent)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 100 100">
              <path d="M36 26 L74 50 L36 74 Z" fill="var(--accent)" />
            </svg>
          </span>
        </div>

        {rank != null && (
          <span
            className="serif"
            style={{
              position: "absolute",
              top: 4,
              left: 12,
              fontSize: 44,
              lineHeight: 1,
              fontWeight: 800,
              color: "var(--text)",
              textShadow: "0 2px 14px rgba(0,0,0,0.7)",
            }}
          >
            {rank}
          </span>
        )}
        <span
          className="label"
          style={{ position: "absolute", bottom: 8, right: 12, fontSize: 9, color: "var(--text)", opacity: 0.85 }}
        >
          {v.kind === "link" ? "Watch ↗" : v.kind}
        </span>
      </a>

      {/* body */}
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <div style={{ flex: 1 }}>
          <div className="serif" style={{ fontSize: 21, lineHeight: 1.1, marginBottom: 7, fontWeight: 700 }}>
            {clip.title}
          </div>
          <a
            href={`${ARCSCAN}/address/${clip.creator}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mono"
            style={{ fontSize: 11, color: "var(--muted)", textDecoration: "none", letterSpacing: "0.04em" }}
          >
            by {isMine ? "you" : shortAddr(clip.creator)}
          </a>
        </div>

        <hr className="rule" />

        <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
          <span className="serif" style={{ fontSize: 27, fontWeight: 700, color: "var(--accent)" }}>
            ${fmtUsdc(clip.backed)}
          </span>
          <span className="mono" style={{ fontSize: 10.5, color: "var(--muted)", letterSpacing: "0.06em" }}>
            BACKED · {clip.votes} {clip.votes === 1 ? "VOTE" : "VOTES"}
          </span>
        </div>

        {isMine ? (
          <div className="pill" style={{ alignSelf: "flex-start" }}>Your clip</div>
        ) : (
          <div style={{ display: "flex", gap: 7 }}>
            {AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => onVote(clip.id, a)}
                disabled={busy}
                className="btn btn--sm"
                style={{ flex: 1, padding: "9px 0", borderColor: "var(--accent)", color: "var(--accent)" }}
              >
                +${a}
              </button>
            ))}
          </div>
        )}

        {msg && (
          <div
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.03em",
              color: msg.startsWith("✓") ? "var(--accent)" : msg.startsWith("✗") ? "#e2a3a3" : "var(--muted)",
            }}
          >
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
