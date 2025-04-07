import Typography from '@config/typography';
import { Children } from '@lib/props';
import { Element } from '@lib/types';
import Meta from '@config/meta';
import '@css/globals.css';

export const metadata = Meta.data;

export default function RootLayout({ children }: Children): Element {
	return (
		<html lang={Meta.app.lang}>
			<body className={`${Typography.font.className} antialiased`}>
				{children}
			</body>
		</html>
	);
}
