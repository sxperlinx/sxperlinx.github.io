import { type NextRequest, NextResponse } from 'next/server';
import Middleware from '@config/middleware';

export async function middleware(req: NextRequest): Promise<NextResponse> {
	return Middleware.intercept(req);
}

export const config = {
	matcher: [
		'/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest).*)',
	],
};
