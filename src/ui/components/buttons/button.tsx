import { buttonVariants } from './button-variants';
// import { Slot } from '@radix-ui/react-slot';
import { ButtonProps } from '@/lib/props';
import { Element } from '@/lib/types';
import cn from '@/lib/utils';
import React from 'react';

function Button(
	{ className, variant, size, asChild = false, ...props }: ButtonProps,
	ref: React.Ref<HTMLButtonElement>,
): Element {
	// const Comp = asChild ? Slot : 'button';
	const Comp = 'button';
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			ref={ref}
			{...props}
		/>
	);
}

Button.displayName = 'Button';

export default React.forwardRef(Button);
