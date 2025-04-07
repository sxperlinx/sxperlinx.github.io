#!/usr/bin/env node
import { script_run, run, dockerFiles } from '../util.mjs';
import { execSync } from 'node:child_process';
import { select } from '@inquirer/prompts';
import fs from 'fs';

/**
 * @returns {void} void
 */
function setup() {
	try {
		console.log('::> Setting up Docker...');
		dockerFiles.files.map((file) => {
			console.log(`::> Adding ${file.name}: ${file.dir + file.file}`);
			fs.mkdirSync(file.dir, { recursive: true });
			fs.writeFileSync(file.dir + file.file, file.content);
		});
		console.log('::> Docker setup complete.');
	} catch (err) {
		console.error(`-:> Error setting up Docker: ${err}`);
		process.exit(1);
	}
}

async function connect() {
	const tasks = [
		{
			command: 'docker exec -it postgres psql -U postgres',
			message: 'Connecting to database',
		},
	];

	try {
		run(tasks);
	} catch (err) {
		console.error(`-:> Error connecting to database: ${err}`);
		process.exit(1);
	}
}

function runContainer(env = 'development') {
	try {
		console.log(`::: Running in ${env} :::`);
		console.log(`::> Process cwd: ${process.cwd()}`);

		const composeFile =
			env === 'production' ? 'compose.yml' : 'compose.dev.yml';
		const networks = ['front-tier', 'back-tier'];

		execSync('docker network prune --force', { stdio: 'inherit' });

		if (env === 'development') {
			networks.forEach((network) => {
				console.log(`::> docker network create ${network}`);
				execSync(`docker network create ${network}`, { stdio: 'inherit' });
			});
		}

		console.log(`::> docker compose -f ${composeFile} up`);
		execSync(`docker compose -f ${composeFile} up`, { stdio: 'inherit' });
	} catch (err) {
		console.error('-:> ', err);
		process.exit(1);
	}
}

async function composeDown() {
	const composeFile = await select({
		message: '::> Select environment:',
		choices: [
			{ name: 'Development', value: 'compose.dev.yml' },
			{ name: 'Production', value: 'compose.yml' },
		],
	});

	console.log(`::> docker compose -f ${composeFile} down`);
	execSync(`docker compose -f ${composeFile} down`, { stdio: 'inherit' });
}

async function composeUp() {
	const env = await select({
		message: '::> Select environment:',
		choices: [
			{ name: 'Development', value: 'development' },
			{ name: 'Production', value: 'production' },
		],
	});

	runContainer(env);
}

async function docker() {
	const tasks = [
		{
			name: 'setup',
			fn: setup,
		},
		{
			name: 'compose up',
			fn: composeUp,
		},
		{
			name: 'compose down',
			fn: composeDown,
		},
		{
			name: 'connect to database',
			fn: connect,
		},
	];

	await script_run(tasks);
}

docker();
