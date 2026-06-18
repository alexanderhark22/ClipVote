import { ethers } from "ethers";
import { ARC_RPC } from "./arcNetwork";

// ─────────────────────────────────────────────────────────────
// ClipVote — vote on video clips with native USDC on ARC Testnet.
// One deployed, verified contract — the single source of truth.
// ─────────────────────────────────────────────────────────────
export const CONTRACT_ADDRESS = "0xaF79A2097200591f1CDcC6f11B2b78F75001CFa8";

export const CLIPVOTE_ABI = [
  "function clipCount() view returns (uint256)",
  "function totalBacked() view returns (uint256)",
  "function totalVotes() view returns (uint256)",
  "function backedByVoter(address) view returns (uint256)",
  "function clipsOf(address) view returns (uint256[])",
  "function getClip(uint256) view returns (tuple(uint256 id, address creator, string title, string url, uint256 backed, uint256 votes, uint64 createdAt))",
  "function submitClip(string title, string url) returns (uint256)",
  "function vote(uint256 id) payable",
  "event ClipSubmitted(uint256 indexed id, address indexed creator, string title, string url)",
  "event Voted(uint256 indexed id, address indexed voter, address indexed creator, uint256 amount)",
];

export interface Clip {
  id: number;
  creator: string;
  title: string;
  url: string;
  backed: bigint;
  votes: number;
  createdAt: number;
}

export interface Overview {
  clips: bigint;
  backed: bigint;
  votes: bigint;
}

// ── read helpers ──────────────────────────────────────────────
export function readProvider() {
  return new ethers.JsonRpcProvider(ARC_RPC);
}

export function readContract(provider?: ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CLIPVOTE_ABI, provider ?? readProvider());
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  const failed: T[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    const settled = await Promise.allSettled(batch.map(fn));
    settled.forEach((s, j) => (s.status === "fulfilled" ? out.push(s.value) : failed.push(batch[j])));
  }
  if (failed.length) {
    const settled = await Promise.allSettled(failed.map(fn));
    for (const s of settled) if (s.status === "fulfilled") out.push(s.value);
  }
  return out;
}

function toClip(c: {
  id: bigint;
  creator: string;
  title: string;
  url: string;
  backed: bigint;
  votes: bigint;
  createdAt: bigint | number;
}): Clip {
  return {
    id: Number(c.id),
    creator: c.creator,
    title: c.title,
    url: c.url,
    backed: c.backed,
    votes: Number(c.votes),
    createdAt: Number(c.createdAt),
  };
}

export async function fetchOverview(contract?: ethers.Contract): Promise<Overview> {
  const c = contract ?? readContract();
  const [clips, backed, votes] = await Promise.all([c.clipCount(), c.totalBacked(), c.totalVotes()]);
  return { clips, backed, votes };
}

// Read the whole board so "Top by $" is a true global ranking (capped for safety).
const MAX_CLIPS = 500;

export async function fetchClips(contract?: ethers.Contract): Promise<Clip[]> {
  const c = contract ?? readContract();
  const count = Number(await c.clipCount());
  if (!count) return [];
  const start = Math.max(1, count - MAX_CLIPS + 1);
  const ids: number[] = [];
  for (let i = count; i >= start; i--) ids.push(i);
  return mapLimit(ids, 10, async (id) => toClip(await c.getClip(id)));
}

export async function fetchClip(id: number, contract?: ethers.Contract): Promise<Clip | null> {
  const c = contract ?? readContract();
  try {
    const cl = toClip(await c.getClip(id));
    return cl.creator === ethers.ZeroAddress ? null : cl;
  } catch {
    return null;
  }
}

export async function fetchClipsOf(addr: string, contract?: ethers.Contract): Promise<Clip[]> {
  const c = contract ?? readContract();
  const ids: bigint[] = await c.clipsOf(addr);
  return mapLimit(ids.slice(-MAX_CLIPS).map(Number), 10, async (id) => toClip(await c.getClip(id)));
}

// ── formatting ────────────────────────────────────────────────
export function shortAddr(addr: string, lead = 6, tail = 4): string {
  if (!addr) return "";
  return `${addr.slice(0, lead)}…${addr.slice(-tail)}`;
}

/** Native value is USDC (18 decimals on ARC). */
export function fmtUsdc(wei: bigint, dp = 2): string {
  const n = parseFloat(ethers.formatEther(wei));
  if (n === 0) return "0";
  if (n < 0.01) return n.toFixed(4).replace(/0+$/, "");
  const s = n.toFixed(dp);
  return s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
}

export function timeAgo(unixSeconds: number): string {
  if (!unixSeconds) return "";
  const diff = Math.floor(Date.now() / 1000) - unixSeconds;
  if (diff < 0) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export interface VideoMeta {
  kind: "youtube" | "vimeo" | "link";
  id: string;
  thumb: string;
  embed: string;
  href: string;
}

export function parseVideo(url: string): VideoMeta {
  const u = (url || "").trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) {
    return {
      kind: "youtube",
      id: yt[1],
      thumb: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`,
      embed: `https://www.youtube.com/embed/${yt[1]}`,
      href: u,
    };
  }
  const vm = u.match(/(?:^|\/\/|\.)vimeo\.com\/(?:[\w-]+\/)*(?:video\/)?(\d+)/);
  if (vm) {
    return { kind: "vimeo", id: vm[1], thumb: "", embed: `https://player.vimeo.com/video/${vm[1]}`, href: u };
  }
  return { kind: "link", id: "", thumb: "", embed: u, href: u };
}
