import { MetadataRoute } from 'next';

export type Message =
	| { success: string }
	| { error: string }
	| { message: string };

export type Sitemap = MetadataRoute.Sitemap;
export type Robots = MetadataRoute.Robots;
export type Manifest = MetadataRoute.Manifest;
export type Element = React.JSX.Element;

export interface AppData {
	name: string;
	lang: string;
	metadataBase: URL;
	description: string;
	pages: {
		[key: string]: {
			url: string;
			title: string;
		};
	};
}
