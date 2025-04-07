#!/usr/bin/env node
import { execute, script_run, run, orms } from '../util.mjs';
import { execSync } from 'node:child_process';
import fs from 'fs';

/**
 * @returns {void} void
 */
async function setup() {
	const supabase = orms.supabase;
	try {
		console.log(`::> Setting up supabase...`);
		supabase.files.map((file) => {
			console.log(`::> Adding ${file.name}: ${file.dir + file.file}`);
			fs.mkdirSync(file.dir, { recursive: true });
			fs.writeFileSync(file.dir + file.file, file.content);
		});

		console.log(`::> Adding dependencies: ${supabase.install}`);
		execSync(`bun add ${supabase.install}`, { stdio: 'inherit' });

		console.log(`::> Adding devDependencies: ${supabase.install}`);
		execSync(`bun add-D ${supabase.dev}`, { stdio: 'inherit' });

		console.log(`::> supabase setup complete.`);
		execute;
		console.log('::> Done.');
	} catch (err) {
		console.error(`-:> Error setting up supabase:`, err);
		process.exit(1);
	}
}

async function supabase() {
	const tasks = [
		{
			name: 'Set up supabase ORM',
			fn: setup,
		},
	];

	await script_run(tasks);
}

supabase();
