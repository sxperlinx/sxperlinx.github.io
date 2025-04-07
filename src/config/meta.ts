import { Sitemap, Robots, Manifest, AppData } from '@lib/types';
import { Metadata } from 'next';
import Env from '@config/env';

export default class Meta {
	static readonly title = 'Next-Boilerplate';

	static readonly app: AppData = {
		name: Meta.title,
		lang: 'en',
		metadataBase: new URL(Env.baseUrl),
		description: 'Next boilerplate template',
		pages: {
			home: {
				url: '/',
				title: `Home | ${Meta.title}`,
			},
			about: {
				url: '/about',
				title: 'About',
			},
			contact: {
				url: '/contact',
				title: 'Contact',
			},
			api: {
				url: '/api',
				title: 'API',
			},
		},
	};

	public static readonly data: Metadata = {
		title: {
			template: `%s | ${this.app.name}`,
			default: this.app.name,
		},
		description: this.app.description,
		metadataBase: this.app.metadataBase,
		applicationName: this.app.name,
		// Add more metadata here.
	};

	public static readonly sitemap: Sitemap = [
		{
			url: this.app.metadataBase.origin,
			lastModified: new Date(),
			changeFrequency: 'never',
			priority: 1,
		},
		// Add more sitemap routes here.
	];

	public static readonly robots: Robots = {
		rules: {
			userAgent: '*',
			allow: '/',
			disallow: ['/api/'],
		},
		sitemap: `${this.app.metadataBase.origin}/sitemap.xml`,
		// Add more robots rules here.
	};

	public static readonly manifest: Manifest = {
		name: 'Next-Boilerplate',
		short_name: 'Boilerplate',
		description: 'Next boilerplate',
		start_url: '/',
		display: 'standalone',
		background_color: '#ffffff',
		theme_color: '#000000',
		icons: [
			{
				src: '/icon/icon-192x192.png',
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: '/icon/icon-512x512.png',
				sizes: '512x512',
				type: 'image/png',
			},
			{
				src: '/icon/favicon.ico',
				sizes: 'any',
				type: 'image/x-icon',
			},
		],
	};
}
