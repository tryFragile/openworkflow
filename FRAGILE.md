# Fragile OpenWorkflow fork

This repository is forked from [Chris's fork](https://github.com/cfelegy/openworkflow).
Its default branch is `feature/list-workflow-runs-by-status`, so it inherits that
branch's workflow run filters (`status` and `workflowName`) alongside
`BackendPostgres.fromPool`. On top of that, this fork:

- adds PostgreSQL connection options for IAM authentication and other dynamic
  passwords, including for startup migrations,
- raises the default workflow step limit from 1,000 to 5,000, and
- publishes the SDK as `@tryfragile/openworkflow` to GitHub Packages.

The source workspace keeps its upstream `openworkflow` name so the CLI, dashboard,
examples, and upstream development workflow keep resolving the same local
workspace. Only the published SDK manifest is scoped. The CLI and dashboard are
not published by the GitHub Packages workflow.

## Release history

`@tryfragile/openworkflow@0.9.0` and `0.9.1` were published to the public npm
registry in May 2026. The source for those releases was never pushed here: `0.9.1`
raises the workflow step limit to 5,000, and this repository carried the upstream
default of 1,000 until that change was restored alongside IAM support. Compare a
release against the tree before publishing:

```sh
npm view @tryfragile/openworkflow --registry=https://registry.npmjs.org versions
```

Releases move to GitHub Packages from `0.9.2` onwards. Publishing the same scope
to both npm and GitHub Packages makes consumer `.npmrc` scope mapping ambiguous,
so the npm releases are left in place but not extended.

## PostgreSQL IAM authentication

`BackendPostgres.connect(url, { postgresOptions })` forwards driver options to
both startup migrations and runtime connections. The migration pool remains
limited to one connection and is now closed even if migration or authentication
fails. Existing calls without `postgresOptions` retain their behavior.

```ts
import { Signer } from "@aws-sdk/rds-signer";
import { readFileSync } from "node:fs";
import { BackendPostgres } from "openworkflow/postgres";

const signer = new Signer({
  hostname: "database.us-east-1.rds.amazonaws.com",
  port: 5432,
  username: "workflow_user",
  region: "us-east-1",
});

const backend = await BackendPostgres.connect(
  "postgresql://workflow_user@database.us-east-1.rds.amazonaws.com:5432/app",
  {
    postgresOptions: {
      password: () => signer.getAuthToken(),
      ssl: { ca: readFileSync("global-bundle.pem", "utf8") },
    },
  },
);
```

`BackendPostgres.fromPool` still takes a caller-owned pool and therefore does not
accept `postgresOptions`; configure dynamic passwords on that pool directly.

The callback runs whenever postgres.js authenticates a new connection, including
after reconnecting. Reused authenticated connections do not need a new token. AWS
credentials are resolved by the signer in the consuming application; this SDK
does not add an AWS dependency or cache tokens. Configure RDS IAM, database grants,
the runtime role's `rds-db:connect` permission, and the RDS CA bundle separately.

The postgres.js 3.4.9 driver does not reliably propagate rejected password
callback promises: credential-provider failures can produce an unhandled rejection
and wait for the connection timeout. This fork forwards callbacks without changing
that driver behavior. PostgreSQL authentication failures do reject normally.

## Publishing and consuming

`packages/openworkflow/package.json` is set to `0.9.2`, the first GitHub Packages
release. Publishing is never automatic: the workflow is `workflow_dispatch` only,
runs on the default branch, and GitHub Packages rejects republished versions, so
every release needs a version bump first.

1. Bump the SDK version and run `npm install` to update `package-lock.json`.
2. Run `npm run ci` and push the tested change to this fork.
3. Run the **Publish GitHub package** workflow on the default branch. It repeats
   the full CI checks, then stages, publishes, and re-downloads the release using
   the repository's `GITHUB_TOKEN` with `packages: write`.

`npm run publish:stage-scoped` performs the staging step locally. It requires a
prior `npm run build`, rewrites the manifest through `scripts/scoped-package.ts`,
and prints the publishable directory.

Consumers can retain their existing imports with an npm alias:

```json
{
  "dependencies": {
    "openworkflow": "npm:@tryfragile/openworkflow@0.9.2"
  }
}
```

Map `@tryfragile` to `https://npm.pkg.github.com` in the consumer's `.npmrc`.
Package installation requires authentication and package read access. Grant
consumer repositories such as `tryFragile/cxp` Actions access in package settings.

See [postgres.js dynamic passwords](https://github.com/porsager/postgres#dynamic-passwords)
and [GitHub's npm registry documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry).
