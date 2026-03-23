module.exports = {
	root: true,
	env: {
		browser: true,
		node: true,
		es2020: true,
	},
	parser: 'vue-eslint-parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		parser: '@typescript-eslint/parser',
	},
	extends: ['eslint:recommended', 'plugin:vue/vue3-essential'],
	ignorePatterns: ['dist/', 'node_modules/', 'uploads/', 'data/'],
	rules: {
		'no-empty': 'off',
		'no-unused-vars': 'off',
		'no-redeclare': 'off',
	},
	overrides: [
		{
			files: ['*.ts', '*.tsx'],
			plugins: ['@typescript-eslint'],
			rules: {
				'@typescript-eslint/no-unused-vars': 'off',
				'no-undef': 'off',
			},
		},
		{
			files: ['*.vue'],
			rules: {
				'vue/multi-word-component-names': 'off',
			},
		},
	],
}
