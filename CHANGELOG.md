# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-10-26

### Changed

- Updated the n8n development toolchain for full self-hosted compatibility with
  the latest n8n dev packages: `@n8n/node-cli` 0.13.0 → 0.53.4 and
  `n8n-workflow` 1.113.0 → 2.x (major jump). No node API or behavior changes;
  the TypeScript sources compiled clean against the 2.x typings.
- Lowered `@types/node` from `^25` to `^22` to match the supported n8n runtime (LTS).
- Switched `prepublishOnly` to `n8n-node prerelease` to follow the official
  toolkit release flow.
- Moved the ESLint config to the self-hosted preset (`configWithoutCloudSupport`),
  keeping the Kafka runtime dependencies allowed.

### Added

- Post-build step (`scripts/copy-codex.mjs`) that copies the `*.node.json` codex
  files into `dist/nodes/KafkaExtended/`, which the toolkit build does not do by
  default. Fixes node metadata (category/documentation links) being lost at runtime.

### Notes

- Targets self-hosted n8n only; the package keeps external Kafka dependencies by
  design and is not intended for n8n Cloud registry verification.
- Because this version targets `n8n-workflow` 2.x, it requires a recent n8n
  version that ships the 2.x line. This is a platform minimum-version bump, not a
  change to the node's own API.

## [0.3.0]

- Support configurable schema registry subject strategies.

## [0.2.0]

- Use `NodeOperationError` instead of `Error` to satisfy n8n lint rules.

## [0.1.3]

- Update repository field in `package.json`.
