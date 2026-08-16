# 🧵 readloom

[![npm version](https://img.shields.io/npm/v/readloom.svg)](https://www.npmjs.com/package/readloom)
[![license](https://img.shields.io/npm/l/readloom.svg)](./LICENSE)

A generic, multi-root markdown/code/mermaid directory browser. Point it at
one or more directories and get a dark-themed, read-only web UI with:

- **Markdown rendering** with GitHub-flavored tables, fenced code, etc.
- **Mermaid diagrams** rendered from ` ```mermaid ` fences, pannable and
  zoomable, with a maximize button to fill the whole window
- **Syntax-highlighted code view** (Shiki — real editor grammars) for any
  language it bundles, with line numbers, via a `?view=source` link
- **Multiple named roots** on one server, listed on the landing page
- Assets referenced by their own pages (`<script src>`, `<link>`) are always
  served raw, so browsing never breaks a page's own JS/CSS

## Quick start

```bash
npx readloom ~/some-directory
```

Open <http://localhost:8000>. The root name is derived from the directory's
basename.

Serve more than one directory at once:

```bash
npx readloom ~/teach ~/some-other-project
```

## Multiple named roots (`roots.yml`)

For more control over root names, use a config file instead of positional
arguments:

```yaml
# roots.yml
teach: /home/asif/teach
sentinel-services-design: /home/asif/code/oblivious/pivot/sentinel-services/docs/design
```

```bash
npx readloom --config roots.yml
```

Root names must match `^[a-z0-9-]+$` (lowercase letters, digits, hyphens).
Startup fails fast — with a clear error — on duplicate names or a path that
doesn't exist, rather than starting in a half-broken state.

## CLI options

| Flag | Env var | Default | Description |
| --- | --- | --- | --- |
| `[dir ...]` | — | — | One or more directories to serve, root name auto-derived from the basename |
| `--config <file>`, `-c` | `ROOTS_CONFIG` | `./roots.yml` if present | Load named roots from a YAML config file |
| `--port <n>`, `-p` | `PORT` | `8000` | Port to listen on |
| — | `PROMPT_USER` | `asif@readloom` | The `user@host` shown in the breadcrumb prompt |

## Docker

```bash
docker build -t readloom .
docker run -d --name readloom \
  -v ~/teach:/docs/teach:ro \
  -v ./roots.yml:/app/roots.yml:ro \
  -p 8000:8000 --restart unless-stopped readloom
```

Note: paths inside `roots.yml` are interpreted differently depending on how
you run readloom. With `npx`/`node` directly, they're real paths on your
machine. In Docker, they're paths *inside the container*, so each root also
needs a matching `-v host:container` mount.

## License

MIT — see [LICENSE](./LICENSE).
