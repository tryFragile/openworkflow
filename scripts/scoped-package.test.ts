import {
  FORK_REPOSITORY,
  GITHUB_PACKAGES_REGISTRY,
  SCOPED_PACKAGE_NAME,
  toScopedManifest,
  type PackageManifest,
} from "./scoped-package.js";
import { describe, expect, test } from "vitest";

const upstreamManifest: PackageManifest = {
  name: "openworkflow",
  version: "0.9.0",
  bugs: "https://github.com/openworkflowdev/openworkflow/issues",
  repository: {
    type: "git",
    url: "git+https://github.com/openworkflowdev/openworkflow.git",
    directory: "packages/openworkflow",
  },
  scripts: { build: "tsc" },
  devDependencies: { vitest: "^4.0.18" },
  peerDependencies: { postgres: "^3.4.9" },
};

describe("toScopedManifest", () => {
  test("publishes the SDK under the fork scope and registry", () => {
    const manifest = toScopedManifest(upstreamManifest);

    expect(manifest.name).toBe(SCOPED_PACKAGE_NAME);
    expect(manifest.publishConfig).toEqual({
      registry: GITHUB_PACKAGES_REGISTRY,
    });
    expect(manifest.repository).toEqual({
      type: "git",
      url: `git+https://github.com/${FORK_REPOSITORY}.git`,
      directory: "packages/openworkflow",
    });
    expect(manifest.bugs).toBe(`https://github.com/${FORK_REPOSITORY}/issues`);
  });

  test("keeps the packed version and runtime dependencies", () => {
    const manifest = toScopedManifest(upstreamManifest);

    expect(manifest.version).toBe(upstreamManifest.version);
    expect(manifest.peerDependencies).toEqual(
      upstreamManifest.peerDependencies,
    );
  });

  test("drops workspace-only fields that consumers must not run", () => {
    const manifest = toScopedManifest(upstreamManifest);

    expect(manifest).not.toHaveProperty("scripts");
    expect(manifest).not.toHaveProperty("devDependencies");
  });

  test("leaves the source manifest untouched", () => {
    toScopedManifest(upstreamManifest);

    expect(upstreamManifest.name).toBe("openworkflow");
    expect(upstreamManifest.scripts).toEqual({ build: "tsc" });
  });
});
