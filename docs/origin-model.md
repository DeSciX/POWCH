# The Powch frame model

Powch is DeSciX's single sign-on and wallet. The passkey is the identity: the master wallet and the vault keys derive in the browser from the passkey's PRF output, and the server never holds them. Powch has one origin of its own, `https://powch.descix.net`, the **identity silo**. Every other DeSciX surface is a **host origin** that frames Powch cross-origin and talks to it only by postMessage. That cross-origin frame is the security boundary.

## 1. One shell document per origin, never nested

The DeSciX app shell (top bar, chat, the app's site frame, the Powch sidebar) runs once per origin, as the top document. Nothing inside an app's frame runs a second shell.

| Top document | What it frames | Same-origin with the shell | Cross-origin |
|---|---|---|---|
| `https://descix.net/`, the store | the app's site at `https://descix.net/prod/<appid>/site/` | the app's site frame | the Powch sidebar |
| `https://<appid>.descix.net/`, the app's own shell instance | the app's site at `https://<appid>.descix.net/prod/<appid>/site/` | the app's site frame | the Powch sidebar |
| `https://powch.descix.net/`, Powch top-level | nothing | — | — |

- **The store frames an app same-origin.** The shell and the app's site talk by direct JavaScript on the shell's `window.DeSciX` bus, not by messages.
- **`<appid>.descix.net` is a sibling shell instance**, the same shell bundle served at the app's host. It sits beside `descix.net`: neither frames the other.
- **Powch is the one cross-origin frame**: the sidebar, always one level under the shell, loaded from `https://powch.descix.net/` with no `sandbox` and `allow="publickey-credentials-get *; publickey-credentials-create *"`. Every `navigator.credentials` call runs in Powch's document; none runs in the shell, in the app's site or in `@descix/app-sdk`.

## 2. The postMessage boundary

- **Host to Powch.** The bridge (the shell's, or `PowchClient` on a standalone site) posts every request to the Powch origin taken from its `bridgeUrl`, only after Powch posts `POWCH_READY`, and drops every inbound message from any other origin.
- **Powch to host.** Every reply goes to the window that sent the request, addressed to that request's browser-stamped origin, never `'*'`. Only `POWCH_READY` and `POWCH_UI_CLOSE` go to the parent with no payload.
- **Inside Powch.** Only the allowed host commands are processed; every command except `POWCH_LOGOUT` is refused while Powch's tab is not visible. Consent is keyed to the browser-stamped origin; a host cannot supply one.
- **First-party continuity.** A host under `descix.net` (the store and every `<appid>.descix.net`) is first-party: a user already signed in to Powch shares the saved session to it with one click. Any other origin gets the consent screen.

## 3. Passkeys: where they are created

The WebAuthn relying-party ID is the Powch host, `powch.descix.net`, never a parent domain. Only a document at that origin can create or use the passkey; the shell cannot do it for Powch.

| Engine | `get()` (sign in) in the framed Powch | `create()` (new account) in the framed Powch | Powch top-level |
|---|---|---|---|
| Chromium (Chrome, Edge, Android) | allowed under the `publickey-credentials-get` grant | allowed under the `publickey-credentials-create` grant | allowed |
| WebKit (Safari, and every browser on iPhone and iPad) | allowed since Safari 15.5 | **never**: WebKit refuses `create()` in any document not same-origin with all its ancestors, before it reads any permissions policy | allowed |

**The New-account rule.** Because WebKit never creates a passkey in a cross-origin frame, New account in a framed Powch always opens Powch's own page top-level in a popup, on every engine, from the same tap:

1. The user taps **New account** in the sidebar. Powch opens a window at `https://powch.descix.net/` from inside that tap.
2. In the window the user taps **Create your passkey** once, verifies the email and accepts the terms. The passkey is created at the rpID `powch.descix.net`.
3. The window sends the new session to the sidebar that opened it (origin-pinned, with a one-time nonce) and closes itself.
4. The sidebar answers the host's open sign-in request with that session. The host is signed in, with no further tap and no reload.

**Returning** sign-in never leaves the sidebar: `get()` runs in the frame on both engines. After a New-account popup the sidebar's vault stays locked (the vault key never leaves the popup), so the first wallet action in the sidebar asks for one Returning tap.

The sidebar names each failure: a blocked popup (with **Open the Powch window again**), a window closed before the account was created, and a creation that failed in the window.

## 4. A standalone host embedding Powch

A site outside the DeSciX shell reaches Powch with `PowchClient` (see [integrating-powch.md](./integrating-powch.md)). The New-account rule puts one requirement on the Powch iframe: **it must allow popups.** Either it has no `sandbox` attribute, or its `sandbox` includes `allow-popups allow-popups-to-escape-sandbox` (the second token keeps the Powch window from inheriting the sandbox).

In `@descix/app-sdk` 0.6.0, `PowchClient` creates its iframe with `sandbox="allow-scripts allow-same-origin"`, which has no `allow-popups`. On a standalone host New account therefore cannot open the Powch window, and the sidebar shows that the window was blocked. Returning sign-in and every other Powch flow are unaffected.

## 5. What lives where

- **Per Powch storage partition**, in Powch's `localStorage`: the credential id; the Tier 3 store, encrypted under a key derived from the passkey's PRF output, holding one Site Pass card and the remembered consent per host origin, never synced to the cloud; Powch's own session.
- **Per host origin**, in the host's own `localStorage`: the host's session, written when a sign-in completes.
- **Per user, in the cloud**: the vault (identity, email and wallet cards), ciphertext only.
- **Per Powch page, in memory**: the unlock. Every page load starts locked; an idle timer locks after 15 minutes. Each host's Powch frame is its own realm: unlocking one unlocks nothing else.
- **In the authenticator**: the passkey, scoped to `powch.descix.net`.

## 6. Under `descix serve`

`descix serve` serves the deployed shell at `https://localhost:<port>/` (default port `5173`), the app's site same-origin at `https://localhost:<port>/p/<appid>`, and the deployed Powch, `https://powch.descix.net/`, as the sidebar. The tree is the one at `<appid>.descix.net`, with three differences:

1. **One host origin for every served app.** Switching `--app` keeps the origin, so the shell session, the Site Pass and the remembered consent carry over.
2. **`localhost` is never first-party.** A sign-in under serve shows the consent screen unless the user remembered consent for that origin.
3. **`localhost` is cross-site to Powch.** The browser partitions the Powch frame's storage under the `localhost` top-level, so its credential id, Site Passes and session are separate from those at `powch.descix.net`. The passkey is the same one, at the same rpID.

The passkey ceremony needs the workspace dev certificate trusted (`descix dev-certs`, App Developer Runbook §5); with an untrusted certificate it fails with `User cancelled`.
