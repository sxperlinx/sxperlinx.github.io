import { Manifest } from '@lib/types';
import Meta from '@config/meta';

export const dynamic = 'force-static';

export default function manifest(): Manifest {
	return Meta.manifest;
}
