#!/usr/bin/env node
import { script_run, run, orms } from '../util.mjs';
import { execSync } from 'node:child_process';
import fs from 'fs';

/**
 * @returns {void} void
 */
async function setup() {
	console.log(
		"::> IMPORTANT! The setup of prisma isn't fully working yet, use 'bunx db:drizzle' instead.",
	);
	const prisma = orms.prisma;
	try {
		console.log(`::> Adding dependencies: ${prisma.install}`);
		execSync(`bun add ${prisma.install}`, { stdio: 'inherit' });

		console.log(`::> Adding devDependencies: ${prisma.dev}`);
		execSync(`bun add -D ${prisma.dev}`, { stdio: 'inherit' });

		console.log('::> Initializing prisma CLI...');
		prisma.run.forEach((command) => {
			execSync(`bunx ${command}`, { stdio: 'inherit' });
		});

		console.log(`::> Setting up prisma files...`);
		prisma.files.map((file) => {
			console.log(`::> Adding ${file.name}: ${file.dir + file.file}`);
			fs.mkdirSync(file.dir, { recursive: true });
			fs.writeFileSync(file.dir + file.file, file.content);
		});

		console.log(`::> prisma setup complete.`);
		console.log(`::> Remember to run 'bunx prisma generate'.`);
	} catch (err) {
		console.error(`-:> Error setting up prisma:`, err);
		process.exit(1);
	}
}

/**
 * @returns {void} void
 */
async function migrate() {
	const tasks = [
		{
			command: 'npx prisma migrate dev',
			message: 'Migrating schema',
		},
	];

	try {
		run(tasks);
	} catch (err) {
		console.error('-:> Error executing database migration script:', err);
	}
}

/**
 * @returns {void} void
 */
async function push() {
	const tasks = [
		{
			command: 'npx prisma db push',
			message: 'Pushing schema',
		},
	];

	try {
		run(tasks);
	} catch (err) {
		console.error('-:> Error executing database migration script:', err);
	}
}

async function prisma() {
	const tasks = [
		{
			name: 'Set up prisma ORM',
			fn: setup,
		},
		{
			name: 'Migrate prisma ORM to Database',
			fn: migrate,
		},
		{
			name: 'Push prisma ORM to Database',
			fn: push,
		},
	];

	await script_run(tasks);
}

prisma();
