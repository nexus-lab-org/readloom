import path from "node:path";
import { Marked } from "marked";

const marked = new Marked({ gfm: true });

const PROMPT_USER = process.env.PROMPT_USER || "asif@readloom";
const DOC_BADGES = new Set(["MISSION", "NOTES", "GLOSSARY", "RESOURCES"]);

const FENCED_MERMAID_RE =
  /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;

function unescapeHtml(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMarkdown(mdText) {
  const body = marked.parse(mdText);
  const withMermaid = body.replace(
    FENCED_MERMAID_RE,
    (_match, code) => `<div class="mermaid">${unescapeHtml(code)}</div>`
  );
  return `<div class="doc">${withMermaid}</div>`;
}

export function breadcrumbHtml(rootName, relPath, command) {
  const parts = relPath.split("/").filter(Boolean);
  const segments = [`<a href="/${rootName}/">${escapeHtml(rootName)}</a>`];
  let acc = "";
  for (const part of parts) {
    acc += part + "/";
    segments.push(
      `<a href="/${rootName}/${acc}">${escapeHtml(part)}</a>`
    );
  }
  const pathHtml = segments.join("/");
  const cmdHtml = command
    ? ` <span class="cmd">${escapeHtml(command)}</span>`
    : "";
  const cursorClass = command ? "cursor" : "cursor blink";
  return (
    `<span class="user">${escapeHtml(PROMPT_USER)}</span>` +
    `<span class="sep">:</span>` +
    `<span class="path">~/${pathHtml}</span>` +
    `<span class="dollar">$</span>${cmdHtml}` +
    `<span class="${cursorClass}"></span>`
  );
}

export function rootIndexBreadcrumb() {
  const cursorClass = "cursor blink";
  return (
    `<span class="user">${escapeHtml(PROMPT_USER)}</span>` +
    `<span class="sep">:</span>` +
    `<span class="path">~</span>` +
    `<span class="dollar">$</span>` +
    `<span class="${cursorClass}"></span>`
  );
}

export function badgeFor(name, isDir, sourceEligible) {
  if (isDir) return { label: "DIR", css: "badge-dir" };
  const stem = path.parse(name).name.toUpperCase();
  if (DOC_BADGES.has(stem)) return { label: stem, css: `badge-${stem.toLowerCase()}` };
  if (sourceEligible) return { label: "CODE", css: "badge-code" };
  return { label: "FILE", css: "badge-file" };
}

export function renderRootIndex(rootNames) {
  if (rootNames.length === 0) {
    return '<div class="empty">-- no roots configured --</div>';
  }
  const items = rootNames
    .sort((a, b) => a.localeCompare(b))
    .map(
      (name) =>
        `<li><span class="badge badge-root">ROOT</span>` +
        `<a href="/${name}/">${escapeHtml(name)}/</a></li>`
    )
    .join("");
  return `<ul class="listing">${items}</ul>`;
}

const RENDERABLE_EXTENSIONS = new Set(["html", "htm"]);

export function renderListing(rootName, urlPrefix, entries) {
  if (entries.length === 0) {
    return '<div class="empty">-- nothing here --</div>';
  }
  const items = entries
    .map(({ name, isDir, sourceEligible }) => {
      const label = name + (isDir ? "/" : "");
      const bareHref = `${urlPrefix}${encodeURIComponent(name)}` + (isDir ? "/" : "");
      const ext = path.extname(name).slice(1).toLowerCase();
      const isRenderable = RENDERABLE_EXTENSIONS.has(ext);
      const { label: badgeLabel, css } = badgeFor(name, isDir, sourceEligible);

      if (!isDir && sourceEligible && isRenderable) {
        // page has its own rendered form (e.g. .html) — default click opens
        // that; source view is a secondary link, not the primary target.
        return (
          `<li><span class="badge ${css}">${badgeLabel}</span>` +
          `<a href="${bareHref}">${escapeHtml(label)}</a>` +
          `<a class="view-source" href="${bareHref}?view=source">source</a></li>`
        );
      }

      const href = !isDir && sourceEligible ? `${bareHref}?view=source` : bareHref;
      return (
        `<li><span class="badge ${css}">${badgeLabel}</span>` +
        `<a href="${href}">${escapeHtml(label)}</a></li>`
      );
    })
    .join("");
  return `<ul class="listing">${items}</ul>`;
}

export function pageTemplate({ title, breadcrumb, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0b0e14;
    --surface: #131822;
    --surface-2: #1a2130;
    --border: #232a3a;
    --text: #dfe4ee;
    --text-dim: #7c8698;
    --amber: #f5a623;
    --blue: #5b9dff;
    --violet: #b389f9;
    --green: #4ade80;
    --red: #ff6b6b;
    --mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    --sans: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  * { box-sizing: border-box; }
  html { background: var(--bg); }
  body {
    font-family: var(--sans);
    background: var(--bg);
    color: var(--text);
    max-width: 780px;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 5rem;
    line-height: 1.65;
  }
  a { color: var(--blue); text-decoration: none; }
  a:hover { text-decoration: underline; }
  a:focus-visible, button:focus-visible {
    outline: 2px solid var(--amber);
    outline-offset: 2px;
    border-radius: 2px;
  }

  .brand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--mono);
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    color: var(--text-dim);
    text-transform: uppercase;
    padding-bottom: 1rem;
    margin-bottom: 1.5rem;
    border-bottom: 1px solid var(--border);
  }
  .brand .brand-dot { color: var(--amber); }
  .brand .status { display: flex; align-items: center; gap: 0.4rem; }
  .brand .dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 6px var(--green);
  }

  .prompt {
    font-family: var(--mono);
    font-size: 0.9rem;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 0.7rem 0.9rem;
    margin-bottom: 2rem;
    overflow-x: auto;
    white-space: nowrap;
  }
  .prompt .user { color: var(--green); }
  .prompt .sep { color: var(--text-dim); }
  .prompt .path a { color: var(--blue); }
  .prompt .path a:hover { text-decoration: underline; }
  .prompt .dollar { color: var(--text-dim); margin: 0 0.4em; }
  .prompt .cmd { color: var(--text); }
  .prompt .cursor {
    display: inline-block;
    width: 0.55em;
    height: 1em;
    background: var(--amber);
    vertical-align: text-bottom;
    margin-left: 0.15em;
  }
  @media (prefers-reduced-motion: no-preference) {
    .prompt .cursor.blink { animation: blink 1.1s step-end infinite; }
  }
  @keyframes blink { 50% { opacity: 0; } }

  ul.listing { list-style: none; padding: 0; margin: 0; }
  ul.listing li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.55rem 0.2rem;
    border-bottom: 1px solid var(--border);
    font-family: var(--mono);
    font-size: 0.9rem;
  }
  ul.listing li:last-child { border-bottom: none; }
  ul.listing a { color: var(--text); }
  ul.listing a:hover { color: var(--amber); text-decoration: none; }
  ul.listing a.view-source {
    margin-left: auto;
    flex: none;
    font-size: 0.75rem;
    color: var(--text-dim);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0.1rem 0.5rem;
  }
  ul.listing a.view-source:hover { color: var(--amber); border-color: var(--amber); text-decoration: none; }

  .badge {
    flex: none;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    border: 1px solid transparent;
    width: 5.6rem;
    text-align: center;
  }
  .badge-dir { color: var(--text-dim); border-color: var(--border); }
  .badge-root { color: var(--amber); border-color: color-mix(in srgb, var(--amber) 35%, transparent); background: color-mix(in srgb, var(--amber) 12%, transparent); }
  .badge-mission { color: var(--amber); background: color-mix(in srgb, var(--amber) 12%, transparent); border-color: color-mix(in srgb, var(--amber) 35%, transparent); }
  .badge-notes { color: var(--blue); background: color-mix(in srgb, var(--blue) 12%, transparent); border-color: color-mix(in srgb, var(--blue) 35%, transparent); }
  .badge-glossary { color: var(--violet); background: color-mix(in srgb, var(--violet) 12%, transparent); border-color: color-mix(in srgb, var(--violet) 35%, transparent); }
  .badge-resources { color: var(--green); background: color-mix(in srgb, var(--green) 12%, transparent); border-color: color-mix(in srgb, var(--green) 35%, transparent); }
  .badge-code { color: var(--green); border-color: color-mix(in srgb, var(--green) 35%, transparent); background: color-mix(in srgb, var(--green) 12%, transparent); }
  .badge-file { color: var(--text-dim); border-color: var(--border); }

  .empty { color: var(--text-dim); font-family: var(--mono); font-size: 0.9rem; padding: 1rem 0; }

  .doc h1, .doc h2, .doc h3, .doc h4 {
    font-family: var(--mono);
    font-weight: 600;
    color: var(--text);
    line-height: 1.3;
  }
  .doc h1 { font-size: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--amber); margin: 0 0 1.25rem; }
  .doc h2 { font-size: 1.15rem; margin: 2rem 0 0.75rem; }
  .doc h3 { font-size: 1rem; color: var(--text-dim); margin: 1.5rem 0 0.5rem; }
  .doc p, .doc li { color: var(--text); }
  .doc code {
    font-family: var(--mono);
    background: var(--surface-2);
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    font-size: 0.85em;
  }
  .doc pre {
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 1rem;
    overflow-x: auto;
    border-radius: 6px;
  }
  .doc pre code { background: none; padding: 0; }
  .doc table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.9rem; }
  .doc th, .doc td { border: 1px solid var(--border); padding: 0.5rem 0.8rem; text-align: left; }
  .doc th { background: var(--surface); font-family: var(--mono); font-size: 0.8rem; color: var(--text-dim); }
  .doc blockquote {
    margin: 1rem 0;
    padding: 0.4rem 1rem;
    border-left: 3px solid var(--violet);
    color: var(--text-dim);
    background: var(--surface);
  }
  .doc .mermaid {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    margin: 1.25rem 0;
    position: relative;
    height: 420px;
    overflow: hidden;
  }
  .doc .mermaid svg {
    width: 100%;
    height: 100%;
    cursor: grab;
  }
  .doc .mermaid svg:active { cursor: grabbing; }
  .doc .mermaid.maximized {
    position: fixed;
    inset: 0;
    z-index: 1000;
    height: 100vh;
    width: 100vw;
    margin: 0;
    border-radius: 0;
  }
  .mermaid-toolbar {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    z-index: 2;
    display: flex;
    gap: 0.3rem;
  }
  .mermaid-toolbar button {
    width: 1.9rem;
    height: 1.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--surface-2) 90%, transparent);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text-dim);
    font-family: var(--mono);
    font-size: 0.95rem;
    line-height: 1;
    cursor: pointer;
    padding: 0;
  }
  .mermaid-toolbar button:hover { color: var(--amber); border-color: var(--amber); }
  .mermaid-toolbar button:focus-visible { outline: 2px solid var(--amber); outline-offset: 1px; }

  .code-view .view-toggle {
    font-family: var(--mono);
    font-size: 0.8rem;
    margin-bottom: 0.75rem;
  }
  .code-view .view-toggle a { color: var(--text-dim); }
  .code-view .view-toggle a:hover { color: var(--amber); }
  .code-view pre.shiki {
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1rem 0;
    overflow-x: auto;
    font-size: 0.85rem;
    background: var(--surface) !important;
  }
  .code-view pre.shiki code { display: block; counter-reset: line; }
  .code-view pre.shiki .line { display: inline-block; width: 100%; padding: 0 1rem; }
  .code-view pre.shiki .line::before {
    content: attr(data-line);
    display: inline-block;
    width: 2.5rem;
    margin-right: 1rem;
    text-align: right;
    color: var(--text-dim);
    user-select: none;
  }
  .code-view .notice {
    font-family: var(--mono);
    font-size: 0.85rem;
    color: var(--text-dim);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 1rem;
  }
  .code-view .notice a { color: var(--blue); }
</style>
</head>
<body>
<div class="brand">
  <span><span class="brand-dot">&#9679;</span> readloom</span>
  <span class="status"><span class="dot"></span> local</span>
</div>
<div class="prompt">${breadcrumb}</div>
${body}
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.2/dist/svg-pan-zoom.min.js"></script>
<script>
  mermaid.initialize({ startOnLoad: false, theme: 'dark' });
  mermaid.run({ querySelector: '.mermaid' }).then(() => {
    document.querySelectorAll('.doc .mermaid').forEach((container) => {
      const svg = container.querySelector('svg');
      if (!svg) return;
      svg.removeAttribute('width');
      svg.removeAttribute('height');

      const panZoom = svgPanZoom(svg, {
        zoomEnabled: true,
        controlIconsEnabled: false,
        fit: true,
        center: true,
        minZoom: 0.5,
        maxZoom: 10,
      });

      const toolbar = document.createElement('div');
      toolbar.className = 'mermaid-toolbar';
      toolbar.innerHTML =
        '<button type="button" data-action="zoom-out" title="Zoom out">−</button>' +
        '<button type="button" data-action="zoom-in" title="Zoom in">+</button>' +
        '<button type="button" data-action="fit" title="Reset zoom">↻</button>' +
        '<button type="button" data-action="maximize" title="Maximize">⛶</button>';
      container.appendChild(toolbar);

      const refit = () => {
        panZoom.resize();
        panZoom.fit();
        panZoom.center();
      };

      toolbar.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;
        const action = button.dataset.action;
        if (action === 'zoom-in') panZoom.zoomIn();
        else if (action === 'zoom-out') panZoom.zoomOut();
        else if (action === 'fit') refit();
        else if (action === 'maximize') {
          const isMaximized = container.classList.toggle('maximized');
          document.body.style.overflow = isMaximized ? 'hidden' : '';
          button.innerHTML = isMaximized ? '✕' : '⛶';
          button.title = isMaximized ? 'Restore' : 'Maximize';
          requestAnimationFrame(refit);
        }
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      document.querySelectorAll('.doc .mermaid.maximized [data-action="maximize"]').forEach((btn) => btn.click());
    });
  });
</script>
</body>
</html>
`;
}
