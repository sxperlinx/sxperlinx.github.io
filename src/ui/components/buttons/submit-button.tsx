'use client';

import Button from '@/ui/components/buttons/button';
import { SubmitButtonProps } from '@/lib/props';
import { useFormStatus } from 'react-dom';
import { Element } from '@/lib/types';

export function SubmitButton({
	children,
	pendingText = 'Submitting...',
	...props
}: SubmitButtonProps): Element {
	const { pending } = useFormStatus();

	return (
		<Button
			type='submit'
			aria-disabled={pending}
			{...props}
		>
			{pending ? pendingText : children}
		</Button>
	);
}
