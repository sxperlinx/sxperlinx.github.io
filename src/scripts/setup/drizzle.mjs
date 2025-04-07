#!/usr/bin/env node
import { script_run, run, orms } from '../util.mjs';
import { execSync } from 'node:child_process';
import fs from 'fs';

/**
 * @returns {void} void
 */
function setup() {
	const drizzle = orms.drizzle;
	try {
		console.log(`::> Setting up drizzle...`);
		drizzle.files.map((file) => {
			console.log(`::> Adding ${file.name}: ${file.dir + file.file}`);
			fs.mkdirSync(file.dir, { recursive: true });
			fs.writeFileSync(file.dir + file.file, file.content);
		});

		console.log(`::> Adding dependencies: ${drizzle.install}`);
		execSync(`bun add ${drizzle.install}`, { stdio: 'inherit' });

		console.log(`::> Drizzle setup complete.`);
	} catch (err) {
		console.error(`-:> Error setting up drizzle: ${err}`);
		process.exit(1);
	}
}

/**
 * @returns {void} void
 */
async function migrate() {
	const tasks = [
		{
			command: 'npx drizzle-kit generate',
			message: 'Generating schema',
		},
		{ command: 'npx drizzle-kit migrate', message: 'Migrating' },
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
			command: 'npx drizzle-kit push',
			message: 'Pushing schema',
		},
	];

	try {
		run(tasks);
	} catch (err) {
		console.error('-:> Error executing database migration script:', err);
	}
}

async function drizzle() {
	const tasks = [
		{
			name: 'Set up Drizzle ORM',
			fn: setup,
		},
		{
			name: 'Migrate Drizzle ORM to Database',
			fn: migrate,
		},
		{
			name: 'Push Drizzle ORM to Database',
			fn: push,
		},
	];

	await script_run(tasks);
}

drizzle();
