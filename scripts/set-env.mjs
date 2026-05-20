// Updates .env with provided key/value pairs.
// Usage: node scripts/set-env.mjs KEY=VALUE [KEY=VALUE ...]
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const envPath = ".env";
let lines = existsSync(envPath)
  ? readFileSync(envPath, "utf8").split(/\r?\n/)
  : [];

const updates = {};
for (const arg of process.argv.slice(2)) {
  const i = arg.indexOf("=");
  if (i === -1) continue;
  updates[arg.slice(0, i)] = arg.slice(i + 1);
}

const seen = new Set();
lines = lines.map((line) => {
  const m = line.match(/^([A-Z0-9_]+)=/);
  if (!m) return line;
  const key = m[1];
  if (key in updates) {
    seen.add(key);
    const v = updates[key];
    return `${key}="${v.replace(/"/g, '\\"')}"`;
  }
  return line;
});

for (const [k, v] of Object.entries(updates)) {
  if (!seen.has(k)) {
    lines.push(`${k}="${v.replace(/"/g, '\\"')}"`);
  }
}

writeFileSync(envPath, lines.join("\n"));
console.log("Updated .env with:", Object.keys(updates).join(", "));
