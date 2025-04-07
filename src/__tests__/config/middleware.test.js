import { NextRequest, NextResponse } from 'next/server';
import Middleware from '@/config/middleware';
import '@testing-library/jest-dom';
import Cors from '@/config/cors';

mock('next/server', () => ({
	NextResponse: {
		json: fn((_, options) => ({ headers: options.headers })),
		next: fn(() => ({ headers: new Map() })),
	},
}));

describe('Middleware', () => {
	let req;

	beforeEach(() => {
		req = {
			headers: new Map(),
			method: 'GET',
		};
	});

	it('allows CORS for allowed origins', () => {
		req.headers.set('origin', 'https://allowed.com');
		Cors.allowedOrigins = ['https://allowed.com'];

		const res = Middleware.intercept(req);

		expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
			'https://allowed.com',
		);
	});

	it('handles preflight requests correctly', () => {
		req.method = 'OPTIONS';
		req.headers.set('origin', 'https://allowed.com');
		Cors.allowedOrigins = ['https://allowed.com'];

		const res = Middleware.intercept(req);

		expect(res.headers['Access-Control-Allow-Origin']).toBe(
			'https://allowed.com',
		);
		expect(NextResponse.json).toHaveBeenCalled();
	});

	it('denies CORS for disallowed origins', () => {
		req.headers.set('origin', 'https://disallowed.com');
		Cors.allowedOrigins = ['https://allowed.com'];

		const res = Middleware.intercept(req);

		expect(res.headers.get('Access-Control-Allow-Origin')).toBeUndefined();
	});
});
