/* global process */

import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const children = [];

const spawnNode = (args) => {
  const child = spawn(process.execPath, args, {
    stdio: "inherit",
    shell: false,
  });

  children.push(child);

  child.on("exit", (code) => {
    if (code && code !== 0) {
      shutdown(code);
    }
  });

  return child;
};

const shutdown = (code = 0) => {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
};

const migrate = spawnSync(process.execPath, [resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"], {
  stdio: "inherit",
  shell: false,
});

if (migrate.status !== 0) {
  process.exit(migrate.status ?? 1);
}

// Spawn backend server
spawnNode(["server/v2/server.js"]);

// Spawn Vite frontend using the local binary directly
spawnNode([resolve("node_modules/vite/bin/vite.js")]);

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
