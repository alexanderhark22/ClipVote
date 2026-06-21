// ---------------------------------------------------------------------------
// Wallet discovery via EIP-6963.
//
// With more than one extension installed (MetaMask, Rabby, OKX, Phantom, …)
// they all race for window.ethereum and calls get dropped. The EIP-6963
// handshake has each wallet announce itself, so we can lock onto one specific
// provider (Rabby preferred) and reuse it for every read, write and event
// subscription rather than trusting the ambient window.ethereum.
// ---------------------------------------------------------------------------

export interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isRabby?: boolean;
  isMetaMask?: boolean;
}

interface ProviderDetail {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: Eip1193Provider;
}

// Wallets we'd rather land on, most-wanted first.
const PREFERENCE = ["io.rabby", "io.metamask"];

// Where the pinned wallet's rdns lives in localStorage. Built from a couple of
// segments so the key isn't a single bare literal.
const STORE_NS = "cv";
const STORE_FIELD = "pinnedWallet";
const pinStoreKey = `${STORE_NS}:6963:${STORE_FIELD}`;

// Announced providers, de-duplicated by rdns.
const announced: ProviderDetail[] = [];

function remember(detail?: ProviderDetail) {
  if (!detail?.info?.rdns || !detail.provider) return;
  const at = announced.findIndex((d) => d.info.rdns === detail.info.rdns);
  if (at === -1) announced.push(detail);
  else announced[at] = detail;
}

if (typeof window !== "undefined") {
  window.addEventListener("eip6963:announceProvider", (e: Event) => {
    remember((e as CustomEvent<ProviderDetail>).detail);
  });
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

// --- pinned-choice persistence -------------------------------------------

export function setChosenRdns(rdns: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(pinStoreKey, rdns);
  } catch {
    /* ignore */
  }
}

export function getChosenRdns(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(pinStoreKey) || "";
  } catch {
    return "";
  }
}

// --- discovery helpers ----------------------------------------------------

export function refreshWallets() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("eip6963:requestProvider"));
}

/** Resolve once at least one wallet has announced (or a short timeout). */
export function ensureDiscovered(timeoutMs = 250): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (announced.length) {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.removeEventListener("eip6963:announceProvider", onAnnounce);
      resolve();
    };
    const onAnnounce = () => finish();
    window.addEventListener("eip6963:announceProvider", onAnnounce);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    setTimeout(finish, timeoutMs);
  });
}

export function listWallets() {
  refreshWallets();
  return announced.map((d) => ({ name: d.info.name, rdns: d.info.rdns, icon: d.info.icon }));
}

// --- provider selection ---------------------------------------------------

/** Best matching provider detail — pinned choice, then preference, then any. */
export function pickDetail(rdns?: string): { provider: Eip1193Provider; rdns: string } | undefined {
  refreshWallets();
  const want = rdns ?? getChosenRdns();
  if (want) {
    const hit = announced.find((d) => d.info.rdns === want);
    if (hit) return { provider: hit.provider, rdns: hit.info.rdns };
  }
  for (const r of PREFERENCE) {
    const hit = announced.find((d) => d.info.rdns === r);
    if (hit) return { provider: hit.provider, rdns: hit.info.rdns };
  }
  if (announced[0]) return { provider: announced[0].provider, rdns: announced[0].info.rdns };
  return undefined;
}

/** Best injected provider. Defaults to the pinned wallet, then Rabby/MetaMask. */
export function pickProvider(rdns?: string): Eip1193Provider | undefined {
  const d = pickDetail(rdns);
  if (d) return d.provider;
  return typeof window !== "undefined" ? (window.ethereum as Eip1193Provider | undefined) : undefined;
}
