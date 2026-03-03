import { config } from '@n8n/node-cli/eslint';

export default [
	...config,
	{
		files: ['nodes/**/*.ts', 'credentials/**/*.ts'],
		rules: {
			'@n8n/community-nodes/no-restricted-imports': 'off',
			'@n8n/community-nodes/credential-test-required': 'off',
			'@typescript-eslint/no-require-imports': 'off',
		},
	},
];
