# ClipVote

A clip nobody had heard of sat near the bottom of the board on a Tuesday. By
Wednesday it was third. Not because a swarm of accounts tapped a heart — because
nine people each sent its creator a real dime, and the board counts dollars, not
affection. That is the entire idea, and once you have seen a ranking made of
money instead of sentiment, the old kind looks like what it always was: a number
anyone can manufacture for free.

Here is the opinion this whole thing is built around. A like is the cheapest unit
of approval ever invented, and cheapness is exactly its problem. When a signal
costs nothing to produce, it carries no information — it is as easy for a bot
farm to mint a million of them as it is for a fan to mean one. Every feed you
scroll is downstream of that single design flaw. ClipVote refuses the premise. A
vote here is a payment. It costs the voter actual money, and that cost is the
point: it is the only thing a script can't fake at scale and a stranger won't do
on a whim. The leaderboard isn't measuring how many people clicked. It is
measuring how much money is willing to stand behind a clip — and money, unlike
hearts, is finite, so it has to be spent where it counts.

## How it works

You post a clip — a title and a video link (YouTube, Vimeo, or any URL). That's
a plain on-chain write; it moves no money, so it costs nothing but the network
fee to record it. The clip shows up on the board with zero dollars behind it,
waiting.

Then people vote. A vote is a USDC micro-payment — the interface nudges you
toward a dime, but you choose the amount — and the moment it confirms, that USDC
is in the creator's wallet. Not in an escrow, not in a balance you withdraw
later, not in the app's account minus a cut. The contract takes your payment and
forwards every unit of it onward in the same transaction. The board re-sorts:
clips are ranked by total dollars received (`backed`), ties broken by vote count.
There's a "Top by $" view that is the real ranking and a "Newest" view for what
just landed. Your own running spend is tracked too — `backedByVoter` — because
how much you've put behind clips is its own kind of reputation.

A few rules the contract enforces and won't bend on: a vote with zero value is
rejected, you cannot vote for your own clip, and a vote for a clip that doesn't
exist reverts before any money moves. State is updated before the payout fires
(checks-effects-interactions), so the creator is paid from a board that already
reflects the vote.

## Why this needs Arc specifically

The economics only work if the dime is real and the dime arrives. Both halves
matter, and both are where ordinary chains break the design.

If the vote is denominated in some volatile gas token, "a dime" isn't a dime —
it's a guess that might be eight cents or fourteen by the time it lands, and a
ranking built on a moving unit measures nothing. Arc settles in native USDC, so
the value you send is a stable dollar amount that means the same thing on the
board as it did in your head.

And if the rail is expensive, the whole micro-payment thesis collapses. Nobody
sends ten cents through a transaction that costs a dollar to send, or through a
maze of ERC-20 approvals and a bridge. The signal has to be cheap to produce or
it stops being a signal and becomes a luxury. On Arc the vote is one tap, one
transaction, one stable amount, with effectively all of it reaching the creator
because the contract skims nothing. That last detail is what makes the rank
honest: the dollars on the board are the dollars in creators' wallets. A payment
rail that ate a third of every vote would quietly turn a money-weighted signal
back into noise — just noise with a price tag. Here it doesn't, so the number is
true.

## The contract

Everything — submissions, votes, payouts, the running totals the homepage shows —
lives in one verified contract on Arc testnet (chain `5042002`):
[`0xaF79A2097200591f1CDcC6f11B2b78F75001CFa8`](https://testnet.arcscan.app/address/0xaF79A2097200591f1CDcC6f11B2b78F75001CFa8).
Writes are `submitClip(title, url)` and the payable `vote(id)`; everything else
is a public read — `clipCount`, `totalBacked`, `totalVotes`, `getClip(id)`,
`clipsOf(address)`, `backedByVoter(address)` — which is why the board is just the
chain, rendered. There is no server agent and no x402 endpoint in this project;
the only autonomous thing here is the contract, doing exactly one job: take a
vote, pay the creator, record the score.

Live at **[clipvote.vercel.app](https://clipvote.vercel.app)**.

— Alexander Harkness
