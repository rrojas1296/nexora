import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("..", import.meta.url));
const compiler = fileURLToPath(new URL("../node_modules/typescript/bin/tsc", import.meta.url));
const compilerArguments = [compiler, "-p", "tsconfig.build.json"];
const prisma = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));
const generation = spawnSync(process.execPath, [prisma, "generate"], { cwd, stdio: "inherit" });
if (generation.status !== 0) {
  process.exit(generation.status ?? 1);
}
const initialBuild = spawnSync(process.execPath, compilerArguments, { cwd, stdio: "inherit" });

if (initialBuild.status !== 0) {
  process.exit(initialBuild.status ?? 1);
}

const processes = [
  spawn(process.execPath, [...compilerArguments, "--watch", "--preserveWatchOutput"], {
    cwd,
    stdio: "inherit",
  }),
  spawn(
    process.execPath,
    [...(process.argv.includes("--inspect") ? ["--inspect"] : []), "--watch", "dist/main.js"],
    {
      cwd,
      stdio: "inherit",
    },
  ),
];

let stopping = false;
function stop(exitCode) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) child.kill("SIGTERM");
  process.exitCode = exitCode;
}

for (const child of processes) {
  child.on("error", (error) => {
    console.error(error);
    stop(1);
  });
  child.on("exit", (code) => stop(code ?? 1));
}
process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
