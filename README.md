# mcp-public-suffix-list

Mozilla Public Suffix List — eTLD parser (cached 24h)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 250+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `parse` | Split a domain into (subdomain, registrable_domain, public_suffix). |
| `public_suffix` | Just the public suffix. |
| `registrable_domain` | Domain + nearest suffix (the "site"). |
| `list_version` | Last refresh + rule count. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "public-suffix-list": {
      "url": "https://gateway.pipeworx.io/public-suffix-list/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 250+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Public Suffix List data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
