import { InputProps } from '@/lib/props';
import { Element } from '@/lib/types';
import cn from '@/lib/utils';

export default function Input(
	{ className, type, ...props }: InputProps,
	ref: React.Ref<HTMLInputElement>,
): Element {
	return (
		<input
			type={type}
			className={cn(
				'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
}
