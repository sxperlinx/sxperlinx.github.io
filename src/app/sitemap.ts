import { Sitemap } from '@lib/types';
import Meta from '@config/meta';

export const dynamic = 'force-static';

export default function sitemap(): Sitemap {
	return Meta.sitemap;
}
