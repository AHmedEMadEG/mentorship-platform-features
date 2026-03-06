/** @type {import("prettier").Config} */
const config = {
	semi: true,
	useTabs: true,
	tabWidth: 1,
	singleQuote: true,
	printWidth: 120,
	trailingComma: 'es5',
	arrowParens: 'always',
	jsxSingleQuote: false,
	tailwindFunctions: ['clsx', 'tw'],
	endOfLine: 'auto',
	plugins: ['prettier-plugin-organize-imports', 'prettier-plugin-tailwindcss'],
};

export default config;
