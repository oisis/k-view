# Versioning and Releasing

K-View uses an automated semantic versioning and release process driven by Git tags and GitHub Actions.

## Automated Version Injection

You do not need to manually bump versions in `Chart.yaml` or `values.yaml` before every release! The CI/CD pipeline (`.github/workflows/release.yml`) handles this dynamically *during* the build process.

### How it works:
1. **Triggering a Release**: When you cut a new release by pushing a Git tag matching the pattern `v*` (e.g., `v0.17.0`), the pipeline is triggered.
2. **Docker Image Build**: The pipeline builds the Docker image and tags it automatically with the version extracted from the Git tag (e.g., `0.17.0`), along with the `latest` tag.
3. **Ephemeral File Overrides**: Before packaging the Helm chart, the pipeline automatically mutates the following files in the runner workspace:
    - `charts/k-view/Chart.yaml` -> Updates `version` and `appVersion` to `0.17.0`
    - `charts/k-view/values.yaml` -> Updates `image.tag` to `0.17.0`
4. **Helm Packaging**: The Helm chart is packaged using these dynamically injected values and pushed to the GitHub Container Registry (GHCR).

This approach ensures that the exported Helm chart and the published Docker image are perfectly in sync for the release, avoiding human error and reducing commit noise (no "bump version" placeholder commits needed).

## Commit Message Conventions & Version Bumping

To maintain a clear roadmap and predictable versioning, this project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. The prefix in your commit message determines which part of the Semantic Version (`MAJOR.MINOR.PATCH`) should be bumped for the next release:

| Prefix / Keyword | Example Commit Message | SemVer Bump | Description |
| :--- | :--- | :--- | :--- |
| `fix:` | `fix: properly parse dates in logs` | **PATCH** (x.x.Y) | Bug fixes and minor corrections. |
| `feat:` | `feat: add google sso login` | **MINOR** (x.Y.x) | New features or capabilities. |
| `BREAKING CHANGE:` or `!` | `feat!: change api response format` | **MAJOR** (Y.x.x) | Incompatible API changes that break backward compatibility. |

**Other common prefixes:** (These typically do not trigger a new release or bump version, but help organize history)
- `chore:` - Maintenance tasks, dependency updates.
- `docs:` - Updates to documentation.
- `refactor:` - Structural code changes that don't add features or fix bugs.
- `test:` - Adding or correcting tests.
- `style:` - Formatting changes (whitespace, semi-colons, etc).

*Note: When you are ready to release, you should summarize these commits and create a new Git tag (e.g., `v1.2.3`) matching the calculated SemVer bump based on the prefixes used since the last release. Pushing this tag will automatically trigger the CI pipeline to build and publish the artifacts.*

## Skipping the CI Pipeline (Saving Runner Minutes)

If you have already built and tested your changes locally and do not need GitHub Actions to run, you can instruct the pipeline to completely skip the build process.

Add `[skip ci]`, `[ci skip]`, or `[skip actions]` anywhere in your commit message. This is a native GitHub feature that aborts the workflow immediately without consuming any runner minutes.

**Examples:**
- `docs: update readme [skip ci]`
- `[skip ci] chore: update local test scripts`

### Development Builds
If you push to the `main` branch without a tag, the pipeline uses the existing, static version found in `Chart.yaml`. This enables testing and continuous deployment without prematurely cutting a formal semantic release.
