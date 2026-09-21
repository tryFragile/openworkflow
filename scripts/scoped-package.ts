/** Package name used when the fork's SDK is published to GitHub Packages. */
export const SCOPED_PACKAGE_NAME = "@tryfragile/openworkflow";

/** Registry that hosts the fork's scoped SDK releases. */
export const GITHUB_PACKAGES_REGISTRY = "https://npm.pkg.github.com";

/** Fork repository that the scoped SDK is published from. */
export const FORK_REPOSITORY = "tryFragile/openworkflow";

/** Subset of an npm manifest that the scoped rewrite reads or replaces. */
export interface PackageManifest {
  name: string;
  version: string;
  bugs?: unknown;
  devDependencies?: unknown;
  peerDependencies?: unknown;
  publishConfig?: unknown;
  repository?: unknown;
  scripts?: unknown;
  /** Every other manifest field is published unchanged. */
  [field: string]: unknown;
}

/**
 * Rewrite the packed SDK manifest so it publishes under the fork's scope. The
 * source workspace keeps the upstream `openworkflow` name so the CLI,
 * dashboard, examples, and upstream development workflow resolve the same
 * local workspace; only the packed manifest is scoped.
 * @param manifest - Manifest of the packed upstream SDK
 * @returns Manifest describing the scoped GitHub Packages release
 */
export function toScopedManifest(manifest: PackageManifest): PackageManifest {
  const published = { ...manifest };
  // Consumers never run the workspace build or install its test-only devDependencies.
  delete published.scripts;
  delete published.devDependencies;

  return {
    ...published,
    name: SCOPED_PACKAGE_NAME,
    bugs: `https://github.com/${FORK_REPOSITORY}/issues`,
    repository: {
      type: "git",
      url: `git+https://github.com/${FORK_REPOSITORY}.git`,
      directory: "packages/openworkflow",
    },
    publishConfig: { registry: GITHUB_PACKAGES_REGISTRY },
  };
}
