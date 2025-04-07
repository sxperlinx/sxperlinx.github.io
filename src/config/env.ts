export default class Env {
	public static readonly nodeEnv = process.env.NODE_ENV
		? process.env.NODE_ENV
		: 'development';
	public static readonly isDev = this.nodeEnv === 'development';
	public static readonly isProd = this.nodeEnv === 'production';
	public static readonly baseUrl = this.isDev
		? 'http://localhost:3000'
		: 'https://sxperlinx.github.io';
	// Add more environment variables here.
}
