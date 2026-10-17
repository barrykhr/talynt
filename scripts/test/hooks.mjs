/**
 * Module resolution for running TypeScript tests on Node's own test runner:
 * the project's "@/" alias and extensionless relative imports, as Next resolves
 * them. Node strips the types itself (--experimental-strip-types).
 */
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));

function locate(base) {
  if (existsSync(base) && statSync(base).isFile()) return base;
  for (const ext of [".ts", ".tsx", "/index.ts"]) if (existsSync(base + ext)) return base + ext;
  return null;
}

export async function resolve(specifier, context, next) {
  let base = null;
  if (specifier.startsWith("@/")) base = path.join(root, specifier.slice(2));
  else if (/^\.\.?\//.test(specifier) && context.parentURL?.startsWith("file:")) {
    base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
  }
  const file = base && locate(base);
  let result;
  try {
    result = await next(file ? pathToFileURL(file).href : specifier, context);
  } catch (error) {
    // Packages without an exports map (next/server) need the file's extension under ESM.
    if (error?.code !== "ERR_MODULE_NOT_FOUND" || file || !/^[a-z@][^:]*\/[^.]+$/i.test(specifier)) throw error;
    result = await next(`${specifier}.js`, context);
  }
  if (result.url.endsWith(".ts")) return { ...result, format: "module-typescript" };
  return result;
}
