import fs from "node:fs";
import path from "node:path";
import { codeToHtml } from "shiki";
import { bundledLanguages } from "shiki/langs";

export const MAX_RENDER_BYTES = 1024 * 1024; // 1MB

function looksBinary(buffer) {
  const sample = buffer.subarray(0, 8000);
  return sample.includes(0);
}

const EXCLUDED_EXTENSIONS = new Set(["md", "markdown"]);

export function isSourceEligible(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  if (!ext || EXCLUDED_EXTENSIONS.has(ext)) return false;
  if (!(ext in bundledLanguages)) return false;
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_RENDER_BYTES) return false;
    const fd = fs.openSync(filePath, "r");
    const buf = Buffer.alloc(8000);
    const bytesRead = fs.readSync(fd, buf, 0, 8000, 0);
    fs.closeSync(fd);
    return !looksBinary(buf.subarray(0, bytesRead));
  } catch {
    return false;
  }
}

const lineNumberTransformer = {
  line(node, line) {
    node.properties["data-line"] = line;
  },
};

export async function renderCodeView(filePath) {
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_RENDER_BYTES) {
    return {
      ok: false,
      reason: `file is ${(stat.size / 1024 / 1024).toFixed(1)}MB, over the 1MB render cap`,
    };
  }
  const buffer = fs.readFileSync(filePath);
  if (looksBinary(buffer)) {
    return { ok: false, reason: "file looks binary" };
  }
  const code = buffer.toString("utf8");
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const lang = ext in bundledLanguages ? ext : "text";
  const html = await codeToHtml(code, {
    lang,
    theme: "github-dark-dimmed",
    transformers: [lineNumberTransformer],
  });
  return { ok: true, html };
}
