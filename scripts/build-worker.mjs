import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, "..");
const entryPoint = resolve(projectRoot, "src/workers/csv-parser.worker.ts");
const outputFile = resolve(projectRoot, "public/worker/csv-parser.worker.js");

await mkdir(dirname(outputFile), { recursive: true });

await build({
  entryPoints: [entryPoint],
  outfile: outputFile,
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2017"],
  charset: "utf8",
  sourcemap: false,
  logLevel: "info",
  alias: {
    "@": resolve(projectRoot, "src"),
  },
});
