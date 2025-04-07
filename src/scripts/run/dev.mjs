#!/usr/bin/env node
/* eslint-disable no-console */
import { execSync } from 'node:child_process';

const tasks = [
	{
		command: 'npx prettier --write .',
		message: 'Formatting code with Prettier',
	},
	{
		command: 'npx eslint . --fix || echo "ESLint failed, continuing..."',
		message: 'Linting code with ESLint',
	},
	{
		command: 'next dev --turbopack',
		message: 'Starting development server on port: 3000',
	},
];

try {
	tasks.forEach((task) => {
		console.log(`::> ${task.message}`);
		execSync(task.command, { stdio: 'inherit' });
	});

	console.log('::> Development Server script executed successfully');
} catch (err) {
	console.error('-:> Error executing development server script:', err);
	process.exit(1);
}
