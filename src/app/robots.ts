import { Robots } from '@lib/types';
import Meta from '@config/meta';

export const dynamic = 'force-static';

export default function robots(): Robots {
	return Meta.robots;
}
