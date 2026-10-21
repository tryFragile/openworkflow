import { monacoSanitizer } from "./monaco-sanitizer.js";
import DOMPurify from "dompurify";
import { createRequire } from "node:module";
import { build } from "vite";
import { expect, it } from "vitest";

it("bundles the patched sanitizer instead of Monaco's embedded copy", async () => {
  expect(DOMPurify.version).toBe("3.4.17");
  const require = createRequire(import.meta.url);
  const result = await build({
    configFile: false,
    logLevel: "silent",
    plugins: [monacoSanitizer()],
    build: {
      write: false,
      minify: false,
      rolldownOptions: {
        input: require.resolve("monaco-editor/base/browser/domSanitize.js"),
      },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(
    (output) => ("output" in output ? output.output : []),
  );
  const chunks = outputs.filter((output) => output.type === "chunk");
  const modules = chunks.flatMap((chunk) => chunk.moduleIds);

  expect(modules.some((id) => id.includes("/dompurify/dist/"))).toBe(true);
  expect(
    modules.some((id) =>
      id.endsWith("/monaco-editor/esm/vs/base/browser/dompurify/dompurify.js"),
    ),
  ).toBe(false);
  expect(chunks.map((chunk) => chunk.code).join("\n")).toContain(
    DOMPurify.version,
  );
});
