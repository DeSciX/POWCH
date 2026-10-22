# Powch developer docs

These pages are the source of the `powch` app's knowledge base on DeSciX. They cover integrating Powch, DeSciX's identity and wallet, into an app, with the published `@descix/app-sdk` 0.6.0 and `@descix/cli` 4.2.0.

| Page | What it covers |
|------|----------------|
| [integrating-powch.md](./integrating-powch.md) | The two ways an app reaches Powch (`DeSciX.powch` in the App Shell, `PowchClient` on a standalone site), sign-in request shapes, consent, Site Pass, the visibility rule, device login, the DeSciX connector, and what Powch never does |
| [origin-model.md](./origin-model.md) | The identity silo at `powch.descix.net`, apps at `<appid>.descix.net`, the shell at each origin, what is stored where, the postMessage boundary, and how `descix serve` emulates the model |
| [runbook-powch.md](./runbook-powch.md) | The Powch passages of the App Developer Runbook, word for word |
| [samples/standalone-react](./samples/standalone-react/README.md) | Crypto Quest: a runnable standalone host page that signs in and signs with Powch through `PowchClient` |

The App Developer Runbook is https://descix.net/prod/daita-docs/site/app-sdk/app-developer-runbook.html.
