#!/usr/bin/env node
import { loadRoots } from "../src/roots.js";
import { createApp } from "../src/server.js";

function parseArgs(argv) {
  const args = { dirs: [], configPath: undefined, port: undefined };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--config" || arg === "-c") {
      args.configPath = argv[++i];
    } else if (arg === "--port" || arg === "-p") {
      args.port = Number(argv[++i]);
    } else {
      args.dirs.push(arg);
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const configPath =
  args.configPath || (process.env.ROOTS_CONFIG ? process.env.ROOTS_CONFIG : undefined);
const port = args.port || Number(process.env.PORT) || 8000;

const roots = loadRoots({ configPath, dirs: args.dirs });
const app = createApp(roots);

app.listen(port, () => {
  console.log(`beacon serving ${roots.size} root(s) at http://localhost:${port}`);
  for (const [name, dir] of roots) {
    console.log(`  /${name}/ -> ${dir}`);
  }
});
