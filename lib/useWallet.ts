"use client";

import { ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";

import { ensureDiscovered, pickDetail, pickProvider, setChosenRdns } from "./wallet";
import { ARC_CHAIN_HEX, ARC_RPC, switchToArc } from "./arcNetwork";

// Compare a wallet-reported chainId against ARC's, case-insensitively.
const onArc = (id: unknown) => String(id).toLowerCase() === ARC_CHAIN_HEX.toLowerCase();

/**
 * The single source of truth for wallet state. EIP-6963 discovery (Rabby
 * first) picks a provider, we pin it, then every balance read, account read
 * and event listener flows through that same provider. The page holds this
 * state and hands it down to the header.
 */
export function useWallet() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [chainOk, setChainOk] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Read the native (USDC) balance straight off the ARC RPC.
  const refreshBalance = useCallback(async (addr: string) => {
    try {
      const rpc = new ethers.JsonRpcProvider(ARC_RPC);
      const wei = await rpc.getBalance(addr);
      setBalance(parseFloat(ethers.formatEther(wei)).toFixed(3));
    } catch {
      setBalance("—");
    }
  }, []);

  // Explicit user-initiated connect: pick wallet, pin it, request accounts.
  const connect = useCallback(async () => {
    await ensureDiscovered();
    const detail = pickDetail();
    const injected = detail?.provider;
    if (!injected) return;

    setChosenRdns(detail.rdns); // lock this wallet in for every later call
    setConnecting(true);
    try {
      const granted = (await injected.request({ method: "eth_requestAccounts" })) as string[];
      setAccount(granted[0]);
      await switchToArc(injected);
      try {
        const chain = (await injected.request({ method: "eth_chainId" })) as string;
        setChainOk(onArc(chain));
      } catch {
        setChainOk(false);
      }
      refreshBalance(granted[0]);
    } catch {
      /* user rejected the request */
    } finally {
      setConnecting(false);
    }
  }, [refreshBalance]);

  // Silent re-hydrate on mount + live wallet event wiring.
  useEffect(() => {
    let cleanup = () => {};

    (async () => {
      await ensureDiscovered();
      const injected = pickProvider();
      if (!injected) return;

      try {
        const known = (await injected.request({ method: "eth_accounts" })) as string[];
        if (known.length) {
          setAccount(known[0]);
          refreshBalance(known[0]);
          injected
            .request({ method: "eth_chainId" })
            .then((id) => setChainOk(onArc(id)))
            .catch(() => {});
        }
      } catch {
        /* ignore */
      }

      if (!injected.on) return;

      const handleAccounts = (payload: unknown) => {
        const list = payload as string[];
        if (list.length) {
          setAccount(list[0]);
          refreshBalance(list[0]);
        } else {
          setAccount("");
          setBalance("");
          setChainOk(false);
        }
      };
      const handleChain = (payload: unknown) => setChainOk(onArc(payload));

      injected.on("accountsChanged", handleAccounts);
      injected.on("chainChanged", handleChain);
      cleanup = () => {
        injected.removeListener?.("accountsChanged", handleAccounts);
        injected.removeListener?.("chainChanged", handleChain);
      };
    })();

    return () => cleanup();
  }, [refreshBalance]);

  return { account, balance, chainOk, connecting, connect, refreshBalance };
}
