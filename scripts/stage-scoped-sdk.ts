import { toScopedManifest, type PackageManifest } from "./scoped-package.js";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

const SDK_WORKSPACE = "packages/openworkflow";

/**
 * Read and parse an npm manifest.
 * @param file - Path to a package.json file
 * @returns The parsed manifest
 */
function readManifest(file: string): PackageManifest {
  return JSON.parse(readFileSync(file, "utf8")) as PackageManifest;
}

/**
 * Stage the built SDK as a publishable package scoped to the fork. `npm publish`
 * applies the manifest's `files` patterns to the staged directory, so the
 * release contains the same files as an upstream `npm pack`.
 * @param destination - Directory that receives the staged package
 * @returns Path to the publishable package directory
 * @throws {Error} The SDK has not been built yet
 */
function stageScopedSdk(destination: string): string {
  const distDirectory = path.join(SDK_WORKSPACE, "dist");
  if (!existsSync(distDirectory)) {
    throw new Error(
      `${distDirectory} is missing. Run "npm run build" before staging the scoped SDK.`,
    );
  }

  const packageDirectory = path.join(destination, "github-package", "package");
  rmSync(packageDirectory, { force: true, recursive: true });
  mkdirSync(packageDirectory, { recursive: true });
  cpSync(distDirectory, path.join(packageDirectory, "dist"), {
    recursive: true,
  });
  copyFileSync(
    path.join(SDK_WORKSPACE, "README.md"),
    path.join(packageDirectory, "README.md"),
  );
  // The SDK inherits the license from the repository root rather than its workspace.
  copyFileSync("LICENSE.md", path.join(packageDirectory, "LICENSE.md"));

  const manifest = toScopedManifest(
    readManifest(path.join(SDK_WORKSPACE, "package.json")),
  );
  writeFileSync(
    path.join(packageDirectory, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  return packageDirectory;
}

process.stdout.write(
  `${stageScopedSdk(process.env["RUNNER_TEMP"] ?? os.tmpdir())}\n`,
);
