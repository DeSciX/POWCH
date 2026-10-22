# powch-specialist — Claude Code plugin

A sub-agent that answers app developers' questions about integrating **Powch**, DeSciX's identity and wallet: `PowchClient` on a standalone site, `DeSciX.powch` inside the App Shell, the origin model, sign-in request shapes, device login, consent and Site Pass.

The agent carries no Powch documentation of its own. It reads the `powch` app's knowledge base and `tell_me_how` over the DeSciX connector, and the App Developer Runbook, and quotes the section each answer comes from. What those sources do not state, it answers "not in the handbook".

| Piece | What it does |
|---|---|
| `powch-specialist` agent | The specialist, spawnable as a sub-agent with the developer's question in the prompt |
| `descix` MCP connector | Remote HTTP connector to the DeSciX platform (`https://descix.net/mcp`); no local server |

## Install

```
/plugin marketplace add DeSciX/POWCH
/plugin install powch-specialist@powch
```

## Connect

The plugin lists the `descix` connector; you connect it once, in the UI:

- **Claude Code**: `/mcp` → `descix` → sign in.
- **claude.ai / Cowork**: plugin page → Connectors → `descix` → Connect.

One connect is account-level and keyed by URL, so a connector you already connected for another DeSciX plugin serves this one too. Absent `descix` tools mean the connector was never connected. Knowledge-base queries draw on your DeSciX AI credits.

## License

DeSciX Community License and Membership Agreement (DCMA), version 1: [LICENSE.md](./LICENSE.md).
