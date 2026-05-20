import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const secret = randomBytes(48).toString("hex");
const r = spawnSync(process.execPath, ["scripts/set-env.mjs", `JWT_SECRET=${secret}`], { stdio: "inherit" });
process.exit(r.status ?? 0);
