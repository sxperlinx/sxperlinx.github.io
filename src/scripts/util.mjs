import { execSync } from 'node:child_process';
import { select } from '@inquirer/prompts';

const auth = [
	{
		name: 'Middleware',
		dir: '.',
		file: '/middleware.ts',
		content: `
				import { updateSession } from '@/lib/supabase/middleware';
				import { type NextRequest } from 'next/server';

				export async function middleware(request: NextRequest) {
					return await updateSession(request);
				}

				export const config = {
					matcher: [
						/*
						* Match all request paths except:
						* - _next/static (static files)
						* - _next/image (image optimization files)
						* - favicon.ico (favicon file)
						* - images - .svg, .png, .jpg, .jpeg, .gif, .webp
						* Feel free to modify this pattern to include more paths.
						*/
						'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
					],
				};
			`,
	},
	{
		name: 'Auth Actions',
		dir: './src/lib/actions',
		file: '/auth.ts',
		content: `
			'use server';

			import { encodedRedirect } from 'lib/utils/encodedRedirect';
			import { User } from '@supabase/supabase-js';
			import { redirect } from 'next/navigation';
			import { headers } from 'next/headers';
			import { createClient } from 'lib/utils/supabase/server';

			const supabase = await createClient();

			export async function signUpAction(formData: FormData): Promise<never> {
				const email = formData.get('email')?.toString();
				const password = formData.get('password')?.toString();
				const origin = (await headers()).get('origin');

				if (!email || !password) {
					return encodedRedirect(
						'error',
						'/sign-up',
						'Email and password are required',
					);
				}

				const { error } = await supabase.auth.signUp({
					email,
					password,
					options: {
						emailRedirectTo: \`\${origin}/api/auth/callback\`,
					},
				});

				if (error) {
					console.error(error.code + ' ' + error.message);
					return encodedRedirect('error', '/sign-up', error.message);
				} else {
					return encodedRedirect(
						'success',
						'/sign-up',
						'Thanks for signing up! Please check your email for a verfication link.',
					);
				}
			}

			export async function signInAction(formData: FormData): Promise<never> {
				const email = formData.get('email') as string;
				const password = formData.get('password') as string;

				const { error } = await supabase.auth.signInWithPassword({
					email,
					password,
				});

				if (error) {
					return encodedRedirect('error', '/sign-in', error.message);
				}

				return redirect('/protected');
			}

			export async function forgotPasswordAction(formData: FormData): Promise<never> {
				const email = formData.get('email')?.toString();
				const origin = (await headers()).get('origin');
				const callbackUrl = formData.get('callbackUrl')?.toString();

				
				if (!email) {
					return encodedRedirect('error', '/forgot-password', 'Email is required');
				}
				
				const { error } = await supabase.auth.resetPasswordForEmail(email, {
					redirectTo: \`\${origin}/api/auth/callback?redirect_to=/protected/reset-password\`,
				});

				if (error) {
					console.error(error.message);
					return encodedRedirect(
						'error',
						'/forgot-password',
						'Could not reset password',
					);
				}

				if (callbackUrl) {
					return redirect(callbackUrl);
				}

				return encodedRedirect(
					'success',
					'/forgot-password',
					'Check your email for a link to reset your password.',
				);
			}

			export async function resetPasswordAction(formData: FormData): Promise<void> {

				const password = formData.get('password') as string;
				const confirmPassword = formData.get('confirmPassword') as string;

				if (!password || !confirmPassword) {
					encodedRedirect(
						'error',
						'/protected/reset-password',
						'Password and confirm password are required',
					);
				}

				if (password !== confirmPassword) {
					encodedRedirect(
						'error',
						'/protected/reset-password',
						'Passwords do not match',
					);
				}

				const { error } = await supabase.auth.updateUser({
					password: password,
				});

				if (error) {
					encodedRedirect(
						'error',
						'/protected/reset-password',
						'Password update failed',
					);
				}

				encodedRedirect('success', '/protected/reset-password', 'Password updated');
			}

			export async function signOutAction(): Promise<never> {
				await supabase.auth.signOut();
				return redirect('/sign-in');
			}

			export async function useSession(): Promise<User> {
				const {
					data: { user },
				} = await supabase.auth.getUser();

				if (!user) {
					return redirect('/sign-in');
				}

				return user;
			}

		`,
	},
	{
		name: 'Api Callback',
		dir: './src/app/api/auth/callback',
		file: '/route.ts',
		content: `
			import { createClient } from 'lib/utils/supabase/server';
			import { NextResponse } from 'next/server';

			export async function GET(request: Request): Promise<NextResponse> {
				// The \`/api/auth/callback\` route is required for the server-side auth flow implemented
				// by the SSR package. It exchanges an auth code for the user's session.
				// https://supabase.com/docs/guides/auth/server-side/nextjs
				const requestUrl = new URL(request.url);
				const code = requestUrl.searchParams.get('code');
				const origin = requestUrl.origin;
				const redirectTo = requestUrl.searchParams.get('redirect_to')?.toString();

				if (code) {
					const supabase = await createClient();
					await supabase.auth.exchangeCodeForSession(code);
				}

				if (redirectTo) {
					return NextResponse.redirect(\`\${origin}\${redirectTo}\`);
				}

				// URL to redirect to after sign up process completes
				return NextResponse.redirect(\`\${origin}/protected\`);
			}

		`,
	},
	{
		name: 'Auth layout',
		dir: './src/app/(auth)',
		file: '/layout.tsx',
		content: `
		export default async function Layout({
			children,
		}: {
			children: React.ReactNode;
		}) {
			return (
				<div className='flex max-w-7xl flex-col items-start gap-12'>{children}</div>
			);
		}
		`,
	},
	{
		name: 'Sign Up Page',
		dir: './src/app/(auth)/sign-up',
		file: '/page.tsx',
		content: `
		import { SubmitButton } from 'ui/components/buttons/submit-button';
		import { FormMessage } from 'ui/forms/form-message';
		import { signUpAction } from 'lib/actions/auth';
		import { Label } from 'ui/components/label';
		import { Input } from 'ui/components/input';
		import Message from 'lib/types/message';
		import Link from 'next/link';

		export default async function Signup(props: {
			searchParams: Promise<Message>;
		}) {
			const searchParams = await props.searchParams;
			if ('message' in searchParams) {
				return (
					<div className='flex h-screen w-full flex-1 items-center justify-center gap-2 p-4 sm:max-w-md'>
						<FormMessage message={searchParams} />
					</div>
				);
			}

			return (
				<>
					<form className='mx-auto flex min-w-64 max-w-64 flex-col'>
						<h1 className='text-2xl font-medium'>Sign up</h1>
						<p className='text text-sm text-foreground'>
							Already have an account?{' '}
							<Link
								className='font-medium text-primary underline'
								href='/sign-in'
							>
								Sign in
							</Link>
						</p>
						<div className='mt-8 flex flex-col gap-2 [&>input]:mb-3'>
							<Label htmlFor='email'>Email</Label>
							<Input
								name='email'
								placeholder='you@example.com'
								required
							/>
							<Label htmlFor='password'>Password</Label>
							<Input
								type='password'
								name='password'
								placeholder='Your password'
								minLength={8}
								required
							/>
							<SubmitButton
								formAction={signUpAction}
								pendingText='Signing up...'
							>
								Sign up
							</SubmitButton>
							<FormMessage message={searchParams} />
						</div>
					</form>
				</>
			);
		}
		`,
	},
	{
		name: 'Sign In Page',
		dir: './src/app/(auth)/sign-in',
		file: '/page.tsx',
		content: `
		import { SubmitButton } from 'ui/components/submit-button';
		import { FormMessage } from 'ui/forms/form-message';
		import { signInAction } from 'lib/actions/auth';
		import { Input } from 'ui/components/input';
		import { Label } from 'ui/components/label';
		import Message from 'lib/types/message';
		import Element from 'lib/types/element';
		import Link from 'next/link';

		export default async function Login(props: {
			searchParams: Promise<Message>;
		}): Promise<Element> {
			const searchParams = await props.searchParams;
			return (
				<form className='flex min-w-64 flex-1 flex-col'>
					<h1 className='text-2xl font-medium'>Sign in</h1>
					<p className='text-sm text-foreground'>
						Don&apos;t have an account?{' '}
						<Link
							className='font-medium text-foreground underline'
							href='/sign-up'
						>
							Sign up
						</Link>
					</p>
					<div className='mt-8 flex flex-col gap-2 [&>input]:mb-3'>
						<Label htmlFor='email'>Email</Label>
						<Input
							name='email'
							placeholder='you@example.com'
							required
						/>
						<div className='flex items-center justify-between'>
							<Label htmlFor='password'>Password</Label>
							<Link
								className='text-xs text-foreground underline'
								href='/forgot-password'
							>
								Forgot Password?
							</Link>
						</div>
						<Input
							type='password'
							name='password'
							placeholder='Your password'
							required
						/>
						<SubmitButton
							pendingText='Signing In...'
							formAction={signInAction}
						>
							Sign in
						</SubmitButton>
						<FormMessage message={searchParams} />
					</div>
				</form>
			);
		}
		`,
	},
	{
		name: 'Forgot Password Page',
		dir: './src/app/(auth)/forgot-password',
		file: '/page.tsx',
		content: `
		import { SubmitButton } from 'ui/components/submit-button';
		import { forgotPasswordAction } from 'lib/actions/auth';
		import { FormMessage } from 'ui/forms/form-message';
		import { Input } from 'ui/components/input';
		import { Label } from 'ui/components/label';
		import Message from 'lib/types/message';
		import Link from 'next/link';

		export default async function ForgotPassword(props: {
			searchParams: Promise<Message>;
		}) {
			const searchParams = await props.searchParams;
			return (
				<>
					<form className='mx-auto flex w-full min-w-64 max-w-64 flex-1 flex-col gap-2 text-foreground [&>input]:mb-6'>
						<div>
							<h1 className='text-2xl font-medium'>Reset Password</h1>
							<p className='text-sm text-secondary-foreground'>
								Already have an account?{' '}
								<Link
									className='text-primary underline'
									href='/sign-in'
								>
									Sign in
								</Link>
							</p>
						</div>
						<div className='mt-8 flex flex-col gap-2 [&>input]:mb-3'>
							<Label htmlFor='email'>Email</Label>
							<Input
								name='email'
								placeholder='you@example.com'
								required
							/>
							<SubmitButton formAction={forgotPasswordAction}>
								Reset Password
							</SubmitButton>
							<FormMessage message={searchParams} />
						</div>
					</form>
				</>
			);
		}
		`,
	},
	{
		name: 'Protected Page',
		dir: './src/app/protected',
		file: '/page.tsx',
		content: `
		import { useSession } from 'lib/actions/auth';
		export default async function ProtectedExamplePage() {
			const user = await useSession();

			return (
				<main>
					<h1>Welcome {user.email}</h1>
					<p>Your password: <strong>{user.id}</strong></p>
				</main>
			);
		}
		`,
	},
	{
		name: 'Reset Password Page',
		dir: './src/app/protected/reset-password',
		file: '/page.tsx',
		content: `
			import { resetPasswordAction } from 'lib/actions';
			import { FormMessage, Message } from 'ui/components/form-message';
			import { SubmitButton } from 'ui/components/submit-button';
			import { Input } from 'ui/components/ui/input';
			import { Label } from 'ui/components/ui/label';

			export default async function ResetPassword(props: {
				searchParams: Promise<Message>;
			}) {
				const searchParams = await props.searchParams;
				return (
					<form className="flex flex-col w-full max-w-md p-4 gap-2 [&>input]:mb-4">
						<h1 className="text-2xl font-medium">Reset password</h1>
						<p className="text-sm text-foreground/60">
							Please enter your new password below.
						</p>
						<Label htmlFor="password">New password</Label>
						<Input
							type="password"
							name="password"
							placeholder="New password"
							required
						/>
						<Label htmlFor="confirmPassword">Confirm password</Label>
						<Input
							type="password"
							name="confirmPassword"
							placeholder="Confirm password"
							required
						/>
						<SubmitButton formAction={resetPasswordAction}>
							Reset password
						</SubmitButton>
						<FormMessage message={searchParams} />
					</form>
				);
			}
		`,
	},
	{
		name: 'Encoded Redirect',
		dir: './src/_lib/utils',
		file: '/encodedRedirect.ts',
		content: `
		import { redirect } from 'next/navigation';

		/**
		 * Redirects to a specified path with an encoded message as a query parameter.
		 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
		 * @param {string} path - The path to redirect to.
		 * @param {string} message - The message to be encoded and added as a query parameter.
		 * @returns {never} This function doesn't return as it triggers a redirect.
		 */
		export function encodedRedirect(
			type: 'error' | 'success',
			path: string,
			message: string,
		) {
			return redirect(\`\${path}?\${type}=\${encodeURIComponent(message)}\`);
		}
		`,
	},
];

const dockerFiles = {
	files: [
		{
			name: 'Dockerfile Development',
			dir: './.docker',
			file: '/dev.Dockerfile',
			content: `FROM node:23.10-alpine3.20 AS base
FROM base AS builder

WORKDIR /app

COPY package.json bun.lockb ./

RUN npm install -g bun && bun install

COPY src ./src
COPY public ./public
COPY next.config.mjs .
COPY tsconfig.json .
COPY .env.development ./.env.local

ENV NEXT_TELEMETRY_DISABLED 1

CMD bun run dev
`,
		},
		{
			name: 'Dockerfile Production',
			dir: './.docker',
			file: '/Dockerfile',
			content: `
FROM node:23.10-alpine3.20 AS base
FROM base AS builder

WORKDIR /app

COPY package.json bun.lockb ./

RUN npm install -g bun && bun install

COPY src ./src
COPY public ./public
COPY next.config.mjs .
COPY tsconfig.json .
COPY .env.local ./.env.local

ENV NEXT_TELEMETRY_DISABLED 1

CMD bun run app:start
`,
		},
		{
			name: 'Compose Development',
			dir: '.',
			file: '/compose.dev.yml',
			content: `services:
  webapp:
    container_name: next-webapp-dev
    build:
      context: .
      dockerfile: .docker/dev.Dockerfile
    env_file: .env.development
    volumes:
      - ./src:/app/src
      - ./public:/app/public
      - ./.env.development:/app/.env.local
    restart: always
    ports:
      - 3000:3000
    networks:
      - front-tier
      - back-tier
    command: bun run dev
    depends_on:
      - postgres

  postgres:
    image: postgres:latest
    container_name: postgres-dev
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 123456
      POSTGRES_DB: dev_db
    volumes:
      - postgres_vol:/var/lib/postgresql/data
    ports:
      - 5432:5432
    networks:
      - back-tier

networks:
  front-tier:
    external: false
  back-tier:
    external: false

volumes:
  postgres_vol:
    external: false
    driver: local

`,
		},
		{
			name: 'Compose Production',
			dir: '.',
			file: '/compose.yml',
			content: `services:
  webapp:
    container_name: next-webapp
    build:
      context: .
      dockerfile: .docker/Dockerfile
    volumes:
      - ./src:/app/src
      - ./public:/app/public
      - ./.env.local:/app/.env.local
    restart: always
    ports:
      - '81:3000'
    networks:
      - front-tier
      - back-tier
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000']
      interval: 30s
      retries: 3
      start_period: 5s
      timeout: 10s
    depends_on:
      postgres:
        condition: service_healthy
  postgres:
    image: postgres:latest
    container_name: postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 123456
      POSTGRES_DB: postgres
    volumes:
      - postgres_vol:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    networks:
      - back-tier
    healthcheck:
      test: ['CMD', 'pg_isready', '-U', 'postgres']
      interval: 10s
      timeout: 30s
      retries: 5

  proxy:
    image: nginx:latest
    container_name: nginx-proxy
    volumes:
      - ./proxy/nginx.conf:/etc/nginx/conf.d/nginx.conf
    ports:
      - '80:80'
    networks:
      - front-tier
    depends_on:
      - webapp

networks:
  front-tier:
    external: false
  back-tier:
    external: false

volumes:
  postgres_vol:
    external: false
    driver: local
`,
		},
		{
			name: '.dockerignore File',
			dir: '.',
			file: '/.dockerignore',
			content: `.dockerignore
node_modules
npm-debug.log
README.md
.git
`,
		},
		{
			name: 'Nginx Dockerfile',
			dir: './proxy',
			file: '/Dockerfile',
			content: `FROM nginx:latest

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
`,
		},
		{
			name: 'Nginx Config',
			dir: './proxy',
			file: '/nginx.conf',
			content: `server {
  listen 80;
  listen [::]:80;
  server_name localhost;
  location / {
    proxy_pass http://localhost;
  }
}
`,
		},
	],
};

const orms = {
	supabase: {
		install: '@supabase/supabase-js @supabase/ssr',
		files: [
			{
				name: 'Server',
				dir: './src/lib/supabase',
				file: '/server.ts',
				content: `
'use server';

import { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient(): Promise<SupabaseClient> {
	const cookieStore = await cookies();

	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) => {
						cookieStore.set(name, value, options);
					});
				},
			},
		},
	);
}
				`,
			},
			{
				name: 'Client',
				dir: './src/lib/supabase',
				file: '/client.ts',
				content: `
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
createBrowserClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
				`,
			},
			{
				name: 'Middleware',
				dir: './src/lib/supabase',
				file: '/middleware.ts',
				content: `
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function updateSession(
	request: NextRequest,
): Promise<NextResponse> {
	let response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					);
					response = NextResponse.next({
						request,
					});
					cookiesToSet.forEach(({ name, value, options }) =>
						response.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	// This will refresh session if expired - required for Server Components
	// https://supabase.com/docs/guides/auth/server-side/nextjs
	const user = await supabase.auth.getUser();

	// protected routes
	if (request.nextUrl.pathname.startsWith('/protected') && user.error) {
		return NextResponse.redirect(new URL('/sign-in', request.url));
	}

	if (request.nextUrl.pathname === '/' && !user.error) {
		return NextResponse.redirect(new URL('/protected', request.url));
	}

	return response;
}
				`,
			},
		],
	},
	drizzle: {
		install: 'drizzle-orm pg dotenv',
		dev: 'drizzle-kit tsx @types/pg',
		files: [
			{
				name: 'Drizzle Index',
				dir: './src/db',
				file: '/index.ts',
				content: `
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(process.env.DATABASE_URL!);
				`,
			},
			{
				name: 'Drizzle Config',
				dir: '.',
				file: '/drizzle.config.ts',
				content: `
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	out: './src/db/migrations',
	schema: './src/db/schema.ts',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL!,
	},
});
				`,
			},
			{
				name: 'Schema',
				dir: './src/db',
				file: '/schema.ts',
				content: `
import { pgTable, varchar, uuid } from 'drizzle-orm/pg-core';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const example = pgTable('example', {
	id: uuid('id').primaryKey().notNull().$defaultFn(() => uuidv4()),
	name: varchar('name', { length: 255 }).unique().notNull(),
});

export type NewExample = InferInsertModel<typeof example>;
export type SelectExample = InferSelectModel<typeof example>;
				`,
			},
			{
				name: 'Env Config',
				dir: './src/db',
				file: '/envConfig.ts',
				content: `
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);
				`,
			},
		],
	},
	prisma: {
		install: '@prisma/client',
		dev: 'prisma tsx',
		run: ['prisma', 'prisma init'],
		files: [
			{
				name: 'Index',
				dir: './src/db',
				file: '/index.ts',
				content: `
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export default prisma;
				`,
			},
			{
				name: 'Schema',
				dir: './prisma',
				file: '/schema.prisma',
				content: `
datasource db {
	provider = "postgresql"
	url = env("DATABASE_URL")
}

generator client {
	provider = "prisma-client-js"
	output = "./generated/prisma-client-js"
}

model Example {
	id  String @id
	name String @db.VarChar(255)
}
					`,
			},
			{
				name: 'Env Config',
				dir: './src/db',
				file: '/envConfig.ts',
				content: `
import { loadEnvConfig } from '@next/env';

const projectDir = process.cwd();
loadEnvConfig(projectDir);
					`,
			},
		],
	},
};

/**
 *
 * @param {{message: string, command: string }[]} tasks
 * @returns {void} void
 */
function run(tasks) {
	try {
		tasks.forEach((task) => {
			console.log(`::> ${task.message}`);
			execSync(task.command, { stdio: 'inherit' });
		});
	} catch (err) {
		console.error(`-:> ${err} at ${tasks.values}`);
		process.exit(1);
	}
}

/**
 * @param {{ name: string, fn: Promise<void> }}
 * @returns void
 */
function execute({ name, fn }) {
	console.log(`::: ${name} :::`);
	fn();
}

async function script_run(tasks) {
	tasks.forEach((task, index) => {
		task.value = index;
	});

	if (tasks.length === 1) {
		execute(tasks[0]);
		return;
	}

	const taskChoice = await select({
		message: ':: What would you like to do?',
		choices: tasks,
	});

	execute(tasks[taskChoice]);
}

export { run, auth, orms, dockerFiles, execute, script_run };
