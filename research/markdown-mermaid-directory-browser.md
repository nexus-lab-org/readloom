# Markdown + Mermaid directory browser for `~/teach`

Research date: 2026-08-15. All claims below trace to a primary source (official
README, official docs site, or the project's own Dockerfile/config template).

## Requirements being evaluated against

- Runs as a Docker container (strongly preferred over a bare local install)
- Read-only, no auth, localhost-only
- Renders Mermaid from ```` ```mermaid ```` fenced blocks
- Browses the subfolder tree (`sentinel-cost-attribution/`, `cloudflare-workers/`,
  `sentinel-services-arch/`, `vscode-sentinel-adapter/`, `adhoc/`), not just one file
- Single `docker run` / short compose file; no build-and-deploy step per edit

## Comparison table

| Tool | Mermaid support | Directory browsing | Docker image | Build step needed | Notes |
|---|---|---|---|---|---|
| **Madness** (DannyBen) | **Built in, on by default.** Config template ships `mermaid: true` with the comment "enable mermaid diagramming and charting / put your diagram code inside ```` ```mermaid ... ``` ```` code fence" ([config template in README](https://raw.githubusercontent.com/DannyBen/madness/master/README.md)) | **Yes, auto-generated from the filesystem.** "The navigation sidebar will show all the sub directories and files in the same directory as the viewed file"; `nav_tree: true` renders "the sidebar as a recursive tree of the entire docroot, with collapsible folders" ([README](https://raw.githubusercontent.com/DannyBen/madness/master/README.md)) | **Yes, official:** `dannyben/madness` ([README Docker section](https://raw.githubusercontent.com/DannyBen/madness/master/README.md), [Docker Hub](https://hub.docker.com/r/dannyben/madness/)). Alpine-based — [Dockerfile](https://github.com/DannyBen/madness/blob/master/Dockerfile) is `FROM dannyben/alpine-ruby:3.3.3` + pandoc + `gem install madness` | **None.** Serves live from the mounted volume | Gotcha: default `exclude: ['^[a-z_\-0-9]+$']` hides all-lowercase dirs from nav — see caveats. Also has full-text search, dark theme, per-dir cover pages |
| **docsify** | Third-party plugin only. `docsify-mermaid` is maintained outside the docsify org — install by adding two CDN `<script>` tags ([plugin README](https://raw.githubusercontent.com/Leward/mermaid-docsify/master/README.md)) | **No auto directory listing.** "In order to have a sidebar, you can create your own `_sidebar.md`… First, you need to set `loadSidebar` to **true**" — hand-written and hand-maintained ([adding-pages.md](https://raw.githubusercontent.com/docsifyjs/docsify/develop/docs/adding-pages.md)) | **No official image.** Only community images (`rockbenben/docsify-server`, `afreisinger/docsify`, `sujaykumarh/docsify`, etc.) — nothing published by the docsify org | None — "no build step", renders markdown in the browser ([quickstart.md](https://raw.githubusercontent.com/docsifyjs/docsify/develop/docs/quickstart.md)) | Needs `index.html` + `README.md` + `.nojekyll` injected into `~/teach`, plus a `_sidebar.md` you must update by hand on every new note. Disqualifying for this use case |
| **MkDocs / Material for MkDocs** | Not built in; enable via `pymdownx.superfences` custom fence — "Material for MkDocs will automatically initialize the JavaScript runtime when a page includes a `mermaid` code block" ([diagrams reference](https://squidfunk.github.io/mkdocs-material/reference/diagrams/)) | **Yes, auto.** "By default `nav` will contain an alphanumerically sorted, nested list of all the Markdown files found within the `docs_dir` and its sub-directories" ([MkDocs configuration](https://www.mkdocs.org/user-guide/configuration/)) | **Yes, official:** `squidfunk/mkdocs-material`; `docker run --rm -it -p 8000:8000 -v ${PWD}:/docs squidfunk/mkdocs-material` ([creating your site](https://squidfunk.github.io/mkdocs-material/creating-your-site/)) | Rebuilds, but automatically — `mkdocs serve` "will automatically rebuild the site upon saving" ([same](https://squidfunk.github.io/mkdocs-material/creating-your-site/)) | Needs a `mkdocs.yml` (min: `site_name`, `theme: name: material`) and expects content under a `docs_dir`. Docs warn "The Docker container is intended for local previewing purposes only and is not suitable for deployment" — fine here |
| **markserv** (Python, nathan-gage) | **Yes, built in:** "Renders Mermaid diagrams from `mermaid` fenced code blocks" ([README](https://raw.githubusercontent.com/nathan-gage/markserv/main/README.md)) | **Yes:** "In directory mode, shows a sidebar for browsing multiple Markdown pages" ([README](https://raw.githubusercontent.com/nathan-gage/markserv/main/README.md)) | **No image published.** Docker is not mentioned in the README or [PyPI page](https://pypi.org/project/markserv/); install is `uv tool install markserv` / `pipx install markserv`, Python 3.11+ | None — watches files and live-reloads | Excellent feature fit, but you'd have to write and maintain your own Dockerfile, which is exactly the friction the user wants to avoid |
| **markserv** (Node, markserv/markserv) | **No.** Mermaid is not mentioned anywhere in the [README](https://raw.githubusercontent.com/markserv/markserv/master/README.md) | Yes — "serve markdown as html (GitHub style), index directories" ([README](https://raw.githubusercontent.com/markserv/markserv/master/README.md)) | Not mentioned in README | None | Different project from the Python one above despite the shared name. Ruled out on Mermaid |
| **grip** | **No.** Mermaid/diagrams are not mentioned in the [README](https://raw.githubusercontent.com/joeyespo/grip/master/README.md). It renders by POSTing to GitHub's markdown API, which returns HTML; Mermaid on github.com is a client-side frontend feature, not part of the API response | Partial — "grip supports relative URLs", so you can navigate to sibling files, but there is no folder tree UI | Not mentioned in README | None | Also needs network access to GitHub and can hit the "API's hourly rate limit", pushing you toward a personal access token ([README](https://raw.githubusercontent.com/joeyespo/grip/master/README.md)). Ruled out |
| **Flatnotes** | Not mentioned in the [README](https://github.com/dullage/flatnotes) | **No.** "No folders, notebooks or anything like that. Just all of your notes, backed by powerful search and tagging functionality" ([README](https://github.com/dullage/flatnotes)) | Yes, `dullage/flatnotes:latest` | None | Explicitly flat by design, and auth options include "none, read-only" — but the no-folders stance is disqualifying for a subfolder tree |
| **SilverBullet** | Not documented in the [README](https://raw.githubusercontent.com/silverbulletmd/silverbullet/main/README.md); Mermaid is a plug, not core | Not documented in README | Yes, `zefhemel/silverbullet`; `docker run -p 3000:3000 -v <PATH-TO-YOUR-SPACE>:/space silverbullet` ([README](https://raw.githubusercontent.com/silverbulletmd/silverbullet/main/README.md)) | None | It is a read-write PKM app with its own page model, not a read-only file browser. Over-scoped for the requirement |
| **code-server** | **Yes, now built in.** VS Code 1.121: "We've merged Matt Bierner's Markdown Preview Mermaid Support extension into VS Code as a new built-in extension" ([VS Code 1.121 release notes](https://code.visualstudio.com/updates/v1_121)); the standalone extension is [marked deprecated](https://raw.githubusercontent.com/mjbvz/vscode-markdown-mermaid/master/README.md) as a result | Yes — full file explorer | Yes, official `codercom/code-server:latest` ([install docs](https://raw.githubusercontent.com/coder/code-server/main/docs/install.md)) | None | Heavyweight: a full IDE with a terminal, not read-only, and preview requires opening each file and hitting preview rather than browsing rendered pages. Only viable if the code-server build is on VS Code >= 1.121 |

## Recommendation

**Primary: Madness (`dannyben/madness`).**

It is the only candidate that satisfies every requirement without compromise:
Mermaid is on by default (no plugin, no CDN script tag), the sidebar is generated
from the actual directory tree with collapsible folders, there is a maintained
official Alpine-based Docker image, there is no build step, and it needs no
per-folder index file. It also happens to add full-text search across the whole
docroot, which is a real upgrade over `http.server` for a notes tree that is
already ~34 files across five subfolders.

**Fallback: Material for MkDocs (`squidfunk/mkdocs-material`).**

Pick this if Madness's rendering or theming disappoints. It is the most
battle-tested option here, auto-generates nav from the directory structure when
`nav` is omitted, and `mkdocs serve` rebuilds on save so editing still feels
live. The cost is a `mkdocs.yml` plus the `pymdownx.superfences` incantation for
Mermaid, and MkDocs wants content under a `docs_dir` — workable by mounting
`~/teach` at `/docs/docs`, but it is more ceremony than Madness needs.

Not recommended: docsify (hand-maintained `_sidebar.md` and no official image),
grip (no Mermaid, needs GitHub API), Flatnotes (no folders), Python markserv
(great fit, but you'd own the Dockerfile).

## Primary pick: exact setup

### `docker run`

```bash
docker run --rm -it \
  -v ~/teach:/docs:ro \
  -p 8000:3000 \
  dannyben/madness server
```

Then open <http://localhost:8000>. The `:ro` on the bind mount enforces
read-only at the Docker layer, on top of Madness being a viewer.

The upstream README's own form is
`docker run --rm -it -v $PWD:/docs -p 3000:3000 dannyben/madness server`; the
above only swaps in `~/teach`, adds `:ro`, and maps host port 8000 to the
container's fixed 3000 to match the port they already use.

### `docker-compose.yml`

Place at `~/teach/docker-compose.yml` (or anywhere, if you make the volume path
absolute):

```yaml
services:
  teach-docs:
    image: dannyben/madness
    command: server
    volumes:
      - ~/teach:/docs:ro
    ports:
      - "127.0.0.1:8000:3000"
```

`docker compose up`, then <http://localhost:8000>. Binding to `127.0.0.1`
explicitly keeps it localhost-only regardless of Madness's own
`bind: 0.0.0.0` default.

### Required config file: `~/teach/.madness.yml`

This is the one piece of config that is genuinely necessary — without it the
existing all-lowercase folder names will not appear in the navigation (see
caveats).

```yaml
# .madness.yml

# show every directory in the nav, including all-lowercase ones
# (default is exclude: ['^[a-z_\-0-9]+$'], which would hide every folder in ~/teach)
exclude: ~

# recursive collapsible tree of the whole docroot, not just the current folder
nav_tree: true

# mermaid is already the default, stated explicitly so it is not lost on upgrade
mermaid: true

# also surface the .html files that live alongside the notes
expose_extensions: html

# directories first, then files
sort_order: dirs_first
```

Every key above appears in Madness's own generated config template (`madness
config new`) as quoted in the [README](https://raw.githubusercontent.com/DannyBen/madness/master/README.md);
the only value changed from default is `exclude`, `nav_tree`, and
`expose_extensions`.

Note that with `-v ~/teach:/docs:ro` the config file must be created on the host
inside `~/teach` before starting the container — the container cannot write it.

## Caveats

1. **The lowercase-directory rule is the big one.** Madness ships
   `exclude: ['^[a-z_\-0-9]+$']` by default, documented as: "Directories that are
   made only of lowercase letters, underscoes, dash and/or numbers
   (`/^[a-z_\-0-9]+$/`) will not be displayed in the navigation. In other words,
   directories must have at least one uppercase letter or a space to be
   recognized as a documentation directory." Every folder in `~/teach`
   (`sentinel-cost-attribution`, `cloudflare-workers`, `sentinel-services-arch`,
   `vscode-sentinel-adapter`, `adhoc`) matches that regex, so **out of the box
   the sidebar would appear empty**. `exclude: ~` in `.madness.yml` disables the
   filter entirely and is the documented fix.

2. **No per-folder index file is required**, but one improves the experience.
   Madness treats a markdown file named after the directory, or `index.md`, or
   `README.md` as that folder's "cover page". The `~/teach` folders hold
   MISSION.md / NOTES.md / GLOSSARY.md / RESOURCES.md and no README, so folder
   URLs will show the auto-generated navigation listing rather than prose. That
   is acceptable — it is strictly better than `http.server`'s listing — but
   adding a `README.md` per folder would give each mission a landing page.

3. **Mixed content handling.** Static assets are served from anywhere in the
   docroot ("You can put images and other asset files anywhere in your
   documentation folder"), so the `.js`/`.css` files will be fetched correctly by
   anything that links to them. The 26 `.html` files are served as static files;
   they will not be re-rendered or themed by Madness, and they only appear in the
   sidebar/search if you set `expose_extensions: html` as in the config above.
   If any of those `.html` files are self-contained pages, they will open and
   work; if they are fragments meant to be embedded, they will look bare.

4. **Ruby/pandoc image, so not tiny.** The Dockerfile is
   `FROM dannyben/alpine-ruby:3.3.3` plus `apk add pandoc` plus the gem. Alpine
   base keeps it modest, but pandoc is a large binary. No size is published on
   Docker Hub or in the README, so treat "small" as unverified.

5. **Pinned gem version in the published image.** The Dockerfile installs
   `madness -v 1.3.1` explicitly, so `dannyben/madness:latest` may lag the gem's
   newest release. If a config key documented in the master README does not work,
   check it against the 1.3.1 release.

6. **Fallback caveat (MkDocs):** MkDocs treats `docs_dir` as the content root and
   will copy *all* file types into the built site — "`*.js` and `*.css` files,
   just like any other type of file, are always copied from `docs_dir` into the
   site's deployed copy" — which is what you want for `~/teach`'s mixed content,
   but means the `.html` files become part of the site rather than themed pages.

## Sources

- Madness README (features, config template, Docker, hidden-directory rule): <https://raw.githubusercontent.com/DannyBen/madness/master/README.md>
- Madness Dockerfile (base image, pinned gem version): <https://github.com/DannyBen/madness/blob/master/Dockerfile>
- Madness on Docker Hub: <https://hub.docker.com/r/dannyben/madness/>
- docsify quickstart (no build step, required files): <https://raw.githubusercontent.com/docsifyjs/docsify/develop/docs/quickstart.md>
- docsify adding-pages (manual `_sidebar.md`): <https://raw.githubusercontent.com/docsifyjs/docsify/develop/docs/adding-pages.md>
- docsify-mermaid plugin (third-party, CDN install): <https://raw.githubusercontent.com/Leward/mermaid-docsify/master/README.md>
- Material for MkDocs, creating your site (official Docker image, docker run, live rebuild): <https://squidfunk.github.io/mkdocs-material/creating-your-site/>
- Material for MkDocs, diagrams (Mermaid via `pymdownx.superfences`): <https://squidfunk.github.io/mkdocs-material/reference/diagrams/>
- MkDocs configuration (auto `nav`, non-markdown file copying): <https://www.mkdocs.org/user-guide/configuration/>
- markserv (Python) README: <https://raw.githubusercontent.com/nathan-gage/markserv/main/README.md> and <https://pypi.org/project/markserv/>
- markserv (Node) README: <https://raw.githubusercontent.com/markserv/markserv/master/README.md>
- grip README: <https://raw.githubusercontent.com/joeyespo/grip/master/README.md>
- Flatnotes README (no folders, auth options): <https://github.com/dullage/flatnotes>
- SilverBullet README (Docker image): <https://raw.githubusercontent.com/silverbulletmd/silverbullet/main/README.md>
- VS Code 1.121 release notes (Mermaid now built in): <https://code.visualstudio.com/updates/v1_121>
- vscode-markdown-mermaid README (deprecated, merged into VS Code): <https://raw.githubusercontent.com/mjbvz/vscode-markdown-mermaid/master/README.md>
- code-server install docs (official image): <https://raw.githubusercontent.com/coder/code-server/main/docs/install.md>
