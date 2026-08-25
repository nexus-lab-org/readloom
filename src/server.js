import fs from "node:fs";
import path from "node:path";
import express from "express";

import { renderMarkdown, renderListing, renderRootIndex, pageTemplate, breadcrumbHtml, rootIndexBreadcrumb } from "./render.js";
import { isSourceEligible, renderCodeView } from "./codeview.js";

function safeJoin(rootPath, restPath) {
  const candidate = path.resolve(rootPath, restPath || "");
  if (candidate !== rootPath && !candidate.startsWith(rootPath + path.sep)) {
    return null;
  }
  return candidate;
}

const SORT_KEYS = new Set(["name", "mtime"]);
const SORT_ORDERS = new Set(["asc", "desc"]);

function listDir(rootName, urlPrefix, absPath, sort, order) {
  const entries = fs
    .readdirSync(absPath, { withFileTypes: true })
    .filter((e) => !e.name.startsWith("."))
    .map((e) => {
      const isDir = e.isDirectory();
      const fullPath = path.join(absPath, e.name);
      return {
        name: e.name,
        isDir,
        sourceEligible: !isDir && isSourceEligible(fullPath),
        mtimeMs: fs.statSync(fullPath).mtimeMs,
      };
    })
    .sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      const cmp =
        sort === "mtime" ? a.mtimeMs - b.mtimeMs : a.name.localeCompare(b.name);
      return order === "desc" ? -cmp : cmp;
    });
  return renderListing(rootName, urlPrefix, entries, sort, order);
}

/**
 * @param {Map<string, string>} roots root name -> absolute directory path
 */
export function createApp(roots) {
  const app = express();
  app.disable("x-powered-by");
  app.set("strict routing", true);

  app.get("/", (_req, res) => {
    res.type("html").send(
      pageTemplate({
        title: "readloom",
        breadcrumb: rootIndexBreadcrumb(),
        body: renderRootIndex([...roots.keys()]),
      })
    );
  });

  app.get("/:root", (req, res) => {
    if (!roots.has(req.params.root)) return res.status(404).send("not found");
    res.redirect(301, `/${req.params.root}/`);
  });

  app.get("/:root/*", (req, res) => {
    const rootName = req.params.root;
    const rootPath = roots.get(rootName);
    if (!rootPath) return res.status(404).send("not found");

    const reqPath = req.params[0] || "";
    const absPath = safeJoin(rootPath, decodeURIComponent(reqPath));
    if (!absPath) return res.status(403).send("forbidden");
    if (!fs.existsSync(absPath)) return res.status(404).send("not found");

    const stat = fs.statSync(absPath);

    if (stat.isDirectory()) {
      const urlPrefix = `/${rootName}/${reqPath ? reqPath.replace(/\/?$/, "/") : ""}`;
      const sort = SORT_KEYS.has(req.query.sort) ? req.query.sort : "name";
      const order = SORT_ORDERS.has(req.query.order) ? req.query.order : "asc";
      const body = listDir(rootName, urlPrefix, absPath, sort, order);
      res.type("html").send(
        pageTemplate({
          title: `${rootName}/${reqPath}`,
          breadcrumb: breadcrumbHtml(rootName, reqPath, null),
          body,
        })
      );
      return;
    }

    if (path.extname(absPath).toLowerCase() === ".md") {
      const body = renderMarkdown(fs.readFileSync(absPath, "utf8"));
      const parent = reqPath.includes("/")
        ? reqPath.slice(0, reqPath.lastIndexOf("/"))
        : "";
      res.type("html").send(
        pageTemplate({
          title: path.basename(absPath),
          breadcrumb: breadcrumbHtml(rootName, parent, path.basename(absPath)),
          body,
        })
      );
      return;
    }

    if (req.query.view === "source") {
      renderCodeView(absPath).then(({ ok, html, reason }) => {
        const parent = reqPath.includes("/")
          ? reqPath.slice(0, reqPath.lastIndexOf("/"))
          : "";
        const rawUrl = `/${rootName}/${reqPath}`;
        const toggle = `<div class="view-toggle"><a href="${rawUrl}">&larr; leave source view</a></div>`;
        const body = ok
          ? `<div class="code-view">${toggle}${html}</div>`
          : `<div class="code-view">${toggle}<div class="notice">Can't render this file (${reason}). <a href="${rawUrl}">Open raw</a> instead.</div></div>`;
        res.type("html").send(
          pageTemplate({
            title: path.basename(absPath),
            breadcrumb: breadcrumbHtml(rootName, parent, path.basename(absPath)),
            body,
          })
        );
      });
      return;
    }

    res.sendFile(absPath);
  });

  return app;
}
