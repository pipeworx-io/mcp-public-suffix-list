# @pipeworx/public-suffix-list

[Public Suffix List](https://publicsuffix.org) MCP — the Mozilla-maintained catalog of effective TLDs (e.g. `co.uk`, `s3.amazonaws.com`, `github.io`). Used by browsers to decide cookie-domain boundaries. Keyless; cached 24h in-pack.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `parse(domain)` — split a domain into (subdomain, registrable_domain, public_suffix)
- `public_suffix(domain)` — just the public suffix
- `registrable_domain(domain)` — domain + nearest suffix (the "site")
- `list_version()` — list refresh time + line count

## Data source

`https://publicsuffix.org/list/public_suffix_list.dat`

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

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

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
