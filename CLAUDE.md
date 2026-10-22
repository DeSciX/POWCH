## DeSciX lane
LANE: app          ENV: https://descix.net (origin source: .descix/workspace.json env.apiUrl; this repo's own .descix/workspace.json env.apiUrl and wallet — `descix whoami` must agree, never an environment variable)
SDK: ONLY the published packages, as an external developer, invoked as `npx -y -p @descix/cli@4.2.0 descix …` (an `npx` call without `-p @descix/cli` resolves the wrong package); never platform source
HANDBOOK: 1 `descix tell-me-how "<question>"`  2 the docs shipped inside the published packages (@descix/cli agent-assets/, @descix/app-sdk README.md)  3 the app-developer runbook, live at https://descix.net/prod/daita-docs/site/app-sdk/app-developer-runbook.html
PLATFORM WALL: when the handbook does not answer — stop, write the question with evidence (command, output, the CLI's origin banner line) and hand it to Sam to open a platform session. Never open platform source to answer it.

# POWCH — the powch community repo

This public repository (`DeSciX/POWCH`) is the powch community's home:

- **The marketplace** `powch` (`.claude-plugin/marketplace.json`), offering the `powch-specialist` plugin under `plugins/powch-specialist/`. The repo root is a marketplace, not a plugin; it carries no root `plugin.json`.
- **The KB source** for app `powch`, knowledge base `General`: the Powch developer docs in `docs/` (`integrating-powch.md`, `origin-model.md`, `docs/README.md`), listed file by file in `.descix/manifests/General.json` (publish tier P).
- **The canonical integrator sample** in `docs/samples/standalone-react/`: a standalone host page on `PowchClient` from `@descix/app-sdk` 0.6.0. The tester app `DeSciX/powch-sdktest` is built from it.
- **The app's chat voice** in `assets/system_instructions.md` and its store text in `assets/app_description.md`.

The App Developer Runbook is not copied here; it is in the `daita-docs` knowledge base and live at the HANDBOOK URL above.

## Workspace

This repository holds the PROD workspace for app `powch` (`.descix/workspace.json`: community `powch`, KB `General`); the Powch microservice's DEV platform workspace lives in its own private repository. The powch app's site is the Powch PWA, deployed by the platform: this repo has no `site/` and no site manifest, and never runs `descix site upload`.

## Syncing the KB

Commit the docs to `main` first: the sync reads each file's blob sha at the manifest ref. From a clean checkout of `main`:

```bash
npx -y -p @descix/cli@4.2.0 descix kb corpus sync -a powch -k General --dry-run
npx -y -p @descix/cli@4.2.0 descix kb corpus sync -a powch -k General
npx -y -p @descix/cli@4.2.0 descix app sync-assets -a powch -k General
```

`--dry-run` exits 1 when there is drift; its `Drift:` line is the plan. `sync-assets` writes `assets/system_instructions.md` to the KB named by `-k` and the app description to the app record.

## License

Every file is under the DeSciX Community License and Membership Agreement (DCMA) v1 (`LICENSE.md`); `package.json` and `plugin.json` say `"license": "SEE LICENSE IN LICENSE.md"`.
