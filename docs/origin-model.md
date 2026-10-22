# The Powch origin model, and how `descix serve` emulates it

Powch is a single sign-on of identity cards plus a wallet. The passkey is the identity: the master wallet and the vault keys derive in the browser from the passkey's PRF output, and the server never holds them. Powch's home is one origin, the **identity silo**. Every other DeSciX surface is a separate **host origin** that embeds Powch as a cross-origin iframe and talks to it only over postMessage. That cross-origin iframe is the security boundary, by design.

## 1. The origins

| Origin (production · under `descix serve`) | What runs there | WebAuthn rpID | Storage it owns |
|---|---|---|---|
| **Platform apex** · `https://descix.net` · not served by `descix serve` | The DeSciX shell, top-level, as the store. It mounts the Powch sidebar iframe. | none: no WebAuthn call runs in the shell or in `@descix/app-sdk` | the host shell session (`sessionInfo`, `loginStatus` in that origin's `localStorage`) |
| **App host** · `https://<appid>.descix.net` · `https://localhost:<gateway port>` (default `5173`) | The same shell, top-level, booted for one app from `/__descix/app-binding.json`. It mounts the Powch sidebar iframe. | none | its own host shell session |
| **App frame**, inside the app host and same-origin with it · `https://<appid>.descix.net/prod/<appid>/site/index.html` · `https://localhost:<gateway port>/p/<appid>` | The app's own site, in an iframe. In-app Powch widgets do not mount a second sidebar. | none | shares the app host's storage |
| **Powch, the identity silo** · `https://powch.descix.net` · under `descix serve` with the production API: the same deployed `https://powch.descix.net/` | The Powch app, in its own shell instance. It runs top-level at this origin, and as the iframe inside every host. | exactly `powch.descix.net`, never widened | the credential id, the encrypted Tier 3 store (Site Pass cards, remembered consent, active cards and holdings), and Powch's own shell session |

The shell runs separately at each origin: the apex, every app host and Powch each have their own instance and their own session.

### 1.1 Which Powch `descix serve` embeds

`descix serve` serves the deployed shell, proxied from the API origin (`https://descix.net` by default). That shell's sidebar loads the Powch URL built into the deployed bundle, `https://powch.descix.net/`. The Powch page's own API calls carry its own origin, so the rpID under serve is `powch.descix.net`, exactly as deployed: the passkey you use under serve is the same passkey you use on production.

### 1.2 Storage under a `localhost` top-level

The serve host `https://localhost:<port>` is cross-site to `powch.descix.net`, while every deployed host is same-site with it (`*.descix.net`). The browser therefore keys the Powch iframe's storage to the `localhost` top-level site.

The passkey stays the one identity: the same credential, at the same rpID. But three things under a `localhost` top-level are separate from those at `powch.descix.net` top-level and under `*.descix.net` hosts:

- the stored credential id;
- the Tier 3 store (Site Passes and remembered consent);
- Powch's own shell session.

With storage partitioning on (Chrome's default), a key the Powch frame writes under a `localhost` top-level is not readable from a top-level `https://powch.descix.net/` tab, and the reverse. Browser automation that disables third-party storage partitioning shows shared storage that a user's browser does not have.

## 2. What lives where

**Per Powch origin**, in that origin's `localStorage` on this browser profile:

- the credential id (plaintext);
- the Tier 3 store, encrypted under a key derived from the passkey's PRF output. It holds one Site Pass card per host origin, the remembered consent per host origin, and the active card picks and holdings rows. It is read only after unlock, and it never syncs to the cloud vault;
- Powch's own DeSciX session.

**Per host origin.** Two records belong to each host origin:

- **The host's session**, in the host's own `localStorage` (`sessionInfo`, `loginStatus`), written when the bridge delivers a session after a sign-in.
- **The host's records inside Powch**, in Powch's Tier 3 store, keyed by the host origin:
  - **Site Pass card**, created or updated at every completed sign-in for that origin. It records the site name, when it was last used, the fields granted on that sign-in and the linked identity card.
  - **Remembered consent**, written only when the user ticks **Remember this choice** (unchecked by default). Only remembered consent lets a later sign-in skip the consent screen.

**Per user, in the cloud.** The vault holds the identity, email and wallet cards, encrypted with a key derived from the PRF output and the credential id. The server stores ciphertext only.

**Per device, in memory only.** The unlock is held per Powch page instance. Every page load starts LOCKED; a lock wipes the in-memory keys and the decrypted vault, and an idle timer locks after 15 minutes. Each host page embeds its own Powch iframe, a separate JavaScript realm: unlocking in one host's iframe unlocks nothing anywhere else.

**Per device, in the authenticator.** The passkey lives in the authenticator, scoped to its rpID.

## 3. The postMessage boundary

- **Host to Powch.** The bridge (`PowchClient`, or the shell's `PowchBridgeProvider`) takes the Powch origin from its configured `bridgeUrl`, which has no default. It posts every request with `targetOrigin` set to that origin, only after opening the UI and after Powch's `POWCH_READY`, and drops every inbound message whose `event.origin` is not the Powch origin.
- **Inside Powch.** Only the allowed host commands are processed. Every command except `POWCH_LOGOUT` is refused while Powch's tab is not visible. The consent origin is stamped from the browser's `event.origin`; a host-supplied origin is ignored. Replies go to the requesting window, at the requesting origin.

## 4. Where `descix serve` matches the deployed platform, and where it differs

These parts of the model match production:

- The Powch silo is the deployed one, at the same rpID (§1.1).
- The shell and the app frame share one origin. Production uses `/prod/<appid>/site/`; serve uses `/p/<appid>`.
- Powch is at a different origin from every host.
- The app binding is built the same way on both.
- The bridge's origin checks are the same code.

These are the differences:

1. **One host origin for every served app.** On production each app is its own origin. Under serve every app is `https://localhost:<gateway port>`. Switching `--app` keeps the origin, so the shell's session carries over from one app to the next, and so do Powch's Site Pass and remembered consent for that origin, held in the `localhost` partition (§1.2).
2. **No first-party auto-grant.** Production Powch treats only `https://descix.net` as first-party. A `localhost` host is never first-party, so the apex's email auto-grant is never exercised under serve.
3. **Local TLS depends on the dev certificate.** The host origin uses the workspace dev certificate, and the browser judges WebAuthn on the whole tab's TLS state. With an untrusted certificate, the passkey ceremony in the Powch iframe fails with `User cancelled`. Trusting it is `descix dev-certs`, in the App Developer Runbook §5.

## 5. What a user sees on a new host origin

A user already signed in on `https://descix.net` opens `https://egpt.descix.net/` for the first time:

1. **The page loads.** The edge serves the shell with a binding for `egpt`. The shell mounts the app frame and the hidden Powch iframe (`https://powch.descix.net/`). Powch loads its credential id, starts LOCKED and posts `POWCH_READY`. The host's `localStorage` has no session, so the shell is a guest. Nothing sends a session from Powch to the host until a sign-in completes.
2. **Sign-in opens the sidebar.** The user clicks Sign in. The shell sends `POWCH_LOGIN` with `require: ['verified_email', 'wallet_address', 'wallet_signature']` and `registerDeSciX: true`, and the sidebar slides in.
3. **The passkey unlocks the vault.** The vault is locked, so Powch shows its sign-in view. The user taps; the passkey ceremony (rpID `powch.descix.net`) yields the PRF output, and Powch derives the vault key and decrypts the vault and the Tier 3 store.
4. **The consent screen.** `egpt.descix.net` is not first-party and has no remembered consent, so the consent screen asks to share the email, wallet address and signature. **Remember this choice** is unchecked by default.
5. **Approve.** Powch writes the Site Pass for `https://egpt.descix.net`, and, only when Remember is ticked, the remembered consent for that origin. It replies to `https://egpt.descix.net` with the session.
6. **The host stores its session** in `egpt.descix.net`'s own `localStorage` and moves to CONNECTED.
7. **The next page load.** The host session is read back from the host's own `localStorage`. Powch starts LOCKED again, so any further Powch request takes another tap. A remembered consent skips step 4 after the tap.
