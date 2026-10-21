import { fileURLToPath } from "node:url";
import type { Plugin } from "vite";

const patchedSanitizer = fileURLToPath(import.meta.resolve("dompurify"));

/**
 * Use the patched package instead of Monaco's embedded sanitizer copy.
 * @returns A plugin scoped to Monaco's sanitizer import
 */
export function monacoSanitizer(): Plugin {
  return {
    name: "monaco-sanitizer",
    enforce: "pre",
    resolveId(source, importer) {
      if (
        source === "./dompurify/dompurify.js" &&
        importer
          ?.replaceAll("\\", "/")
          .endsWith("/monaco-editor/esm/vs/base/browser/domSanitize.js")
      ) {
        return patchedSanitizer;
      }

      return null;
    },
  };
}
