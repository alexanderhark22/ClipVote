# ClipVote

> Likes are free, so they're worthless.
> Here a vote is real money.

ClipVote is a video leaderboard where every vote is a **USDC micro-payment that
goes straight to the creator**. Clips rank by the dollars behind them — not bots,
not hearts. Conviction you can verify on-chain.

**Live:** https://clipvote.vercel.app

### The catch that makes it work

A vote worth a dime only makes sense if it's actually a dime.

On most chains a "paid vote" means a volatile gas token, or USDC trapped behind
ERC-20 approvals and bridges — nobody spends ten cents through that. ARC settles
in **native USDC**, so a vote is one tap, one transaction, one stable dollar
amount. That's the whole thing. Take ARC away and the product doesn't exist.

### One contract, that's it

Every clip, every vote, every payout runs through a single verified contract on
ARC Testnet:

```
0xaF79A2097200591f1CDcC6f11B2b78F75001CFa8
```

No fees, no custody. The USDC moves wallet-to-wallet in the same transaction as
the vote, and anyone can read the whole thing on
[ArcScan](https://testnet.arcscan.app/address/0xaF79A2097200591f1CDcC6f11B2b78F75001CFa8).

### Under the hood

`Next.js` · `ethers v6` · `Solidity` · EIP-6963 wallet support (Rabby / MetaMask /
whatever) · no backend at all — it's static on Vercel and reads straight from the
chain. Connect a wallet, drop a video link, and let the dollars decide.
