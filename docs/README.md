# Powch developer docs

These pages are the source of the `powch` app's knowledge base on DeSciX. They cover integrating Powch, DeSciX's identity and wallet, into an app, with the published `@descix/app-sdk` 0.6.0 and `@descix/cli` 4.2.0.

| Page | What it covers |
|------|----------------|
| [integrating-powch.md](./integrating-powch.md) | The two ways an app reaches Powch (`DeSciX.powch` in the App Shell, `PowchClient` on a standalone site), sign-in request shapes, consent, Site Pass, the visibility rule, device login, the DeSciX connector, and what Powch never does |
| [origin-model.md](./origin-model.md) | One shell per origin and Powch as the one cross-origin frame, the postMessage boundary, where passkeys are created (New account opens a Powch popup; the engine table), what a standalone host must allow, what is stored where, and `descix serve` |
| [samples/standalone-react](./samples/standalone-react/README.md) | Crypto Quest: a runnable standalone host page that signs in and signs with Powch through `PowchClient` |

The App Developer Runbook (sign-in with `descix login`, the DeSciX connector, `descix serve` and `descix dev-certs`) is https://descix.net/prod/daita-docs/site/app-sdk/app-developer-runbook.html, and it is in the `daita-docs` app's knowledge base.
