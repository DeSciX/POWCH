# POWCH

Powch is DeSciX's identity and wallet. A passkey is the identity: one biometric creates it, and the master wallet and the vault keys derive from it in the browser, so the server never holds a key. Powch lives on its own origin, `https://powch.descix.net`, and every DeSciX app reaches it as a cross-origin iframe.

This repository is the **powch** community's home. It holds:

- **the Powch developer docs** in [`docs/`](./docs/README.md): how an app signs users in and signs with Powch, the origin model, the Powch passages of the App Developer Runbook, and a runnable standalone sample. They are the source of the `powch` app's knowledge base on DeSciX, synced from this repository by the manifest [`.descix/manifests/General.json`](./.descix/manifests/General.json);
- **the `powch` Claude plugin marketplace**, which offers the `powch-specialist` plugin.

## The marketplace

```
/plugin marketplace add DeSciX/POWCH
/plugin install powch-specialist@powch
```

On Cowork: chat **+** → **Add plugins…** → **Add marketplace**.

**powch-specialist** is a sub-agent that answers Powch integration questions for app developers: `PowchClient` on a standalone site, `DeSciX.powch` inside the App Shell, the origin model, sign-in request shapes, device login, consent and Site Pass. It answers Powch integration questions from the `powch` knowledge base and runbook questions from the `daita-docs` knowledge base, both over the DeSciX connector (`https://descix.net/mcp`), and names the knowledge base and section each answer comes from. Connect the connector once: Claude Code `/mcp` → `descix` → sign in. See [plugins/powch-specialist/README.md](./plugins/powch-specialist/README.md).

## Integrating Powch in one paragraph

An app hosted in the DeSciX App Shell uses `DeSciX.powch` (`login`, `signMessage`, `signTransaction`, `signTypedData`, …); the shell owns the Powch bridge. A standalone site uses `PowchClient` from `@descix/app-sdk/powch-client` with `bridgeUrl: 'https://powch.descix.net/'`, served over HTTPS; if the site sends a `Permissions-Policy` header it delegates `publickey-credentials-get` to `https://powch.descix.net`. New account in a framed Powch always opens Powch's own page top-level in a popup, so the Powch iframe must allow popups. Every sign-in names the fields it asks for in `require`, and only the user's approval shares them. Start at [docs/integrating-powch.md](./docs/integrating-powch.md).

The App Developer Runbook is https://descix.net/prod/daita-docs/site/app-sdk/app-developer-runbook.html.

## Workspace

This repository holds the PROD workspace for app `powch` (knowledge base `General` and the marketplace), written by `descix app init`; the Powch microservice's DEV platform workspace lives in its own private repository.

## The tester app

`DeSciX/powch-sdktest` (https://github.com/DeSciX/powch-sdktest) is the powch community's tester app: an app built on the published `@descix/app-sdk` that exercises Powch sign-in and signing end to end.

## License

Everything here is under the DeSciX Community License and Membership Agreement (DCMA), version 1: [LICENSE.md](./LICENSE.md).
