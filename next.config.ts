// @ts-check
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import type { NextConfig } from 'next';

// eslint-disable-next-line import/no-anonymous-default-export
export default (phase: unknown): NextConfig => {
	const isDev = phase === PHASE_DEVELOPMENT_SERVER;

	const nextConfig: NextConfig = {
		logging: isDev
			? {
					fetches: {
						fullUrl: true,
						hmrRefreshes: true,
					},
					incomingRequests: true,
				}
			: false,
		devIndicators: false,
		distDir: 'dist',
	};
	return nextConfig;
};
