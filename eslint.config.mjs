// This community node is distributed for SELF-HOSTED n8n only (not the n8n Cloud
// registry), so we use the toolkit's self-hosted lint preset. This preset drops
// the Cloud-only `no-restricted-imports` / `no-restricted-globals` rules; the
// remaining disables below are intentional for this Kafka node.
import { configWithoutCloudSupport } from '@n8n/node-cli/eslint';

export default [
	...configWithoutCloudSupport,
	{
		files: ['nodes/**/*.ts', 'credentials/**/*.ts'],
		rules: {
			// Kafka client libs are imported directly in this self-hosted node.
			'@n8n/community-nodes/no-restricted-imports': 'off',
			// shared/kafkaConfig.ts uses dynamic require() to optionally load
			// compression codecs that may not be installed.
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
	{
		// The optional compression codecs (Snappy/LZ4/ZSTD) emit a console warning
		// when their package is unavailable; these diagnostics are intentional.
		files: ['nodes/**/shared/kafkaConfig.ts'],
		rules: {
			'no-console': 'off',
		},
	},
	{
		// The Kafka client libraries (kafkajs, schema-registry, compression codecs)
		// are genuine runtime dependencies that must be installed with the node on
		// a self-hosted instance; they intentionally remain in `dependencies`.
		files: ['package.json'],
		rules: {
			'@n8n/community-nodes/no-runtime-dependencies': 'off',
		},
	},
];
