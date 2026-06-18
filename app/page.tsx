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

  const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", padding: "0 24px" };
  const ranked = [...clips].sort((a, b) => (b.backed > a.backed ? 1 : b.backed < a.backed ? -1 : b.votes - a.votes));
  const list = tab === "top" ? ranked : [...clips].sort((a, b) => b.id - a.id);

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 80 }}>
      <Header account={account} balance={balance} chainOk={chainOk} connecting={connecting} onConnect={connect} />

      <>
          {/* hero */}
          <section style={{ ...wrap, paddingTop: 56, paddingBottom: 20 }}>
            <div className="label" style={{ marginBottom: 22 }}>Onchain video voting · ARC Testnet</div>
            <h1 className="serif" style={{ fontSize: "clamp(44px, 7vw, 92px)", letterSpacing: "-0.02em" }}>
              Likes are free.
            </h1>
            <h1 className="serif-i" style={{ fontSize: "clamp(44px, 7vw, 92px)", color: "var(--accent)", marginBottom: 22 }}>
              Votes cost money.
            </h1>
            <p style={{ fontSize: 17, color: "var(--muted)", maxWidth: 620, lineHeight: 1.6 }}>
              ClipVote ranks clips by the dollars behind them. Every vote is a{" "}
              <span style={{ color: "var(--text)" }}>USDC micro-payment</span> that lands straight in
              the creator&apos;s wallet — instant, stable, no token to buy. Only possible because ARC
              settles in native USDC.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
              <a href="#leaderboard" className="btn btn--accent">See the leaderboard ↓</a>
              {!account && <button onClick={connect} className="btn">Connect wallet</button>}
            </div>

            {/* stats */}
            <div style={{ display: "flex", gap: 36, marginTop: 44, flexWrap: "wrap", borderTop: "1px solid var(--line)", paddingTop: 24 }}>
              {[
                { label: "Clips", value: overview.clips.toString() },
                { label: "Total backed", value: "$" + fmtUsdc(overview.backed) },
                { label: "Votes cast", value: overview.votes.toString() },
              ].map((s) => (
                <div key={s.label}>
                  <div className="serif" style={{ fontSize: 32 }}>{s.value}</div>
                  <div className="label" style={{ marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* submit */}
          <section style={{ ...wrap, marginTop: 28 }}>
            <div className="card" style={{ padding: 20, display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 220px" }}>
                <div className="label" style={{ marginBottom: 8 }}>Submit a clip</div>
                <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Clip title" className="input" disabled={!account} />
              </div>
              <div style={{ flex: "2 1 320px" }}>
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
                <div style={{ flexBasis: "100%", fontSize: 13, fontWeight: 600, color: submitMsg.startsWith("✓") ? "var(--accent)" : submitMsg.startsWith("✗") ? "#e88" : "var(--muted)" }}>
                  {submitMsg}
                </div>
              )}
            </div>
          </section>

          {/* leaderboard */}
          <section id="leaderboard" style={{ ...wrap, marginTop: 40 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <h2 className="serif" style={{ fontSize: 34 }}>The Leaderboard</h2>
              <div style={{ display: "flex", gap: 8 }}>
                {(["top", "new"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)} className="btn btn--sm" style={{ textTransform: "capitalize", background: tab === t ? "var(--text)" : "transparent", color: tab === t ? "var(--bg)" : "var(--muted)", borderColor: tab === t ? "var(--text)" : "var(--line-strong)" }}>
                    {t === "top" ? "Top by $" : "Newest"}
                  </button>
                ))}
              </div>
            </div>

            {list.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: "center", color: "var(--muted)" }}>
                No clips yet. Be the first to post one ↑
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
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

          {/* why ARC */}
          <section style={{ ...wrap, marginTop: 72 }}>
            <div className="card" style={{ padding: "clamp(28px, 5vw, 56px)" }}>
              <div className="label" style={{ marginBottom: 18 }}>Why this can&apos;t exist anywhere else</div>
              <h2 className="serif" style={{ fontSize: "clamp(28px, 4vw, 46px)", maxWidth: 760, marginBottom: 20 }}>
                A vote worth a dime only makes sense if it&apos;s actually a dime.
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 28, color: "var(--muted)", fontSize: 15, lineHeight: 1.65 }}>
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
            </div>
          </section>

          {/* how */}
          <section style={{ ...wrap, marginTop: 56 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden" }}>
              {[
                { n: "01", t: "Post a clip", d: "Drop a title and a video link on-chain. Free — no gas drama." },
                { n: "02", t: "Get backed", d: "Anyone votes with USDC. It goes straight to your wallet, instantly." },
                { n: "03", t: "Climb the board", d: "Clips rank by dollars, not bots. Conviction you can verify." },
              ].map((s) => (
                <div key={s.n} style={{ background: "var(--bg2)", padding: "26px 24px" }}>
                  <div className="serif accent-text" style={{ fontSize: 18, marginBottom: 10 }}>{s.n}</div>
                  <div className="serif" style={{ fontSize: 22, marginBottom: 8 }}>{s.t}</div>
                  <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55 }}>{s.d}</div>
                </div>
              ))}
            </div>
          </section>

          {/* footer */}
          <footer style={{ ...wrap, marginTop: 56, paddingTop: 22, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "var(--faint)" }}>ClipVote · ARC Testnet</span>
            <a href={`${ARCSCAN}/address/${CONTRACT_ADDRESS}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>
              Verified contract {shortAddr(CONTRACT_ADDRESS, 8, 6)} ↗
            </a>
          </footer>
      </>
    </div>
  );
}
