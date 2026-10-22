# Integrating Powch: the developer guide

Powch is DeSciX's identity and wallet. The **passkey is the identity**: one biometric creates the passkey, and the master wallet and the vault keys derive from it in the browser. Everything else the user holds (email, wallets, Site Passes) is stored as **cards** in an encrypted vault. The server stores ciphertext only and never holds a key.

Powch lives on one origin of its own, `https://powch.descix.net`, the **identity silo**. Every app reaches it as a cross-origin iframe and talks to it only by postMessage. That boundary is the design: an app never sees the passkey, the vault or Powch's DOM. The origin model is in [origin-model.md](./origin-model.md). The App Developer Runbook is https://descix.net/prod/daita-docs/site/app-sdk/app-developer-runbook.html.

This guide uses only the published `@descix/app-sdk` 0.6.0 and `@descix/cli` 4.2.0.

## 1. Two ways an app reaches Powch

| Your app is… | You use | Who owns the Powch iframe |
|---|---|---|
| **Hosted in the DeSciX App Shell** (a DeSciX app at `https://<appid>.descix.net`, and locally under `descix serve`) | `DeSciX.powch` on the shell bus, from `DeSciXAppSDK.js` or `@descix/app-sdk`. The shell mounts `PowchBridgeProvider`, which owns the bridge and the Powch sidebar. You construct nothing. | The shell |
| **A standalone site** (your own domain, not inside the shell) | `PowchClient` from `@descix/app-sdk/powch-client`, constructed with `bridgeUrl: 'https://powch.descix.net/'` | `PowchClient`, which creates the sidebar iframe itself |

`PowchClient` detects a shell above the page. Inside the shell it delegates every call to the shell's bridge and creates no iframe. A page that a shell hosts but whose shell publishes no Powch bridge logs `[PowchClient] A DeSciX shell is hosting this page but publishes no Powch bridge. Falling back to standalone mode.`

### 1.1 Inside the App Shell: `DeSciX.powch`

```js
await DeSciX.powch.login({
  require: ['verified_email', 'wallet_address', 'wallet_signature'],
  purpose: 'Sign in to Crypto Quest',
});
const address = DeSciX.powch.getAddress();
const sig     = await DeSciX.powch.signMessage('hello', address);
```

The members of `DeSciX.powch` in `@descix/app-sdk` 0.6.0: `login(opts)`, `logout()`, `sign(data)`, `signTransaction(tx, address)`, `signMessage(message, address)`, `signTypedData(domain, types, value, address)`, `receive(params)`, `send(params)`, `open(opts)`, `isAuthenticated()`, `getAddress()`. `DeSciX.config` carries `env`, `shellOrigin` and `powchOrigin`.

`DeSciX.powch` and `DeSciX.config` appear once a Powch bridge exists and the shell is ready; the shell fires the window event `DESCX_BRIDGE_READY` at that moment. Gate on that event for `powch` and `config` only. The shell's view API (`DeSciX.view`) does not wait on Powch.

Run it locally with `descix serve` and open the gateway root, not `/p/<app_id>`; passkey sign-in there needs the gateway's certificate trusted. The commands are in the App Developer Runbook §5.

### 1.2 A standalone site: `PowchClient`

```js
import { PowchClient } from '@descix/app-sdk/powch-client';

const powch = new PowchClient({ bridgeUrl: 'https://powch.descix.net/' });
powch.createButton(document.getElementById('powch-button'), { toggle: true });

const user = await powch.auth({ require: ['verified_email', 'wallet_address'] });
// user.email, user.address, user.powchToken — only the fields the user approved
```

- **`bridgeUrl` is required and has no default.** It decides where users type a passkey and unlock a wallet, so the SDK never guesses it; an unset value throws with the ways to set it.
- **Serve the page over HTTPS** with a certificate the browser trusts.
- **If your site sends a `Permissions-Policy` header, delegate `publickey-credentials-get` to the Powch origin**, so Returning sign-in can run in Powch's frame:

  ```
  Permissions-Policy: publickey-credentials-get=(self "https://powch.descix.net")
  ```

  `PowchClient` sets `allow="publickey-credentials-get *; publickey-credentials-create *"` on its iframe. A new account is never created in the frame: New account opens Powch's own page top-level in a popup ([origin-model.md §3](./origin-model.md#3-passkeys-where-they-are-created)).
- **The Powch iframe must allow popups.** In `@descix/app-sdk` 0.6.0 `PowchClient` creates it with `sandbox="allow-scripts allow-same-origin"`, so on a standalone site New account cannot open the Powch window and the sidebar shows that the window was blocked; Returning sign-in is unaffected ([origin-model.md §4](./origin-model.md#4-a-standalone-host-embedding-powch)).

`PowchClient` methods in `@descix/app-sdk` 0.6.0:

| Method | What it does | Resolves to |
|---|---|---|
| `auth({ require, purpose })` | Sign-in; opens the sidebar first. `require` defaults to `['email']` | the approved fields: `email`, `address`, `powchToken` |
| `connectWallet({ signatureMessage, startWalletMode, instruction })` | Wallet connect | `{ connected, session }` |
| `signTransaction({ tx, address })` | Sign a transaction (`tx: { to, value, data, gasLimit }`) | `{ signedTransaction, hash }` |
| `signMessage({ message, address })` | Sign a message | `{ signature }` |
| `signTypedData({ typedData, address })` | Sign EIP-712 typed data; `typedData` is the full `{ domain, types, primaryType, message }`. A missing field, or a `primaryType` that is not a key of `types`, throws `TypedDataError` before anything is sent | `{ signature }` |
| `logout()` | Clears the Powch session and the cached user; emits `logout` | — |
| `open({ tab })` / `close()` | Shows or hides the sidebar; `tab` deep-links to one of Powch's tabs: `'cards'`, `'passes'`, `'portfolio'`, `'send_receive'`, `'activity'` | — |
| `manage()` | Opens wallet management | — |
| `getUser()` | The cached user from the last successful `auth()`; not kept across reloads | `{ email, address, powchToken }` or `null` |
| `createButton(container, options)` | A Sign in with Powch button that reflects sign-in state | the button element |
| `on(event, cb)` | Events: `ready`, `ui_open`, `ui_close`, `auth`, `logout`, `error` | — |

A request made before the iframe posts `POWCH_READY` is queued and sent on ready. If the iframe sends no `POWCH_READY` within 30 seconds, the request fails, naming the bridge URL; a posted request times out after 120 seconds.

The runnable sample is [samples/standalone-react](./samples/standalone-react/README.md).

## 2. Sign-in request shapes

Every sign-in names what it asks for in `require`. Powch routes a request by what it requires:

| The request | Powch runs |
|---|---|
| `registerDeSciX: true`, or `require` includes `verified_email` or `email` | the sign-in flow (`POWCH_LOGIN`): identity and wallet |
| `signatureMessage` set, or `require` names only wallet fields | the wallet-connect flow (`POWCH_CONNECT_WALLET`) |
| anything else | the sign-in flow (`POWCH_LOGIN`) |

DeSciX's own sign-in asks for the trio:

```js
{ require: ['verified_email', 'wallet_address', 'wallet_signature'], purpose: 'Sign in to DeSciX' }
```

The field names a host can request: `verified_email`, `email`, `wallet_address`, `wallet_signature`, `crypto_address`.

## 3. Consent: `require` is a request, never a grant

- **Empty or absent `require` shares nothing.** No consent screen is shown, because nothing was asked for, and no email, wallet address or signature reaches the host.
- **`require` can never suppress the consent screen.** Requested fields without remembered consent always show it.
- **`require` can never force sharing.** Only the user's approval releases a field, and the user may approve a subset of what you asked for. Read the fields that came back; never assume the ones you asked for.
- **Remembered consent.** The consent screen has a **Remember this choice** box, unchecked by default. Only when the user ticks it does a later sign-in from the same origin skip the screen.
- **The origin is the browser's.** Powch stamps the consent origin from the postMessage `event.origin`. A host cannot pass an origin and cannot claim another origin's consent; you do not send `origin`.
- **When the user has several cards** (two emails, two wallets), the consent screen lets them pick which card answers each field, and a remembered choice keeps that pick for your origin.
- **A verified email is required to reach CONNECTED** on a DeSciX account. Consent governs what is shared with *your* origin, not whether the account has an email.

## 4. Site Pass

Every completed sign-in for an origin writes a **Site Pass** card for that origin in the user's Powch vault: the site's name, when it was last used, the fields granted on that sign-in, and the identity card it is linked to. A host may pass `brand: { name, iconUrl, bgColor, shortDescription }` in the sign-in payload to name and style its Site Pass.

The Site Pass and the remembered consent are kept per host origin, in Powch's encrypted local store at the Powch origin. They never sync to the cloud vault. See [origin-model.md §2](./origin-model.md#5-what-lives-where).

## 5. The visibility rule

- **The host decides when the sidebar shows.** Powch never touches the host's DOM.
- **Every request opens the UI first.** The bridge calls `openUi()` before every request, then posts after two animation frames, so the sidebar paints before Powch handles the request.
- **Powch refuses requests while its tab is not visible.** A request from a backgrounded tab is answered with `{ "type": "POWCH_RESPONSE", "requestId": "...", "success": false, "error": "Powch UI not visible" }` and is not processed. `POWCH_LOGOUT` is the one command exempt from this rule.

## 6. Device login and the DeSciX connector

Both sign in with Powch. `descix login` (a device-code flow whose browser page opens the Powch panel for the passkey ceremony) is in the App Developer Runbook §3; the DeSciX connector at `https://descix.net/mcp` is in the App Developer Runbook §4, under "The connector, for claude.ai and any MCP client".

## 7. What Powch never does

- **No auth-UI fallback.** An app never renders its own password form, passkey prompt or another sign-in provider when Powch does not answer. It fails loud and names what is unreachable.
- **No server-side keys.** Keys derive in the browser from the passkey; the server stores ciphertext. An app never asks for, receives or stores a private key, a seed phrase or a service key to act for the user.
- **Never a widened rpID.** The WebAuthn relying-party ID is the exact Powch host, `powch.descix.net`; never a parent domain such as `descix.net`.
- **Never same-origin.** Powch is always on its own origin. It is never proxied under, embedded as, or served from an app's origin, and an app never reaches into Powch's frame; it uses `DeSciX.powch` or `PowchClient`.
- **No guessed origin.** `PowchClient` has no default `bridgeUrl`; an unset origin throws.
