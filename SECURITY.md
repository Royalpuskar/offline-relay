# Security and privacy

Offline Relay is a local teaching model, not a production synchronization service. It has no backend, accounts, credentials, telemetry, persistent storage, or third-party runtime dependencies. Hosting still receives ordinary page requests. No edit content is uploaded by the application.

Use synthetic announcements. Exported JSON contains all proposed and receiver text, receipts, and actions. Reload/reset clears page memory. User text is rendered with textContent rather than HTML interpretation.

Operation IDs and fingerprints are protocol labels, not authentication or cryptographic signatures. The simulated receiver executes sequentially in one process. A real implementation needs authorization, atomic version checks, durable receipt storage, retention policy, transport protection, and concurrency tests.

Report reproducible issues using synthetic examples in repository issues. Never include personal data or live secrets.
