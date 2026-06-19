"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import Header from "@/components/Header";
import ClipCard from "@/components/ClipCard";
import { useWallet } from "@/lib/useWallet";
import { ARCSCAN, switchToArc } from "@/lib/arcNetwork";
import { pickProvider } from "@/lib/wallet";
import {
  CONTRACT_ADDRESS,
  CLIPVOTE_ABI,
  readContract,
  fetchOverview,
  fetchClips,
  fmtUsdc,
  shortAddr,
  type Clip,
  type Overview,
} from "@/lib/clipvote";

export default function Home() {
  const { account, balance, chainOk, connecting, connect, refreshBalance } = useWallet();

  const [overview, setOverview] = useState<Overview>({ clips: 0n, backed: 0n, votes: 0n });
  const [clips, setClips] = useState<Clip[]>([]);
  const [tab, setTab] = useState<"top" | "new">("top");

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [submitMsg, setSubmitMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [voteBusy, setVoteBusy] = useState<number | null>(null);
  const [voteMsg, setVoteMsg] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    try {
      const c = readContract();
      const [ov, cl] = await Promise.all([fetchOverview(c), fetchClips(c)]);
      setOverview(ov);
      setClips(cl);
    } catch {
      /* keep last good state */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function getWriteContract() {
    const inj = pickProvider();
    if (!inj) throw new Error("No wallet found");
    await switchToArc(inj);
    const provider = new ethers.BrowserProvider(inj);
    const signer = await provider.getSigner(account);
    return new ethers.Contract(CONTRACT_ADDRESS, CLIPVOTE_ABI, signer);
  }

  async function submitClip() {
    if (!account) return;
    const t = title.trim();
    const u = url.trim();
    if (!t) return setSubmitMsg("✗ Give your clip a title");
    if (!/^https?:\/\/.+/.test(u)) return setSubmitMsg("✗ Paste a valid video link (https://…)");
    setSubmitting(true);
    setSubmitMsg("Submitting… confirm in your wallet");
    try {
      const c = await getWriteContract();
      const tx = await c.submitClip(t, u);
      setSubmitMsg("Confirming on ARC…");
      await tx.wait();
      setSubmitMsg("✓ Clip is live");
      setTitle("");
      setUrl("");
      await load();
    } catch (e) {
      setSubmitMsg("✗ " + ((e as Error).message?.slice(0, 90) || "Failed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function vote(id: number, amount: string) {
    if (!account) {
      connect();
      return;
    }
    setVoteBusy(id);
    setVoteMsg((m) => ({ ...m, [id]: "Voting…" }));
    try {
      const c = await getWriteContract();
      const tx = await c.vote(id, { value: ethers.parseEther(amount) });
      await tx.wait();
      await load();
      if (account) await refreshBalance(account);
      setVoteMsg((m) => ({ ...m, [id]: "✓ +$" + amount }));
      setTimeout(() => setVoteMsg((m) => { const n = { ...m }; delete n[id]; return n; }), 2500);
    } catch (e) {
      setVoteMsg((m) => ({ ...m, [id]: "✗ " + ((e as Error).message?.slice(0, 60) || "Failed") }));
    } finally {
      setVoteBusy(null);
    }
  }

  const wrap: React.CSSProperties = { maxWidth: "var(--maxw)", margin: "0 auto", padding: "0 28px" };
  const ranked = [...clips].sort((a, b) => (b.backed > a.backed ? 1 : b.backed < a.backed ? -1 : b.votes - a.votes));
  const list = tab === "top" ? ranked : [...clips].sort((a, b) => b.id - a.id);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 96 }}>
      <Header account={account} balance={balance} chainOk={chainOk} connecting={connecting} onConnect={connect} />

      {/* ── hero: editorial type-led statement ─────────────────── */}
      <section
        style={{
          ...wrap,
          position: "relative",
          minHeight: "calc(100vh - 56px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingTop: 64,
          paddingBottom: 56,
        }}
      >
        {/* top meta strip */}
        <div
          className="fade-in"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: "clamp(40px, 9vh, 96px)",
          }}
        >
          <div className="label">ClipVote — Vol. I</div>
          <div className="label">Onchain video voting · ARC Testnet</div>
        </div>

        {/* the statement */}
        <div style={{ textAlign: "center" }}>
          <div className="label fade-up d1" style={{ marginBottom: 26, letterSpacing: "0.4em" }}>
            Money is the only honest signal
          </div>
          <h1
            className="serif reveal d2"
            style={{ fontSize: "clamp(54px, 12vw, 168px)", letterSpacing: "-0.03em" }}
          >
            Likes are free.
          </h1>
          <h1
            className="serif-i reveal d3"
            style={{
              fontSize: "clamp(54px, 12vw, 168px)",
              letterSpacing: "-0.03em",
              color: "var(--accent)",
            }}
          >
            Votes cost money.
          </h1>

          <p
            className="mono fade-up d4"
            style={{
              fontSize: 13.5,
              color: "var(--muted)",
              maxWidth: 640,
              lineHeight: 1.85,
              margin: "34px auto 0",
              letterSpacing: "0.02em",
            }}
          >
            ClipVote ranks clips by the dollars behind them. Every vote is a{" "}
            <span style={{ color: "var(--text)" }}>USDC micro-payment</span> that lands straight in
            the creator&apos;s wallet — instant, stable, no token to buy. Only possible because ARC
            settles in native USDC.
          </p>

          <div
            className="fade-up d5"
            style={{ display: "flex", gap: 12, marginTop: 34, flexWrap: "wrap", justifyContent: "center" }}
          >
            <a href="#leaderboard" className="btn btn--accent">Read the leaderboard ↓</a>
            {!account && <button onClick={connect} className="btn">Connect wallet</button>}
          </div>
        </div>

        {/* dictionary-definition corner */}
        <div
          className="defn fade-in d4"
          style={{ position: "absolute", left: 28, bottom: 40, maxWidth: 250, display: "none" }}
          data-corner="defn"
        >
          <b>vote</b> /vəʊt/ &nbsp;<span style={{ color: "var(--faint)" }}>noun</span>
          <br />
          a small sum of real money pledged
          <br />
          to a clip; the unit by which the
          <br />
          board ranks conviction.
        </div>

        {/* "available / initiate" corner */}
        <div
          className="label fade-in d5"
          style={{
            position: "absolute",
            right: 28,
            bottom: 40,
            textAlign: "right",
            lineHeight: 1.9,
            display: "none",
          }}
          data-corner="avail"
        >
          <span style={{ color: "var(--accent)" }}>● Live on ARC</span>
          <br />
          <a
            href="#post"
            style={{ textDecoration: "none", color: "var(--muted)" }}
          >
            Submit a clip ↗
          </a>
        </div>
      </section>

      {/* corners are float-absolute only on wide screens */}
      <style>{`
        @media (min-width: 1080px) {
          [data-corner="defn"], [data-corner="avail"] { display: block !important; }
        }
      `}</style>

      {/* ── ticker / overview stats ────────────────────────────── */}
      <section style={{ ...wrap }}>
        <hr className="rule" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 1,
            background: "var(--line)",
          }}
        >
          {[
            { label: "Clips indexed", value: overview.clips.toString() },
            { label: "Total backed", value: "$" + fmtUsdc(overview.backed) },
            { label: "Votes cast", value: overview.votes.toString() },
          ].map((s) => (
            <div key={s.label} style={{ padding: "26px 4px 4px", background: "transparent" }}>
              <div className="serif" style={{ fontSize: 40, fontWeight: 700 }}>{s.value}</div>
              <div className="label" style={{ marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <hr className="rule" style={{ marginTop: 26 }} />
      </section>

      {/* ── submit ─────────────────────────────────────────────── */}
      <section id="post" style={{ ...wrap, marginTop: 44 }}>
        <div className="label" style={{ marginBottom: 16 }}>§ Submit · post a clip on-chain</div>
        <div className="card" style={{ padding: 22, display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <div className="label" style={{ marginBottom: 9, fontSize: 9.5 }}>Title</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Clip title" className="input" disabled={!account} />
          </div>
          <div style={{ flex: "2 1 320px" }}>
            <div className="label" style={{ marginBottom: 9, fontSize: 9.5 }}>Video link</div>
            <input value={url} onChange={(e) => setUrl(e.target.value)} maxLength={300} placeholder="https://youtube.com/…  (or any video link)" className="input" disabled={!account} />
          </div>
          {account ? (
            <button onClick={submitClip} disabled={submitting} className="btn btn--accent" style={{ flex: "0 0 auto" }}>
              {submitting ? "Submitting…" : "Post clip"}
            </button>
          ) : (
            <button onClick={connect} className="btn btn--accent" style={{ flex: "0 0 auto" }}>Connect to post</button>
          )}
          {submitMsg && (
            <div className="mono" style={{ flexBasis: "100%", fontSize: 12, fontWeight: 500, letterSpacing: "0.03em", color: submitMsg.startsWith("✓") ? "var(--accent)" : submitMsg.startsWith("✗") ? "#e2a3a3" : "var(--muted)" }}>
              {submitMsg}
            </div>
          )}
        </div>
      </section>

      {/* ── leaderboard ────────────────────────────────────────── */}
      <section id="leaderboard" style={{ ...wrap, marginTop: 64 }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div className="label" style={{ marginBottom: 12 }}>§ The board · ranked by dollars</div>
            <h2 className="serif" style={{ fontSize: "clamp(38px, 6vw, 64px)", fontWeight: 800, letterSpacing: "-0.025em" }}>
              The Leaderboard
            </h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["top", "new"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="btn btn--sm"
                style={{
                  background: tab === t ? "var(--text)" : "transparent",
                  color: tab === t ? "var(--ink)" : "var(--muted)",
                  borderColor: tab === t ? "var(--text)" : "var(--line-strong)",
                }}
              >
                {t === "top" ? "Top by $" : "Newest"}
              </button>
            ))}
          </div>
        </div>

        {list.length === 0 ? (
          <div className="card" style={{ padding: 56, textAlign: "center", color: "var(--muted)" }}>
            <div className="serif-i" style={{ fontSize: 26, color: "var(--text)", marginBottom: 8 }}>
              Nothing on the board yet.
            </div>
            <div className="mono" style={{ fontSize: 12, letterSpacing: "0.04em" }}>Be the first to post a clip ↑</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(266px, 1fr))", gap: 18 }}>
            {list.map((clip) => (
              <ClipCard
                key={clip.id}
                clip={clip}
                rank={tab === "top" ? ranked.findIndex((r) => r.id === clip.id) + 1 : undefined}
                me={account}
                busy={voteBusy === clip.id}
                msg={voteMsg[clip.id]}
                onVote={vote}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── thesis ─────────────────────────────────────────────── */}
      <section id="thesis" style={{ ...wrap, marginTop: 96 }}>
        <hr className="rule" style={{ marginBottom: 40 }} />
        <div className="label" style={{ marginBottom: 22 }}>§ Thesis · why this can&apos;t exist anywhere else</div>
        <h2 className="serif" style={{ fontSize: "clamp(30px, 5vw, 58px)", maxWidth: 880, marginBottom: 36, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.02 }}>
          A vote worth a dime only makes sense if it&apos;s actually a dime.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(248px, 1fr))", gap: 32, color: "var(--muted)", fontSize: 13, lineHeight: 1.85 }} className="mono">
          <p>
            On a normal chain a &quot;paid vote&quot; means a volatile gas token, or USDC stuck behind
            ERC-20 approvals and bridges. Nobody spends ten cents through that.
          </p>
          <p>
            ARC settles in <span style={{ color: "var(--text)" }}>native USDC</span>. A vote is one tap, one
            transaction, one stable dollar amount — cheap enough to actually do, and it&apos;s real money
            the second it lands.
          </p>
          <p>
            Everything runs through <span style={{ color: "var(--text)" }}>one verified contract</span>. Every
            clip, every vote, every payout — readable by anyone on{" "}
            <a href={`${ARCSCAN}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="accent-text" style={{ textDecoration: "none" }}>ArcScan</a>.
          </p>
        </div>
      </section>

      {/* ── how ────────────────────────────────────────────────── */}
      <section style={{ ...wrap, marginTop: 72 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 4, overflow: "hidden" }}>
          {[
            { n: "01", t: "Post a clip", d: "Drop a title and a video link on-chain. Free — no gas drama." },
            { n: "02", t: "Get backed", d: "Anyone votes with USDC. It goes straight to your wallet, instantly." },
            { n: "03", t: "Climb the board", d: "Clips rank by dollars, not bots. Conviction you can verify." },
          ].map((s) => (
            <div key={s.n} style={{ background: "rgba(255,255,255,0.018)", padding: "30px 26px" }}>
              <div className="serif-i accent-text" style={{ fontSize: 22, marginBottom: 14 }}>{s.n}</div>
              <div className="serif" style={{ fontSize: 25, marginBottom: 10, fontWeight: 700 }}>{s.t}</div>
              <div className="mono" style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── footer ─────────────────────────────────────────────── */}
      <footer style={{ ...wrap, marginTop: 72, paddingTop: 26, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <span className="label" style={{ color: "var(--faint)" }}>ClipVote · ARC Testnet</span>
        <a href={`${ARCSCAN}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" className="mono" style={{ fontSize: 11.5, color: "var(--muted)", textDecoration: "none", letterSpacing: "0.04em" }}>
          Verified contract {shortAddr(CONTRACT_ADDRESS, 8, 6)} ↗
        </a>
      </footer>
    </div>
  );
}
