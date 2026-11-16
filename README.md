# Offline Relay

<!-- portfolio-website:start -->
## Website

[Open offline-relay website](https://royalpuskar.github.io/offline-relay/)

GitHub Pages deployment was confirmed during portfolio setup.
<!-- portfolio-website:end -->

An interactive experiment in reliable delivery across simulated disconnections. Two clients edit one announcement; a versioned receiver rejects stale writes, remembers delivery receipts, and makes conflicting changes available for human review.

## What works

- Queue edits independently on two clients while the simulated receiver is disconnected.
- Deliver operations with stable identifiers and explicit base versions.
- Redeliver the same operation without applying its write twice.
- Reject changed payloads that reuse an existing idempotency key.
- Preserve both proposed and current text when a stale write conflicts.
- Review and queue a replacement with a new operation ID, or keep the receiver version.
- Export the complete state and action ledger for reproducible inspection.

This is a **browser-local protocol simulator**. It does not synchronize devices or provide a deployed API. All state is in memory; reset and reload clear it. The web page needs to load before you can use the simulation. The connection switch is a model control, not a measurement of internet access.

## Run and test

No dependencies, API keys, or installation step are needed. Use Node.js 22+ for tests and any static HTTP server for the interface.

```sh
node --test test.mjs
python3 -m http.server 8000
```

Open `http://localhost:8000`. JavaScript modules require HTTP serving rather than opening the HTML file directly.

## Reproduce a conflict

1. Select **Load conflict scenario**. A and B propose different opening times from version zero.
2. Connect the receiver and deliver `op-1`. Receiver version becomes one.
3. Redeliver `op-1`. A cached receipt is returned; version remains one.
4. Deliver `op-2`. Its base version is stale, so it conflicts without replacing the receiver text.
5. Review `op-2`, edit the replacement text, and queue the reviewed replacement.
6. Deliver `op-3`. If the receiver has not changed again, it becomes version two.

## Architecture

`engine.mjs` exports `initial()` and pure `act(state, event)` transitions. `app.mjs` binds browser controls to the engine and renders text safely. The engine simulates the receiver in the same process as the clients. `test.mjs` verifies the protocol invariants independently of the UI.

Delivery first looks up a cached receipt by operation ID and verifies the payload fingerprint. With no receipt, it compares the operation's base version with the receiver version. A match increments the receiver version and applies the text. A mismatch returns a conflict. Both results are cached. Receipt history is retained until reset.

Resolution creates a new ID against the current receiver version. It is not an unconditional overwrite: a later concurrent write can make the replacement conflict again. Pulling the receiver version never changes the base version of an already queued operation. Replayed old success receipts cannot move a client's observed version backwards.

## Validation

Eight automated tests cover offline queuing, 100 duplicate deliveries producing one write, conflict preservation, re-conflict after review, successful replacement/discard, immutable queued bases, non-regressing client versions, malformed inputs, and idempotency-key misuse. GitHub Actions runs the same suite on pushes and pull requests.

## Limits and next steps

One unresolved operation per client; one text record; sequential in-process delivery; 500 actions per experiment; 2000 characters per edit. Engine state must come from `initial`/`act`; arbitrary imported state is unsupported. Exports are evidence files, not importable backups. There is no durable storage, real network retry scheduler, authentication, encryption, multi-tab coordination, or transaction isolation proof.

Next: durable outbox storage, an authenticated transactional receiver, interrupted-response simulation, and multi-record dependencies. These are roadmap items, not implemented capabilities.

See [SECURITY.md](SECURITY.md) and [CONTRIBUTING.md](CONTRIBUTING.md). MIT license, copyright 2026 Royalpuskar.


<!-- portfolio-rights:start -->
## Copyright

© 2026 Puskar (Royalpuskar). All rights reserved except the permissions expressly granted by this repository’s MIT License. Third-party rights and notices remain with their owners.
<!-- portfolio-rights:end -->
