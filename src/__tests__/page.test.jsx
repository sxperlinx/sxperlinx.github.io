import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/page';

describe('Home Page', () => {
	it('renders the heading', () => {
		render(<Home />);
		const heading = screen.getByRole('heading', { level: 1, name: /home/i });
		expect(heading).toBeInTheDocument();
	});

	it('renders the description paragraph', () => {
		render(<Home />);
		const paragraph = screen.getByText(
			/this app provides boilerplate configuration/i,
		);
		expect(paragraph).toBeInTheDocument();
	});
});
