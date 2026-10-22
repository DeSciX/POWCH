# Powch in the App Developer Runbook

These are the Powch passages of the App Developer Runbook, copied word for word under their runbook section numbers. The live runbook is https://descix.net/prod/daita-docs/site/app-sdk/app-developer-runbook.html; where the two differ, the live runbook is right.

## From §2. Run the CLI: the SDK entry points

`@descix/app-sdk` 0.6.0 is the library your site code imports. Its entry points are
`@descix/app-sdk` (the React components, among them `AppShell`, `AppProvider`, `PowchClient`,
`VIEW_MODES` and `requestView`), `@descix/app-sdk/AppShell`, `@descix/app-sdk/AppData`,
`@descix/app-sdk/powch-client`, `@descix/app-sdk/share` (§7.3), `@descix/app-sdk/dev` and
`@descix/app-sdk/scaffold`; its peer dependencies are `react` and `react-dom` `^18.0.0 || ^19.0.0`.
A plain HTML site uses the `DeSciXAppSDK.js` script that `descix site init` copies in (§5.2)
instead.

## From §3. Pin production, then sign in: device login

Now sign in:

```bash
npx -y -p @descix/cli@4.2.0 descix login
```

`descix login` is a device-code flow: the CLI requests a code, opens your browser at
`https://descix.net/device?code=<code>` and polls until the browser confirms. In the browser you
see **Complete CLI Login**, then one button, **Sign In with Powch**; clicking it opens the Powch
panel on the right edge of the window, the passkey ceremony runs in that panel, and the page
ends with **CLI Login Complete — You can return to your terminal.** The credentials are saved to
`.descix/wallet.json` in your workspace root. A first-time account is created by the same
ceremony; there is no separate sign-up.

**The passkey trap:** `descix login` signs in with whichever passkey the browser offers first.
If the account is wrong, run `descix logout`, then `descix login` again and pick the right
passkey in the browser's chooser.

**Verify** — the first line and the `Email:` line are the gate, and re-check them in every new
shell before any command that changes anything:

```bash
npx -y -p @descix/cli@4.2.0 descix whoami
```

```
env: prod (.descix/workspace.json env.apiUrl) https://descix.net
```

followed by your User ID, Email, Wallet, `Session: Valid` and the hours remaining.
`descix doctor` runs the full environment check and ends with
`✨ All checks passed! Your environment is ready.`

## From §4. Connect the repository to its app: the connector

A plugin's DeSciX tools come from the DeSciX connector, `https://descix.net/mcp`, a remote HTTP
MCP server that signs the user in with OAuth: an unauthenticated request answers `401` with
`www-authenticate: Bearer resource_metadata="https://descix.net/.well-known/oauth-protected-resource"`.
Without a plugin, Claude Code registers it with
`claude mcp add --transport http descix https://descix.net/mcp`, after which `claude mcp list`
prints `descix: https://descix.net/mcp (HTTP) - ! Needs authentication` until sign-in.
`https://descix.net/connect` is the sign-in page the browser opens, not an MCP server; a
connector pointed at it does not work.

## From §5. Run it locally: `descix serve`: the shell with Powch sign-in

**Open the root, `https://localhost:<Port>/`.** That is your app inside the App Shell with Powch
sign-in. `/p/<app_id>` — despite the banner printing it — is the bare iframe target the shell
loads, with no shell and no sign-in around it; it is not a second way to run your app, and it
exists only on your local gateway, never on the deployed platform.

Static serving is a **live, per-request disk read**: rebuild your bundle into the static
directory and refresh the browser — no gateway restart.

Passkey sign-in in the shell needs the gateway's certificate trusted:
`descix dev-certs check` exits 0 when it is (`Status: trusted`); if not, run
`descix dev-certs trust` once, then quit and reopen the browser. A `User cancelled` on sign-in
is this.
