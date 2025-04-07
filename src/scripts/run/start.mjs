#!/usr/bin/env node
import { run } from '../util.mjs';

const tasks = [
	{ msg: 'Building the project', cmd: 'next build' },
	{ msg: 'Running the project', cmd: 'next start' },
];

run(tasks);
