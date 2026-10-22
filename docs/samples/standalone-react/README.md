# Powch standalone sample (Crypto Quest)

This sample is a **3rd-party DApp** (a hypothetical game, "Crypto Quest") that uses Powch for **Google-style SSO** (Sign in with Powch) and a **single wallet**: no MetaMask extension. The user connects a wallet, signs transactions and manages keys inside Powch.

The host page has its own theme (blue/purple), so it is clearly separate from Powch. When you click Sign in, Buy Starter NFT or Link wallet, the Powch UI opens in a sidebar iframe on the right edge of the page.

The page is plain JavaScript; it imports no React. It uses `PowchClient` from `@descix/app-sdk/powch-client` (`@descix/app-sdk` 0.6.0). It is the pattern for a site that is NOT hosted inside the DeSciX App Shell. An app inside the App Shell does not construct a `PowchClient`; it uses the shell's `DeSciX.powch` (see [../../integrating-powch.md](../../integrating-powch.md)).

## Features

- **Nav**: `createButton()`: Sign in with Powch when signed out; the email (or "My Powch") when signed in; a click toggles the Powch panel.
- **Get started**: Sign in with Powch (`powch.auth()`), Logout (`powch.logout()`).
- **In-game**: Buy Starter NFT (`powch.signTransaction({ tx })`), Link wallet (`powch.connectWallet()`).
- **Powch panel**: Open Powch panel, Open Portfolio (`powch.open({ tab: 'portfolio' })`), Open Cards (`powch.open({ tab: 'cards' })`), Manage Wallet (`powch.manage()`), Close (`powch.close()`).
- **Code hints**: hover the ⓘ next to each section to see the SDK method.

## Run

```bash
cd docs/samples/standalone-react
npm install
VITE_POWCH_BRIDGE_URL=https://powch.descix.net/ npm run dev
```

Open **https://localhost:5176/**.

- `VITE_POWCH_BRIDGE_URL` is required and has no default. Without it the dev server stops with `Set VITE_POWCH_BRIDGE_URL to the Powch origin, e.g. VITE_POWCH_BRIDGE_URL=https://powch.descix.net/ npm run dev`, and `PowchClient` itself throws when it gets no `bridgeUrl`. `https://powch.descix.net/` is production Powch.
- The dev server serves HTTPS (`@vitejs/plugin-basic-ssl`) and sends this header on every response:

  ```
  permissions-policy: publickey-credentials-create=(self "https://powch.descix.net"), publickey-credentials-get=(self "https://powch.descix.net")
  ```

  The header delegates the two WebAuthn permissions to the Powch origin, so the passkey ceremony can run inside Powch's cross-origin iframe. `PowchClient` sets the matching `allow="publickey-credentials-get *; publickey-credentials-create *"` on the iframe it creates.
- `@vitejs/plugin-basic-ssl` makes a self-signed certificate. The browser judges WebAuthn on the whole tab's TLS state, so the passkey ceremony needs a certificate the browser trusts; with an untrusted one it fails with `User cancelled`. To serve with a certificate your machine trusts, replace `basicSsl()` in `vite.config.js` with `server.https: { key, cert }` pointing at that certificate's files.

## SDK API used

- `new PowchClient({ bridgeUrl })` from `@descix/app-sdk/powch-client`.
- `powch.createButton(container, { toggle, signInLabel, signedInLabel, classNames })`.
- `powch.auth()`, `powch.logout()`, `powch.open()`, `powch.open({ tab })`, `powch.close()`, `powch.signTransaction({ tx })`, `powch.connectWallet()`, `powch.manage()`.
- `powch.on('ready' | 'ui_open' | 'ui_close' | 'error')`.

## Env

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_POWCH_BRIDGE_URL` | none (required) | The Powch origin the sidebar iframe loads, `https://powch.descix.net/` on production. |

## Files

| File | What it is |
|------|------------|
| `index.html` | The host page: nav, buttons, result panel |
| `app.js` | The `PowchClient` wiring for every button |
| `vite.config.js` | HTTPS, the `Permissions-Policy` header, and the required `VITE_POWCH_BRIDGE_URL` |
| `package.json` | `@descix/app-sdk` 0.6.0, Vite 6, `@vitejs/plugin-basic-ssl` |
