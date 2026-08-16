import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT_NAME_RE = /^[a-z0-9-]+$/;

function fail(message) {
  console.error(`readloom: ${message}`);
  process.exit(1);
}

function validateRoot(name, rootPath) {
  if (!ROOT_NAME_RE.test(name)) {
    fail(
      `invalid root name "${name}" (must match ${ROOT_NAME_RE} — lowercase letters, digits, hyphens only)`
    );
  }
  const resolved = path.resolve(rootPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    fail(`root "${name}" points to "${resolved}", which is not a directory`);
  }
  return resolved;
}

function loadFromConfig(configPath) {
  const raw = fs.readFileSync(configPath, "utf8");
  let parsed;
  try {
    parsed = yaml.load(raw);
  } catch (err) {
    fail(`failed to parse ${configPath}: ${err.message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail(`${configPath} must be a mapping of root name -> directory path`);
  }
  const roots = new Map();
  for (const [name, rootPath] of Object.entries(parsed)) {
    if (roots.has(name)) {
      fail(`duplicate root name "${name}" in ${configPath}`);
    }
    roots.set(name, validateRoot(name, rootPath));
  }
  if (roots.size === 0) {
    fail(`${configPath} defines no roots`);
  }
  return roots;
}

function loadFromDirs(dirs) {
  const roots = new Map();
  for (const dir of dirs) {
    const resolved = path.resolve(dir);
    const name = path.basename(resolved).toLowerCase();
    if (roots.has(name)) {
      fail(`duplicate root name "${name}" derived from "${resolved}"`);
    }
    roots.set(name, validateRoot(name, resolved));
  }
  return roots;
}

/**
 * @param {{ configPath?: string, dirs?: string[] }} opts
 * @returns {Map<string, string>} root name -> absolute directory path
 */
export function loadRoots({ configPath, dirs }) {
  if (configPath) {
    if (!fs.existsSync(configPath)) {
      fail(`config file "${configPath}" does not exist`);
    }
    return loadFromConfig(configPath);
  }
  if (dirs && dirs.length > 0) {
    return loadFromDirs(dirs);
  }
  const defaultConfig = path.resolve("roots.yml");
  if (fs.existsSync(defaultConfig)) {
    return loadFromConfig(defaultConfig);
  }
  fail(
    "no roots configured — pass one or more directories, or --config <roots.yml>"
  );
}
